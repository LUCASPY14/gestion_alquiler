from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class TokenObtainPairConTipoUsuarioSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['tipo_usuario'] = user.tipo_usuario
        return token


class TokenObtainPairConTipoUsuarioView(TokenObtainPairView):
    serializer_class = TokenObtainPairConTipoUsuarioSerializer
