from django.core.files.base import ContentFile
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    User, Ciudad, Inmueble, Inquilino,
    ContratoAlquiler, ContratoInquilino, Pago, Gasto, EstadoPago, TipoUsuario,
)
from .permissions import es_staff_o_admin
from .serializers import (
    UserSerializer, CiudadSerializer, InmuebleSerializer, InquilinoSerializer,
    ContratoAlquilerSerializer, ContratoInquilinoSerializer, PagoSerializer, GastoSerializer,
)
from .services.recibos import generar_recibo_pdf
from .tasks import enviar_recibo_whatsapp_task


class PropietarioScopedMixin:
    """Limita el queryset al dueño de los datos.

    - Staff/ADMIN: sin restricción.
    - INQUILINO: filtra por `inquilino_lookup` (ruta hasta Inquilino.usuario);
      si el viewset no define uno, no ve nada (ej. Gasto).
    - Resto (propietario): filtra por `propietario_lookup`.
    """
    propietario_lookup = None
    inquilino_lookup = None

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if es_staff_o_admin(user):
            return qs
        if user.tipo_usuario == TipoUsuario.INQUILINO:
            if not self.inquilino_lookup:
                return qs.none()
            return qs.filter(**{self.inquilino_lookup: user})
        if not self.propietario_lookup:
            return qs.none()
        return qs.filter(**{self.propietario_lookup: user})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if es_staff_o_admin(user):
            return qs
        return qs.filter(pk=user.pk)


class CiudadViewSet(viewsets.ModelViewSet):
    queryset = Ciudad.objects.all()
    serializer_class = CiudadSerializer


class InmuebleViewSet(PropietarioScopedMixin, viewsets.ModelViewSet):
    queryset = Inmueble.objects.select_related('propietario', 'ciudad').all()
    serializer_class = InmuebleSerializer
    filterset_fields = ['ciudad', 'tipo', 'disponible']
    search_fields = ['direccion', 'codigo_referencia']
    propietario_lookup = 'propietario'
    inquilino_lookup = 'contratos__contrato_inquilinos__inquilino__usuario'

    def perform_create(self, serializer):
        serializer.save(propietario=self.request.user)


class InquilinoViewSet(PropietarioScopedMixin, viewsets.ModelViewSet):
    queryset = Inquilino.objects.all()
    serializer_class = InquilinoSerializer
    propietario_lookup = 'registrado_por'
    inquilino_lookup = 'usuario'

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)


class ContratoAlquilerViewSet(PropietarioScopedMixin, viewsets.ModelViewSet):
    queryset = ContratoAlquiler.objects.select_related('inmueble').prefetch_related('contrato_inquilinos__inquilino').all()
    serializer_class = ContratoAlquilerSerializer
    filterset_fields = ['inmueble', 'estado']
    propietario_lookup = 'inmueble__propietario'
    inquilino_lookup = 'contrato_inquilinos__inquilino__usuario'


class ContratoInquilinoViewSet(PropietarioScopedMixin, viewsets.ModelViewSet):
    queryset = ContratoInquilino.objects.select_related('contrato', 'inquilino').all()
    serializer_class = ContratoInquilinoSerializer
    filterset_fields = ['contrato', 'inquilino', 'rol']
    propietario_lookup = 'contrato__inmueble__propietario'
    inquilino_lookup = 'inquilino__usuario'


class PagoViewSet(PropietarioScopedMixin, viewsets.ModelViewSet):
    queryset = Pago.objects.select_related('contrato').all()
    serializer_class = PagoSerializer
    filterset_fields = ['contrato', 'estado']
    propietario_lookup = 'contrato__inmueble__propietario'
    inquilino_lookup = 'contrato__contrato_inquilinos__inquilino__usuario'

    @action(detail=True, methods=['post'], url_path='regenerar-recibo')
    def regenerar_recibo(self, request, pk=None):
        pago = self.get_object()
        if pago.estado != EstadoPago.PAGADO:
            return Response(
                {'detail': 'Solo se puede emitir recibo para pagos en estado Pagado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        pdf_bytes = generar_recibo_pdf(pago)
        pago.recibo_pdf.save(f'{pago.numero_recibo}.pdf', ContentFile(pdf_bytes), save=True)
        enviar_recibo_whatsapp_task.delay(pago.pk)
        return Response(PagoSerializer(pago, context={'request': request}).data)


class GastoViewSet(PropietarioScopedMixin, viewsets.ModelViewSet):
    queryset = Gasto.objects.select_related('inmueble').all()
    serializer_class = GastoSerializer
    filterset_fields = ['inmueble', 'categoria', 'pagado']
    propietario_lookup = 'inmueble__propietario'
