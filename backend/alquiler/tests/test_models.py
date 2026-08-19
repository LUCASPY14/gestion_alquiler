from datetime import date

from django.db import IntegrityError, transaction
from django.test import TestCase

from alquiler.models import EstadoContrato
from .factories import (
    crear_ciudad, crear_inmueble, crear_inquilino, crear_contrato,
    crear_pago, crear_gasto,
)


class InmuebleConstraintsTests(TestCase):
    def test_precio_mensual_debe_ser_positivo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_inmueble(precio_mensual='0')

    def test_precio_mensual_positivo_se_guarda_bien(self):
        inmueble = crear_inmueble(precio_mensual='500000')
        inmueble.refresh_from_db()
        self.assertEqual(str(inmueble.precio_mensual), '500000.00')


class InquilinoConstraintsTests(TestCase):
    def test_no_permite_mismo_tipo_y_numero_de_documento(self):
        crear_inquilino(tipo_documento='DNI', numero_documento='1234567')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_inquilino(tipo_documento='DNI', numero_documento='1234567')

    def test_permite_mismo_numero_con_distinto_tipo_documento(self):
        crear_inquilino(tipo_documento='DNI', numero_documento='1234567')
        # No debe explotar: mismo número, tipo de documento distinto.
        crear_inquilino(tipo_documento='PAS', numero_documento='1234567')


class ContratoConstraintsTests(TestCase):
    def test_fecha_fin_debe_ser_posterior_a_fecha_inicio(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_contrato(fecha_inicio=date(2026, 6, 1), fecha_fin=date(2026, 1, 1))

    def test_monto_mensual_debe_ser_positivo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_contrato(monto_mensual='0')

    def test_deposito_no_puede_ser_negativo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_contrato(deposito='-1000')

    def test_no_permite_contratos_activos_solapados_en_mismo_inmueble(self):
        inmueble = crear_inmueble()
        crear_contrato(
            inmueble=inmueble,
            numero_contrato='CTR-A',
            fecha_inicio=date(2026, 1, 1),
            fecha_fin=date(2026, 6, 30),
            estado=EstadoContrato.ACTIVO,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_contrato(
                    inmueble=inmueble,
                    numero_contrato='CTR-B',
                    fecha_inicio=date(2026, 6, 1),
                    fecha_fin=date(2026, 12, 31),
                    estado=EstadoContrato.ACTIVO,
                )

    def test_permite_contratos_consecutivos_sin_solapar(self):
        inmueble = crear_inmueble()
        crear_contrato(
            inmueble=inmueble,
            numero_contrato='CTR-A',
            fecha_inicio=date(2026, 1, 1),
            fecha_fin=date(2026, 6, 30),
        )
        # No debe explotar: arranca el mismo día que termina el anterior, sin solapar.
        crear_contrato(
            inmueble=inmueble,
            numero_contrato='CTR-B',
            fecha_inicio=date(2026, 6, 30),
            fecha_fin=date(2026, 12, 31),
        )

    def test_permite_solapamiento_si_contrato_anterior_no_esta_activo(self):
        inmueble = crear_inmueble()
        crear_contrato(
            inmueble=inmueble,
            numero_contrato='CTR-A',
            fecha_inicio=date(2026, 1, 1),
            fecha_fin=date(2026, 6, 30),
            estado=EstadoContrato.RESCINDIDO,
        )
        # No debe explotar: el contrato solapado no está activo.
        crear_contrato(
            inmueble=inmueble,
            numero_contrato='CTR-B',
            fecha_inicio=date(2026, 3, 1),
            fecha_fin=date(2026, 12, 31),
            estado=EstadoContrato.ACTIVO,
        )


class PagoConstraintsTests(TestCase):
    def test_monto_debe_ser_positivo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_pago(monto='0')

    def test_no_permite_dos_pagos_para_el_mismo_periodo_y_contrato(self):
        contrato = crear_contrato()
        crear_pago(contrato=contrato, fecha_periodo=date(2026, 1, 1))
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_pago(contrato=contrato, fecha_periodo=date(2026, 1, 1))

    def test_permite_pagos_de_distintos_periodos(self):
        contrato = crear_contrato()
        crear_pago(contrato=contrato, fecha_periodo=date(2026, 1, 1))
        # No debe explotar: mismo contrato, período distinto.
        crear_pago(contrato=contrato, fecha_periodo=date(2026, 2, 1))


class GastoConstraintsTests(TestCase):
    def test_monto_debe_ser_positivo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_gasto(monto='0')


class CiudadTests(TestCase):
    def test_nombre_es_unico(self):
        crear_ciudad(nombre='Asunción')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                crear_ciudad(nombre='Asunción')
