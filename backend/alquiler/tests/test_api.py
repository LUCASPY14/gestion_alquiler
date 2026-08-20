from rest_framework import status
from rest_framework.test import APITestCase

from .factories import (
    crear_propietario, crear_ciudad, crear_inmueble, crear_inquilino,
    crear_contrato,
)


class AutenticacionTests(APITestCase):
    def test_endpoint_protegido_sin_token_devuelve_401(self):
        response = self.client.get('/api/inmuebles/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_con_credenciales_validas_devuelve_tokens(self):
        crear_propietario(username='lucas', password='clave-segura-123')
        response = self.client.post('/api/token/', {
            'username': 'lucas',
            'password': 'clave-segura-123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_con_credenciales_invalidas_devuelve_401(self):
        crear_propietario(username='lucas', password='clave-segura-123')
        response = self.client.post('/api/token/', {
            'username': 'lucas',
            'password': 'incorrecta',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class InmuebleAPITests(APITestCase):
    def setUp(self):
        self.propietario = crear_propietario()
        self.client.force_authenticate(user=self.propietario)

    def test_crear_inmueble(self):
        ciudad = crear_ciudad(nombre='Asunción')
        payload = {
            'codigo_referencia': 'INM-0001',
            'direccion': 'Av. España 123',
            'ciudad': ciudad.id,
            'tipo': 'CASA',
            'precio_mensual': '1500000.00',
        }
        response = self.client.post('/api/inmuebles/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['ciudad_nombre'], 'Asunción')
        self.assertEqual(response.data['propietario'], self.propietario.id)

    def test_listar_inmuebles(self):
        crear_inmueble(propietario=self.propietario)
        crear_inmueble(propietario=self.propietario)
        response = self.client.get('/api/inmuebles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filtrar_inmuebles_por_ciudad(self):
        asuncion = crear_ciudad(nombre='Asunción')
        luque = crear_ciudad(nombre='Luque')
        crear_inmueble(propietario=self.propietario, ciudad=asuncion)
        crear_inmueble(propietario=self.propietario, ciudad=luque)

        response = self.client.get(f'/api/inmuebles/?ciudad={asuncion.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_no_permite_crear_inmueble_con_precio_negativo(self):
        ciudad = crear_ciudad()
        payload = {
            'codigo_referencia': 'INM-0002',
            'direccion': 'Av. España 456',
            'ciudad': ciudad.id,
            'tipo': 'CASA',
            'precio_mensual': '-100',
        }
        response = self.client.post('/api/inmuebles/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ContratoAPITests(APITestCase):
    def setUp(self):
        self.propietario = crear_propietario()
        self.client.force_authenticate(user=self.propietario)

    def test_contrato_incluye_detalle_de_inquilinos(self):
        inquilino = crear_inquilino(nombre='Ana', apellido='Gómez', registrado_por=self.propietario)
        inmueble = crear_inmueble(propietario=self.propietario)
        contrato = crear_contrato(inmueble=inmueble, inquilino=inquilino)

        response = self.client.get(f'/api/contratos/{contrato.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['inquilinos_detalle']), 1)
        self.assertEqual(response.data['inquilinos_detalle'][0]['rol'], 'TIT')

    def test_filtrar_contratos_por_estado(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        crear_contrato(inmueble=inmueble, numero_contrato='CTR-ACTIVO', estado='ACT')
        crear_contrato(inmueble=inmueble, numero_contrato='CTR-FINALIZADO', estado='FIN')

        response = self.client.get('/api/contratos/?estado=ACT')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['numero_contrato'], 'CTR-ACTIVO')
