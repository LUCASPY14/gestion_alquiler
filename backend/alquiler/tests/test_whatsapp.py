import tempfile
from unittest.mock import Mock, patch

from django.core.files.base import ContentFile
from django.test import TestCase, override_settings
from requests.exceptions import ConnectionError as RequestsConnectionError

from alquiler.services.whatsapp import enviar_recibo_whatsapp, normalizar_telefono_py
from .factories import crear_pago, crear_contrato, crear_inquilino

MEDIA_ROOT_TEMPORAL = tempfile.mkdtemp()


class NormalizarTelefonoTests(TestCase):
    def test_numero_local_con_cero_inicial(self):
        self.assertEqual(normalizar_telefono_py('0981123456'), '595981123456@c.us')

    def test_numero_ya_con_codigo_de_pais(self):
        self.assertEqual(normalizar_telefono_py('595981123456'), '595981123456@c.us')

    def test_numero_con_simbolos(self):
        self.assertEqual(normalizar_telefono_py('+595 981 123 456'), '595981123456@c.us')

    def test_numero_vacio_devuelve_none(self):
        self.assertIsNone(normalizar_telefono_py(''))
        self.assertIsNone(normalizar_telefono_py(None))


@override_settings(MEDIA_ROOT=MEDIA_ROOT_TEMPORAL)
class EnviarReciboWhatsappTests(TestCase):
    def _pago_con_recibo(self, **kwargs_inquilino):
        defaults = {'telefono_principal': '0981123456'}
        defaults.update(kwargs_inquilino)
        inquilino = crear_inquilino(**defaults)
        contrato = crear_contrato(inquilino=inquilino)
        pago = crear_pago(contrato=contrato)
        pago.recibo_pdf.save('recibo-test.pdf', ContentFile(b'%PDF-1.4 contenido de prueba'))
        return pago

    @patch('alquiler.services.whatsapp.requests.post')
    def test_envia_texto_y_archivo_cuando_todo_esta_bien(self, mock_post):
        mock_post.return_value = Mock(status_code=200, raise_for_status=lambda: None)
        pago = self._pago_con_recibo()

        resultado = enviar_recibo_whatsapp(pago)

        self.assertTrue(resultado)
        self.assertEqual(mock_post.call_count, 2)
        url_texto, kwargs_texto = mock_post.call_args_list[0][0][0], mock_post.call_args_list[0][1]
        self.assertTrue(url_texto.endswith('/api/sendText'))
        self.assertEqual(kwargs_texto['json']['chatId'], '595981123456@c.us')
        url_archivo, kwargs_archivo = mock_post.call_args_list[1][0][0], mock_post.call_args_list[1][1]
        self.assertTrue(url_archivo.endswith('/api/sendFile'))
        self.assertEqual(kwargs_archivo['json']['file']['mimetype'], 'application/pdf')

    @patch('alquiler.services.whatsapp.requests.post')
    def test_no_lanza_si_waha_no_responde(self, mock_post):
        mock_post.side_effect = RequestsConnectionError('no se pudo conectar')
        pago = self._pago_con_recibo()

        resultado = enviar_recibo_whatsapp(pago)

        self.assertFalse(resultado)

    @patch('alquiler.services.whatsapp.requests.post')
    def test_no_envia_si_inquilino_no_tiene_telefono(self, mock_post):
        pago = self._pago_con_recibo(telefono_principal='')

        resultado = enviar_recibo_whatsapp(pago)

        self.assertFalse(resultado)
        mock_post.assert_not_called()

    @patch('alquiler.services.whatsapp.requests.post')
    def test_no_envia_si_contrato_no_tiene_inquilinos(self, mock_post):
        contrato = crear_contrato()
        contrato.contrato_inquilinos.all().delete()
        pago = crear_pago(contrato=contrato)
        pago.recibo_pdf.save('recibo-test.pdf', ContentFile(b'%PDF-1.4'))

        resultado = enviar_recibo_whatsapp(pago)

        self.assertFalse(resultado)
        mock_post.assert_not_called()
