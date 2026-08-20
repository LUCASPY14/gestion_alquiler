import tempfile
from unittest.mock import Mock, patch

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .factories import (
    crear_propietario, crear_ciudad, crear_inmueble, crear_inquilino,
    crear_contrato, crear_pago, crear_gasto,
)

MEDIA_ROOT_TEMPORAL = tempfile.mkdtemp()


class AislamientoEntrePropietariosTests(APITestCase):
    def setUp(self):
        self.a = crear_propietario()
        self.b = crear_propietario()
        self.inmueble_b = crear_inmueble(propietario=self.b)
        self.inquilino_b = crear_inquilino(registrado_por=self.b)
        self.contrato_b = crear_contrato(inmueble=self.inmueble_b, inquilino=self.inquilino_b)
        self.pago_b = crear_pago(contrato=self.contrato_b, estado='PEN')
        self.gasto_b = crear_gasto(inmueble=self.inmueble_b)
        self.client.force_authenticate(user=self.a)

    def test_no_ve_inmuebles_ajenos_en_el_listado(self):
        response = self.client.get('/api/inmuebles/')
        self.assertEqual(response.data['count'], 0)

    def test_no_ve_detalle_de_inmueble_ajeno(self):
        response = self.client.get(f'/api/inmuebles/{self.inmueble_b.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_no_puede_borrar_inmueble_ajeno(self):
        response = self.client.delete(f'/api/inmuebles/{self.inmueble_b.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_no_ve_inquilinos_ajenos(self):
        response = self.client.get('/api/inquilinos/')
        self.assertEqual(response.data['count'], 0)

    def test_no_ve_contratos_ajenos(self):
        response = self.client.get('/api/contratos/')
        self.assertEqual(response.data['count'], 0)

    def test_no_ve_pagos_ajenos(self):
        response = self.client.get('/api/pagos/')
        self.assertEqual(response.data['count'], 0)

    def test_no_ve_gastos_ajenos(self):
        response = self.client.get('/api/gastos/')
        self.assertEqual(response.data['count'], 0)

    def test_no_puede_crear_contrato_sobre_inmueble_ajeno(self):
        payload = {
            'inmueble': self.inmueble_b.id,
            'numero_contrato': 'CTR-INTRUSO',
            'fecha_inicio': '2026-01-01',
            'fecha_fin': '2026-12-31',
            'monto_mensual': '1000000',
            'deposito': '1000000',
        }
        response = self.client.post('/api/contratos/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_puede_crear_gasto_sobre_inmueble_ajeno(self):
        payload = {
            'inmueble': self.inmueble_b.id,
            'descripcion': 'Intento ajeno',
            'monto': '10000',
            'fecha': '2026-01-01',
            'categoria': 'OTRO',
        }
        response = self.client.post('/api/gastos/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_puede_crear_pago_sobre_contrato_ajeno(self):
        payload = {
            'contrato': self.contrato_b.id,
            'fecha_pago': '2026-02-01',
            'fecha_periodo': '2026-02-01',
            'monto': '1000000',
            'metodo_pago': 'EFEC',
        }
        response = self.client.post('/api/pagos/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_puede_vincular_inquilino_ajeno_a_contrato_propio(self):
        inmueble_a = crear_inmueble(propietario=self.a)
        contrato_a = crear_contrato(inmueble=inmueble_a)
        payload = {'contrato': contrato_a.id, 'inquilino': self.inquilino_b.id, 'rol': 'FIA'}
        response = self.client.post('/api/contrato-inquilinos/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inmueble_creado_queda_asignado_al_usuario_autenticado_no_al_payload(self):
        ciudad = crear_ciudad()
        payload = {
            'propietario': self.b.id,  # intento de spoofing, debe ser ignorado
            'codigo_referencia': 'INM-SPOOF',
            'direccion': 'Calle Falsa 1',
            'ciudad': ciudad.id,
            'tipo': 'CASA',
            'precio_mensual': '1000000',
        }
        response = self.client.post('/api/inmuebles/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['propietario'], self.a.id)


class VisibilidadStaffYAdminTests(APITestCase):
    def setUp(self):
        self.propietario = crear_propietario()
        self.inmueble = crear_inmueble(propietario=self.propietario)

    def test_admin_ve_inmuebles_de_cualquier_propietario(self):
        admin = crear_propietario(tipo_usuario='ADMIN')
        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/inmuebles/')
        self.assertEqual(response.data['count'], 1)

    def test_staff_ve_inmuebles_de_cualquier_propietario(self):
        staff = crear_propietario(is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.get('/api/inmuebles/')
        self.assertEqual(response.data['count'], 1)


@override_settings(MEDIA_ROOT=MEDIA_ROOT_TEMPORAL)
class PortalInquilinoTests(APITestCase):
    def setUp(self):
        parcheador = patch('alquiler.services.whatsapp.requests.post')
        mock_post = parcheador.start()
        mock_post.return_value = Mock(status_code=200, raise_for_status=lambda: None)
        self.addCleanup(parcheador.stop)

        self.propietario = crear_propietario()
        self.usuario_inquilino = crear_propietario(tipo_usuario='INQUILINO')
        self.inquilino = crear_inquilino(registrado_por=self.propietario, usuario=self.usuario_inquilino)
        self.inmueble = crear_inmueble(propietario=self.propietario)
        self.contrato = crear_contrato(inmueble=self.inmueble, inquilino=self.inquilino)
        self.pago = crear_pago(contrato=self.contrato, estado='PAG')

        self.otro_inquilino_usuario = crear_propietario(tipo_usuario='INQUILINO')

        self.client.force_authenticate(user=self.usuario_inquilino)

    def test_ve_su_propio_contrato(self):
        response = self.client.get('/api/contratos/')
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.contrato.id)

    def test_ve_su_propio_pago(self):
        response = self.client.get('/api/pagos/')
        self.assertEqual(response.data['count'], 1)

    def test_no_ve_gastos(self):
        crear_gasto(inmueble=self.inmueble)
        response = self.client.get('/api/gastos/')
        self.assertEqual(response.data['count'], 0)

    def test_otro_inquilino_no_ve_este_contrato(self):
        self.client.force_authenticate(user=self.otro_inquilino_usuario)
        response = self.client.get('/api/contratos/')
        self.assertEqual(response.data['count'], 0)

    def test_no_puede_crear_gasto(self):
        payload = {
            'inmueble': self.inmueble.id,
            'descripcion': 'Intento de inquilino',
            'monto': '10000',
            'fecha': '2026-01-01',
            'categoria': 'OTRO',
        }
        response = self.client.post('/api/gastos/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_puede_editar_su_propio_contrato(self):
        response = self.client.patch(f'/api/contratos/{self.contrato.id}/', {'estado': 'RES'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_puede_regenerar_recibo(self):
        response = self.client.post(f'/api/pagos/{self.pago.id}/regenerar-recibo/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
