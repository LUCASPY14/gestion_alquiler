from datetime import date
from itertools import count

from alquiler.models import (
    User, Ciudad, Inmueble, Inquilino, ContratoAlquiler, ContratoInquilino,
    RolInquilino, Pago, Gasto, TipoInmueble, TipoDocumento, CategoriaGasto, MetodoPago,
)

_seq = count(1)


def crear_propietario(**kwargs):
    n = next(_seq)
    defaults = {
        'username': f'propietario{n}',
        'email': f'propietario{n}@example.com',
        'password': 'clave-segura-123',
        'tipo_usuario': 'PROPIETARIO',
    }
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)


def crear_ciudad(**kwargs):
    n = next(_seq)
    defaults = {'nombre': f'Ciudad {n}'}
    defaults.update(kwargs)
    return Ciudad.objects.create(**defaults)


def crear_inmueble(propietario=None, ciudad=None, **kwargs):
    n = next(_seq)
    defaults = {
        'propietario': propietario or crear_propietario(),
        'codigo_referencia': f'INM-{n:04d}',
        'direccion': f'Calle Falsa {n}',
        'ciudad': ciudad or crear_ciudad(),
        'tipo': TipoInmueble.CASA,
        'precio_mensual': '1500000.00',
    }
    defaults.update(kwargs)
    return Inmueble.objects.create(**defaults)


def crear_inquilino(**kwargs):
    n = next(_seq)
    defaults = {
        'nombre': f'Nombre{n}',
        'apellido': f'Apellido{n}',
        'tipo_documento': TipoDocumento.DNI,
        'numero_documento': f'{10000000 + n}',
        'email': f'inquilino{n}@example.com',
        'telefono_principal': '0981000000',
    }
    defaults.update(kwargs)
    return Inquilino.objects.create(**defaults)


def crear_contrato(inmueble=None, inquilino=None, **kwargs):
    n = next(_seq)
    defaults = {
        'inmueble': inmueble or crear_inmueble(),
        'numero_contrato': f'CTR-{n:04d}',
        'fecha_inicio': date(2026, 1, 1),
        'fecha_fin': date(2026, 12, 31),
        'monto_mensual': '1500000.00',
        'deposito': '1500000.00',
    }
    defaults.update(kwargs)
    contrato = ContratoAlquiler.objects.create(**defaults)
    ContratoInquilino.objects.create(
        contrato=contrato,
        inquilino=inquilino or crear_inquilino(),
        rol=RolInquilino.TITULAR,
    )
    return contrato


def crear_pago(contrato=None, **kwargs):
    defaults = {
        'contrato': contrato or crear_contrato(),
        'fecha_pago': date(2026, 1, 5),
        'fecha_periodo': date(2026, 1, 1),
        'monto': '1500000.00',
        'metodo_pago': MetodoPago.TRANSFERENCIA,
    }
    defaults.update(kwargs)
    return Pago.objects.create(**defaults)


def crear_gasto(inmueble=None, **kwargs):
    defaults = {
        'inmueble': inmueble or crear_inmueble(),
        'descripcion': 'Reparación de cañería',
        'monto': '250000.00',
        'fecha': date(2026, 1, 10),
        'categoria': CategoriaGasto.REPARACION,
    }
    defaults.update(kwargs)
    return Gasto.objects.create(**defaults)
