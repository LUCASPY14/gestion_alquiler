# alquiler/serializers.py
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import (
    User, Ciudad, Inmueble, Inquilino,
    ContratoAlquiler, ContratoInquilino, EstadoContrato, Pago, Gasto,
)
from .permissions import es_staff_o_admin


class UserSerializer(serializers.ModelSerializer):
    # write-only: nunca se devuelve: en create() y update() se guarda con
    # set_password (nunca en texto plano). Opcional en el payload: en un
    # update sin password, la contraseña actual queda como está.
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'telefono', 'documento_identidad',
            'direccion', 'tipo_usuario', 'first_name', 'last_name',
            'is_active', 'password',
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


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

    def validate(self, attrs):
        # Replica en Python la ExclusionConstraint de la DB (contrato_sin_
        # solapamiento_por_inmueble) para devolver un 400 prolijo en vez de
        # que el INSERT/UPDATE choque con la constraint y tire un 500 crudo.
        # La constraint sigue como respaldo ante una carrera entre requests
        # concurrentes; esto cubre el caso normal.
        inmueble = attrs.get('inmueble', getattr(self.instance, 'inmueble', None))
        estado = attrs.get('estado', getattr(self.instance, 'estado', EstadoContrato.ACTIVO))
        fecha_inicio = attrs.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
        fecha_fin = attrs.get('fecha_fin', getattr(self.instance, 'fecha_fin', None))

        if estado == EstadoContrato.ACTIVO and inmueble and fecha_inicio and fecha_fin:
            solapados = ContratoAlquiler.objects.filter(
                inmueble=inmueble, estado=EstadoContrato.ACTIVO,
                fecha_inicio__lt=fecha_fin, fecha_fin__gt=fecha_inicio,
            )
            if self.instance:
                solapados = solapados.exclude(pk=self.instance.pk)
            if solapados.exists():
                raise serializers.ValidationError(
                    'Ya existe un contrato activo para este inmueble que se superpone con estas fechas.',
                )
        return attrs


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
