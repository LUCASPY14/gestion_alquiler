import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from alquiler.models import User
from .factories import (
    crear_propietario, crear_ciudad, crear_inmueble, crear_inquilino,
    crear_contrato,
)

MEDIA_ROOT_TEMPORAL = tempfile.mkdtemp()


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

    def test_crear_contrato_solapado_devuelve_400_no_500(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        crear_contrato(
            inmueble=inmueble, numero_contrato='CTR-EXISTENTE', estado='ACT',
            fecha_inicio='2026-01-01', fecha_fin='2026-12-31',
        )

        response = self.client.post('/api/contratos/', {
            'inmueble': inmueble.id,
            'numero_contrato': 'CTR-NUEVO',
            'fecha_inicio': '2026-06-01',
            'fecha_fin': '2027-05-31',
            'monto_mensual': '1000000',
            'deposito': '1000000',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)

    def test_editar_contrato_sin_cambiar_fechas_no_choca_contra_si_mismo(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        contrato = crear_contrato(
            inmueble=inmueble, numero_contrato='CTR-EDITAR', estado='ACT',
            fecha_inicio='2026-01-01', fecha_fin='2026-12-31',
        )

        response = self.client.patch(f'/api/contratos/{contrato.id}/', {
            'monto_mensual': '1234567',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

    def test_contrato_finalizado_no_choca_contra_solapamiento(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        crear_contrato(
            inmueble=inmueble, numero_contrato='CTR-FIN', estado='FIN',
            fecha_inicio='2026-01-01', fecha_fin='2026-12-31',
        )

        response = self.client.post('/api/contratos/', {
            'inmueble': inmueble.id,
            'numero_contrato': 'CTR-NUEVO-2',
            'fecha_inicio': '2026-06-01',
            'fecha_fin': '2027-05-31',
            'monto_mensual': '1000000',
            'deposito': '1000000',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)


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

    def test_admin_carga_documento_identidad_y_direccion_del_propietario(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/users/{self.propietario.id}/', {
            'documento_identidad': '1234567',
            'direccion': 'Av. Mariscal López 1234, Asunción',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['documento_identidad'], '1234567')
        self.assertEqual(response.data['direccion'], 'Av. Mariscal López 1234, Asunción')

        self.propietario.refresh_from_db()
        self.assertEqual(self.propietario.documento_identidad, '1234567')


@override_settings(MEDIA_ROOT=MEDIA_ROOT_TEMPORAL)
class DocumentosAPITests(APITestCase):
    """Subida de archivos vía API (documento de identidad del inquilino y
    PDF del contrato) — multipart/form-data, como manda el frontend."""

    def setUp(self):
        self.propietario = crear_propietario()
        self.client.force_authenticate(user=self.propietario)

    def test_crea_inquilino_con_documento_pdf(self):
        archivo = SimpleUploadedFile('cedula.pdf', b'%PDF-1.4 contenido', content_type='application/pdf')
        payload = {
            'nombre': 'Marta', 'apellido': 'Duarte', 'tipo_documento': 'DNI',
            'numero_documento': '5551234', 'email': 'marta@example.com',
            'telefono_principal': '0981000000', 'documento_archivo': archivo,
        }
        response = self.client.post('/api/inquilinos/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNotNone(response.data['documento_archivo'])

    def test_rechaza_documento_de_inquilino_con_extension_no_permitida(self):
        archivo = SimpleUploadedFile('cedula.exe', b'contenido', content_type='application/octet-stream')
        payload = {
            'nombre': 'Marta', 'apellido': 'Duarte', 'tipo_documento': 'DNI',
            'numero_documento': '5551235', 'email': 'marta2@example.com',
            'telefono_principal': '0981000000', 'documento_archivo': archivo,
        }
        response = self.client.post('/api/inquilinos/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_crea_contrato_con_documento_pdf(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        archivo = SimpleUploadedFile('contrato.pdf', b'%PDF-1.4 contenido', content_type='application/pdf')
        payload = {
            'inmueble': inmueble.id, 'numero_contrato': 'CTR-DOC-001',
            'fecha_inicio': '2026-01-01', 'fecha_fin': '2026-12-31',
            'monto_mensual': '1000000', 'deposito': '1000000',
            'documento_contrato': archivo,
        }
        response = self.client.post('/api/contratos/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNotNone(response.data['documento_contrato'])

    def test_rechaza_documento_de_contrato_que_no_sea_pdf(self):
        inmueble = crear_inmueble(propietario=self.propietario)
        archivo = SimpleUploadedFile('contrato.jpg', b'contenido', content_type='image/jpeg')
        payload = {
            'inmueble': inmueble.id, 'numero_contrato': 'CTR-DOC-002',
            'fecha_inicio': '2026-01-01', 'fecha_fin': '2026-12-31',
            'monto_mensual': '1000000', 'deposito': '1000000',
            'documento_contrato': archivo,
        }
        response = self.client.post('/api/contratos/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
