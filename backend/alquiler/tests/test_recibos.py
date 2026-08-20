import tempfile
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from alquiler.models import EstadoPago
from .factories import crear_pago, crear_propietario, crear_inmueble, crear_contrato

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
