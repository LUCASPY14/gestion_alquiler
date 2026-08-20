# alquiler/serializers.py
from rest_framework import serializers
from .models import (
    User, Ciudad, Inmueble, Inquilino,
    ContratoAlquiler, ContratoInquilino, Pago, Gasto,
)
from .permissions import es_staff_o_admin


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
        read_only_fields = ['propietario']


class InquilinoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquilino
        fields = '__all__'
        read_only_fields = ['registrado_por', 'usuario']


class ContratoInquilinoSerializer(serializers.ModelSerializer):
    inquilino_nombre = serializers.CharField(source='inquilino.__str__', read_only=True)

    class Meta:
        model = ContratoInquilino
        fields = ['id', 'contrato', 'inquilino', 'inquilino_nombre', 'rol']

    def validate_contrato(self, value):
        user = self.context['request'].user
        if not es_staff_o_admin(user) and value.inmueble.propietario_id != user.id:
            raise serializers.ValidationError('Ese contrato no te pertenece.')
        return value

    def validate_inquilino(self, value):
        user = self.context['request'].user
        if not es_staff_o_admin(user) and value.registrado_por_id != user.id:
            raise serializers.ValidationError('Ese inquilino no está registrado por vos.')
        return value


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

    def validate_inmueble(self, value):
        user = self.context['request'].user
        if not es_staff_o_admin(user) and value.propietario_id != user.id:
            raise serializers.ValidationError('Ese inmueble no te pertenece.')
        return value


class PagoSerializer(serializers.ModelSerializer):
    contrato_numero = serializers.CharField(source='contrato.numero_contrato', read_only=True)

    class Meta:
        model = Pago
        fields = '__all__'

    def validate_contrato(self, value):
        user = self.context['request'].user
        if not es_staff_o_admin(user) and value.inmueble.propietario_id != user.id:
            raise serializers.ValidationError('Ese contrato no te pertenece.')
        return value


class GastoSerializer(serializers.ModelSerializer):
    inmueble_direccion = serializers.CharField(source='inmueble.direccion', read_only=True)

    class Meta:
        model = Gasto
        fields = '__all__'

    def validate_inmueble(self, value):
        user = self.context['request'].user
        if not es_staff_o_admin(user) and value.propietario_id != user.id:
            raise serializers.ValidationError('Ese inmueble no te pertenece.')
        return value
