# alquiler/serializers.py
from rest_framework import serializers
from .models import (
    User, Ciudad, Inmueble, Inquilino,
    ContratoAlquiler, ContratoInquilino, Pago, Gasto,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'telefono', 'tipo_usuario', 'first_name', 'last_name']


class CiudadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ciudad
        fields = '__all__'


class InmuebleSerializer(serializers.ModelSerializer):
    propietario_nombre = serializers.CharField(source='propietario.username', read_only=True)
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)

    class Meta:
        model = Inmueble
        fields = '__all__'


class InquilinoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquilino
        fields = '__all__'


class ContratoInquilinoSerializer(serializers.ModelSerializer):
    inquilino_nombre = serializers.CharField(source='inquilino.__str__', read_only=True)

    class Meta:
        model = ContratoInquilino
        fields = ['id', 'contrato', 'inquilino', 'inquilino_nombre', 'rol']


class ContratoAlquilerSerializer(serializers.ModelSerializer):
    inmueble_direccion = serializers.CharField(source='inmueble.direccion', read_only=True)
    inquilinos_detalle = ContratoInquilinoSerializer(source='contrato_inquilinos', many=True, read_only=True)

    class Meta:
        model = ContratoAlquiler
        fields = [
            'id', 'inmueble', 'inmueble_direccion', 'numero_contrato',
            'fecha_inicio', 'fecha_fin', 'monto_mensual', 'deposito',
            'periodicidad', 'estado', 'documento_contrato',
            'inquilinos_detalle', 'creado_en', 'actualizado_en',
        ]


class PagoSerializer(serializers.ModelSerializer):
    contrato_numero = serializers.CharField(source='contrato.numero_contrato', read_only=True)

    class Meta:
        model = Pago
        fields = '__all__'


class GastoSerializer(serializers.ModelSerializer):
    inmueble_direccion = serializers.CharField(source='inmueble.direccion', read_only=True)

    class Meta:
        model = Gasto
        fields = '__all__'
