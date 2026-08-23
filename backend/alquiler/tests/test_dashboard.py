from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from alquiler.models import EstadoContrato, EstadoPago
from .factories import (
    crear_contrato, crear_gasto, crear_inmueble, crear_inquilino, crear_pago,
    crear_propietario,
)


class DashboardResumenTests(APITestCase):
    def setUp(self):
        self.propietario = crear_propietario()
        self.otro_propietario = crear_propietario()
        self.hoy = timezone.localdate()
        self.inicio_mes = self.hoy.replace(day=1)

    def test_inquilino_no_puede_acceder(self):
        inquilino_usuario = crear_propietario(tipo_usuario='INQUILINO')
        self.client.force_authenticate(user=inquilino_usuario)
        response = self.client.get('/api/dashboard/resumen/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_conteos_y_ocupacion_scoped_por_propietario(self):
        inmueble_propio = crear_inmueble(propietario=self.propietario, disponible=True)
        crear_inmueble(propietario=self.propietario, disponible=False)
        crear_inmueble(propietario=self.otro_propietario, disponible=True)  # no debe contar

        self.client.force_authenticate(user=self.propietario)
        response = self.client.get('/api/dashboard/resumen/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['conteos']['inmuebles'], 2)
        self.assertEqual(response.data['ocupacion']['total'], 2)
        self.assertEqual(response.data['ocupacion']['disponibles'], 1)
        self.assertEqual(response.data['ocupacion']['ocupados'], 1)
        self.assertEqual(response.data['ocupacion']['porcentaje_ocupado'], 50.0)
        self.assertTrue(inmueble_propio.disponible)

    def test_ingresos_por_mes_suma_solo_pagos_pagados_del_mes_actual(self):
        contrato_a = crear_contrato(inmueble=crear_inmueble(propietario=self.propietario))
        contrato_b = crear_contrato(inmueble=crear_inmueble(propietario=self.propietario))
        crear_pago(contrato=contrato_a, estado=EstadoPago.PAGADO, monto='1000000',
                   fecha_pago=self.hoy, fecha_periodo=self.inicio_mes)
        crear_pago(contrato=contrato_b, estado=EstadoPago.PENDIENTE, monto='500000',
                   fecha_pago=self.hoy, fecha_periodo=self.inicio_mes)  # no cuenta: no está pagado

        self.client.force_authenticate(user=self.propietario)
        response = self.client.get('/api/dashboard/resumen/')

        ingresos = response.data['ingresos_por_mes']
        self.assertEqual(len(ingresos), 12)
        mes_actual = ingresos[-1]
        self.assertEqual(mes_actual['mes'], self.hoy.strftime('%Y-%m'))
        self.assertEqual(mes_actual['total'], 1000000)

    def test_estado_pagos_del_mes_cuenta_por_estado(self):
        contrato_a = crear_contrato(inmueble=crear_inmueble(propietario=self.propietario))
        contrato_b = crear_contrato(inmueble=crear_inmueble(propietario=self.propietario))
        crear_pago(contrato=contrato_a, estado=EstadoPago.PAGADO, fecha_periodo=self.inicio_mes)
        crear_pago(contrato=contrato_b, estado=EstadoPago.PENDIENTE, fecha_periodo=self.inicio_mes,
                   fecha_pago=self.hoy)

        self.client.force_authenticate(user=self.propietario)
        response = self.client.get('/api/dashboard/resumen/')

        self.assertEqual(response.data['estado_pagos_mes'], {'PAG': 1, 'PEN': 1, 'ANU': 0})

    def test_pagos_atrasados_solo_pendientes_con_periodo_anterior_al_mes_actual(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        contrato = crear_contrato(inmueble=inmueble)
        periodo_pasado = (self.inicio_mes - timedelta(days=1)).replace(day=1)
        crear_pago(contrato=contrato, estado=EstadoPago.PENDIENTE, fecha_periodo=periodo_pasado,
                   fecha_pago=self.hoy)
        crear_pago(contrato=contrato, estado=EstadoPago.PENDIENTE, fecha_periodo=self.inicio_mes,
                   fecha_pago=self.hoy)  # del mes actual: no es "atrasado" todavía

        self.client.force_authenticate(user=self.propietario)
        response = self.client.get('/api/dashboard/resumen/')

        atrasados = response.data['alertas']['pagos_atrasados']
        self.assertEqual(atrasados['cantidad'], 1)
        self.assertEqual(atrasados['items'][0]['contrato_numero'], contrato.numero_contrato)

    def test_contratos_por_vencer_dentro_de_30_dias(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        crear_contrato(
            inmueble=inmueble, estado=EstadoContrato.ACTIVO,
            fecha_inicio=self.hoy - timedelta(days=10), fecha_fin=self.hoy + timedelta(days=15),
        )
        inmueble2 = crear_inmueble(propietario=self.propietario)
        crear_contrato(
            inmueble=inmueble2, estado=EstadoContrato.ACTIVO,
            fecha_inicio=self.hoy - timedelta(days=10), fecha_fin=self.hoy + timedelta(days=90),
        )  # vence lejos: no debe aparecer

        self.client.force_authenticate(user=self.propietario)
        response = self.client.get('/api/dashboard/resumen/')

        por_vencer = response.data['alertas']['contratos_por_vencer']
        self.assertEqual(por_vencer['cantidad'], 1)

    def test_admin_ve_datos_de_todos_los_propietarios(self):
        crear_inmueble(propietario=self.propietario)
        crear_inmueble(propietario=self.otro_propietario)
        admin = crear_propietario(tipo_usuario='ADMIN')

        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/dashboard/resumen/')

        self.assertEqual(response.data['conteos']['inmuebles'], 2)
