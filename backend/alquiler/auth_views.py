from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer


class TokenObtainPairConTipoUsuarioSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['tipo_usuario'] = user.tipo_usuario
        return token


def _set_auth_cookies(response, access, refresh=None):
    comunes = dict(
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/',
    )
    response.set_cookie(
        'access_token', access,
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
        **comunes,
    )
    if refresh is not None:
        response.set_cookie(
            'refresh_token', refresh,
            max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
            **comunes,
        )


def _datos_usuario(user):
    return {
        'id': user.id,
        'username': user.username,
        'tipo_usuario': user.tipo_usuario,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }


@method_decorator(ensure_csrf_cookie, name='post')
class LoginView(APIView):
    """Autentica y setea access/refresh token como cookies httpOnly.
    El cuerpo de la respuesta solo lleva datos no sensibles (para que el
    frontend arme la sesión sin poder leer el JWT)."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = TokenObtainPairConTipoUsuarioSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed:
            # Sin autenticadores en esta vista, DRF no puede mandar el header
            # WWW-Authenticate y degradaría esto a 403; lo devolvemos como
            # el 401 que corresponde a un login fallido.
            return Response({'detail': 'Credenciales inválidas.'}, status=401)
        tokens = serializer.validated_data
        response = Response(_datos_usuario(serializer.user))
        _set_auth_cookies(response, str(tokens['access']), str(tokens['refresh']))
        return response


class RefreshView(APIView):
    """Lee el refresh token de la cookie (no del body) y renueva la cookie
    de access token."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'detail': 'No hay sesión activa.'}, status=401)

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response({'detail': 'La sesión expiró, iniciá sesión de nuevo.'}, status=401)

        response = Response({'detail': 'ok'})
        _set_auth_cookies(response, serializer.validated_data['access'])
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        response = Response({'detail': 'ok'})
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        return response


@method_decorator(ensure_csrf_cookie, name='get')
class MeView(APIView):
    """Sesión actual. El frontend la llama al arrancar la app para saber si
    la cookie de sesión sigue siendo válida (y de paso recibe la cookie CSRF)."""

    def get(self, request):
        return Response(_datos_usuario(request.user))
