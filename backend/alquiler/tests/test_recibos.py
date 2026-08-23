import tempfile
from io import BytesIO
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from pypdf import PdfReader
from rest_framework import status
from rest_framework.test import APITestCase

from alquiler.models import EstadoPago
from alquiler.services.recibos import _formatear_gs, generar_recibo_pdf
from .factories import (
    crear_pago, crear_propietario, crear_inmueble, crear_contrato, crear_inquilino,
)

MEDIA_ROOT_TEMPORAL = tempfile.mkdtemp()


def _mock_waha_ok(mock_post):
    mock_post.return_value = Mock(status_code=200, raise_for_status=lambda: None)


@override_settings(MEDIA_ROOT=MEDIA_ROOT_TEMPORAL)
@patch('alquiler.services.whatsapp.requests.post')
class GeneracionAutomaticaReciboTests(TestCase):
    def test_pago_pagado_genera_recibo_automaticamente(self, mock_post):
        _mock_waha_ok(mock_post)
        pago = crear_pago(estado=EstadoPago.PAGADO)
        self.assertTrue(pago.recibo_pdf)
        self.assertTrue(pago.recibo_pdf.read().startswith(b'%PDF'))

    def test_pago_pendiente_no_genera_recibo(self, mock_post):
        pago = crear_pago(estado=EstadoPago.PENDIENTE)
        self.assertFalse(pago.recibo_pdf)
        mock_post.assert_not_called()

    def test_actualizar_pago_a_pagado_genera_recibo(self, mock_post):
        _mock_waha_ok(mock_post)
        pago = crear_pago(estado=EstadoPago.PENDIENTE)
        self.assertFalse(pago.recibo_pdf)

        pago.estado = EstadoPago.PAGADO
        pago.save()
        pago.refresh_from_db()
        self.assertTrue(pago.recibo_pdf)

    def test_no_regenera_recibo_si_ya_fue_emitido(self, mock_post):
        _mock_waha_ok(mock_post)
        pago = crear_pago(estado=EstadoPago.PAGADO)
        nombre_original = pago.recibo_pdf.name

        pago.observaciones = 'corrección menor'
        pago.save()
        pago.refresh_from_db()

        self.assertEqual(pago.recibo_pdf.name, nombre_original)

    def test_pago_pagado_dispara_el_envio_por_whatsapp(self, mock_post):
        _mock_waha_ok(mock_post)
        crear_pago(estado=EstadoPago.PAGADO)
        # sendText + sendFile
        self.assertEqual(mock_post.call_count, 2)


def _texto_pdf(pdf_bytes):
    lector = PdfReader(BytesIO(pdf_bytes))
    return '\n'.join(pagina.extract_text() for pagina in lector.pages)


@override_settings(MEDIA_ROOT=MEDIA_ROOT_TEMPORAL)
class ContenidoReciboPdfTests(TestCase):
    def test_el_pdf_incluye_los_datos_del_pago(self):
        inquilino = crear_inquilino(nombre='Marta', apellido='Duarte')
        contrato = crear_contrato(inquilino=inquilino, numero_contrato='CTR-9001')
        pago = crear_pago(contrato=contrato, monto='1234567.00')

        pdf_bytes = generar_recibo_pdf(pago)
        texto = _texto_pdf(pdf_bytes)

        self.assertTrue(pdf_bytes.startswith(b'%PDF'))
        self.assertIn(pago.numero_recibo, texto)
        self.assertIn('CTR-9001', texto)
        self.assertIn('Duarte', texto)
        self.assertIn(_formatear_gs(pago.monto), texto)

    def test_el_pdf_incluye_observaciones_cuando_hay(self):
        pago = crear_pago(observaciones='Pago con descuento por pronto pago')

        texto = _texto_pdf(generar_recibo_pdf(pago))

        self.assertIn('Pago con descuento por pronto pago', texto)


@override_settings(MEDIA_ROOT=MEDIA_ROOT_TEMPORAL)
@patch('alquiler.services.whatsapp.requests.post')
class RegenerarReciboAPITests(APITestCase):
    def setUp(self):
        self.propietario = crear_propietario()
        self.inmueble = crear_inmueble(propietario=self.propietario)
        self.contrato = crear_contrato(inmueble=self.inmueble)
        self.client.force_authenticate(user=self.propietario)

    def test_regenerar_recibo_de_pago_pagado(self, mock_post):
        _mock_waha_ok(mock_post)
        pago = crear_pago(contrato=self.contrato, estado=EstadoPago.PAGADO)
        response = self.client.post(f'/api/pagos/{pago.id}/regenerar-recibo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['recibo_pdf'])

    def test_no_permite_regenerar_recibo_de_pago_pendiente(self, mock_post):
        pago = crear_pago(contrato=self.contrato, estado=EstadoPago.PENDIENTE)
        response = self.client.post(f'/api/pagos/{pago.id}/regenerar-recibo/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(MEDIA_ROOT=MEDIA_ROOT_TEMPORAL)
class SignalEmitirReciboAlPagarTests(TestCase):
    """Aísla la orquestación de la señal (¿llama al generador de PDF y
    despacha la tarea de WhatsApp con los argumentos correctos?) de la
    generación real del PDF y del envío real, que ya tienen su propia
    cobertura en ContenidoReciboPdfTests y test_whatsapp.py."""

    @patch('alquiler.signals.enviar_recibo_whatsapp_task')
    @patch('alquiler.signals.generar_recibo_pdf')
    def test_al_pasar_a_pagado_genera_el_pdf_y_despacha_la_tarea(self, mock_generar_pdf, mock_task):
        mock_generar_pdf.return_value = b'%PDF-1.4 contenido de prueba'
        pago = crear_pago(estado=EstadoPago.PENDIENTE)
        mock_generar_pdf.assert_not_called()

        pago.estado = EstadoPago.PAGADO
        pago.save()

        mock_generar_pdf.assert_called_once_with(pago)
        mock_task.delay.assert_called_once_with(pago.pk)

    @patch('alquiler.signals.enviar_recibo_whatsapp_task')
    @patch('alquiler.signals.generar_recibo_pdf')
    def test_si_ya_tiene_recibo_no_vuelve_a_generar_ni_a_despachar(self, mock_generar_pdf, mock_task):
        mock_generar_pdf.return_value = b'%PDF-1.4 contenido de prueba'
        pago = crear_pago(estado=EstadoPago.PAGADO)
        mock_generar_pdf.reset_mock()
        mock_task.reset_mock()

        pago.observaciones = 'corrección menor'
        pago.save()

        mock_generar_pdf.assert_not_called()
        mock_task.delay.assert_not_called()
