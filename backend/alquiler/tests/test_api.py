from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from alquiler.models import User
from .factories import (
    crear_propietario, crear_ciudad, crear_inmueble, crear_inquilino,
    crear_contrato,
)


class AutenticacionTests(APITestCase):
    def test_endpoint_protegido_sin_token_devuelve_401(self):
        response = self.client.get('/api/inmuebles/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_con_credenciales_validas_setea_cookies_httponly(self):
        crear_propietario(username='lucas', password='clave-segura-123')
        response = self.client.post('/api/token/', {
            'username': 'lucas',
            'password': 'clave-segura-123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'lucas')
        self.assertNotIn('access', response.data)
        self.assertTrue(response.cookies['access_token']['httponly'])
        self.assertTrue(response.cookies['refresh_token']['httponly'])

    def test_login_con_credenciales_invalidas_devuelve_401(self):
        crear_propietario(username='lucas', password='clave-segura-123')
        response = self.client.post('/api/token/', {
            'username': 'lucas',
            'password': 'incorrecta',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_el_access_token_incluye_el_tipo_de_usuario(self):
        crear_propietario(username='ana', password='clave-segura-123', tipo_usuario='ADMIN')
        response = self.client.post('/api/token/', {
            'username': 'ana',
            'password': 'clave-segura-123',
        })
        token = AccessToken(response.cookies['access_token'].value)
        self.assertEqual(token['tipo_usuario'], 'ADMIN')


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


class GestionUsuariosAPITests(APITestCase):
    def setUp(self):
        self.admin = crear_propietario(tipo_usuario='ADMIN')
        self.propietario = crear_propietario()

    def test_propietario_no_puede_crear_usuarios(self):
        self.client.force_authenticate(user=self.propietario)
        response = self.client.post('/api/users/', {
            'username': 'intruso', 'password': 'clave-segura-123', 'tipo_usuario': 'ADMIN',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_propietario_no_puede_editar_a_otro_usuario(self):
        self.client.force_authenticate(user=self.propietario)
        response = self.client.patch(f'/api/users/{self.admin.id}/', {'tipo_usuario': 'PROPIETARIO'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_crea_usuario_con_password_hasheada_y_puede_loguearse(self):
        # format='json' para reflejar cómo llama el frontend real (axios manda
        # JSON); con el formato multipart por default del test client, un
        # BooleanField ausente del payload se interpreta como un checkbox HTML
        # sin marcar (is_active=False), algo que no pasa con JSON.
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/users/', {
            'username': 'nuevo_propietario',
            'password': 'clave-nueva-123',
            'email': 'nuevo@example.com',
            'tipo_usuario': 'PROPIETARIO',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertNotIn('password', response.data)

        creado = User.objects.get(username='nuevo_propietario')
        self.assertNotEqual(creado.password, 'clave-nueva-123')
        self.assertTrue(creado.check_password('clave-nueva-123'))
        self.assertTrue(creado.is_active)

        self.client.force_authenticate(user=None)
        login = self.client.post('/api/token/', {'username': 'nuevo_propietario', 'password': 'clave-nueva-123'})
        self.assertEqual(login.status_code, status.HTTP_200_OK, login.data)

    def test_admin_cambia_password_de_otro_usuario(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/users/{self.propietario.id}/cambiar-password/', {
            'password': 'password-reseteada-123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.propietario.refresh_from_db()
        self.assertTrue(self.propietario.check_password('password-reseteada-123'))

    def test_propietario_no_puede_cambiar_password_ajena(self):
        self.client.force_authenticate(user=self.propietario)
        response = self.client.post(f'/api/users/{self.admin.id}/cambiar-password/', {
            'password': 'lo-que-sea-123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cambiar_password_valida_fortaleza(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/users/{self.propietario.id}/cambiar-password/', {
            'password': '123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
