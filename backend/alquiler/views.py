from django.core.files.base import ContentFile
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    User, Ciudad, Inmueble, Inquilino,
    ContratoAlquiler, ContratoInquilino, Pago, Gasto, EstadoPago,
)
from .serializers import (
    UserSerializer, CiudadSerializer, InmuebleSerializer, InquilinoSerializer,
    ContratoAlquilerSerializer, ContratoInquilinoSerializer, PagoSerializer, GastoSerializer,
)
from .services.recibos import generar_recibo_pdf


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class CiudadViewSet(viewsets.ModelViewSet):
    queryset = Ciudad.objects.all()
    serializer_class = CiudadSerializer
    permission_classes = [permissions.IsAuthenticated]


class InmuebleViewSet(viewsets.ModelViewSet):
    queryset = Inmueble.objects.select_related('propietario', 'ciudad').all()
    serializer_class = InmuebleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['ciudad', 'tipo', 'disponible']
    search_fields = ['direccion', 'codigo_referencia']


class InquilinoViewSet(viewsets.ModelViewSet):
    queryset = Inquilino.objects.all()
    serializer_class = InquilinoSerializer
    permission_classes = [permissions.IsAuthenticated]


class ContratoAlquilerViewSet(viewsets.ModelViewSet):
    queryset = ContratoAlquiler.objects.select_related('inmueble').prefetch_related('contrato_inquilinos__inquilino').all()
    serializer_class = ContratoAlquilerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['inmueble', 'estado']


class ContratoInquilinoViewSet(viewsets.ModelViewSet):
    queryset = ContratoInquilino.objects.select_related('contrato', 'inquilino').all()
    serializer_class = ContratoInquilinoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['contrato', 'inquilino', 'rol']


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.select_related('contrato').all()
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['contrato', 'estado']

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
        return Response(PagoSerializer(pago, context={'request': request}).data)


class GastoViewSet(viewsets.ModelViewSet):
    queryset = Gasto.objects.select_related('inmueble').all()
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['inmueble', 'categoria', 'pagado']
