import base64
import logging
import re

import requests
from django.conf import settings

from .recibos import _formatear_gs

logger = logging.getLogger(__name__)


def normalizar_telefono_py(telefono):
    """Convierte un teléfono paraguayo en formato local (ej. 0981123456) al
    chatId que espera WAHA (595981123456@c.us). Devuelve None si no hay nada
    que normalizar."""
    digitos = re.sub(r'\D', '', telefono or '')
    if not digitos:
        return None
    if digitos.startswith('0'):
        digitos = '595' + digitos[1:]
    elif not digitos.startswith('595'):
        digitos = '595' + digitos
    return f'{digitos}@c.us'


def _resolver_inquilino_titular(contrato):
    vinculos = list(contrato.contrato_inquilinos.select_related('inquilino'))
    if not vinculos:
        return None
    titular = next((v for v in vinculos if v.rol == 'TIT'), vinculos[0])
    return titular.inquilino


def enviar_recibo_whatsapp(pago):
    """Envía el recibo de un pago por WhatsApp vía WAHA.

    Best-effort: nunca lanza una excepción (para no romper el guardado del
    pago si WAHA no está disponible). Devuelve True si se pudo enviar.
    """
    inquilino = _resolver_inquilino_titular(pago.contrato)
    if inquilino is None:
        logger.warning(
            'No se envió el recibo %s: el contrato %s no tiene inquilinos vinculados.',
            pago.numero_recibo, pago.contrato.numero_contrato,
        )
        return False

    chat_id = normalizar_telefono_py(inquilino.telefono_principal)
    if chat_id is None:
        logger.warning(
            'No se envió el recibo %s: %s no tiene teléfono cargado.',
            pago.numero_recibo, inquilino,
        )
        return False

    if not pago.recibo_pdf:
        logger.warning('No se envió el recibo %s: todavía no tiene PDF generado.', pago.numero_recibo)
        return False

    headers = {'X-Api-Key': settings.WAHA_API_KEY}
    base_url = settings.WAHA_URL.rstrip('/')
    mensaje = (
        f"Hola {inquilino.nombre}, te compartimos el recibo de tu pago del contrato "
        f"{pago.contrato.numero_contrato}, período {pago.fecha_periodo:%m/%Y}, "
        f"por {_formatear_gs(pago.monto)}."
    )

    try:
        requests.post(
            f'{base_url}/api/sendText',
            json={'session': settings.WAHA_SESSION, 'chatId': chat_id, 'text': mensaje},
            headers=headers, timeout=10,
        ).raise_for_status()

        # No cerramos el archivo: pago.recibo_pdf puede ser el mismo objeto
        # que sigue usando quien llamó a esta función (ej. la señal que lo
        # generó), así que solo leemos y volvemos el cursor al inicio.
        pago.recibo_pdf.open('rb')
        pdf_base64 = base64.b64encode(pago.recibo_pdf.read()).decode('ascii')
        pago.recibo_pdf.seek(0)

        requests.post(
            f'{base_url}/api/sendFile',
            json={
                'session': settings.WAHA_SESSION,
                'chatId': chat_id,
                'file': {
                    'mimetype': 'application/pdf',
                    'filename': f'{pago.numero_recibo}.pdf',
                    'data': pdf_base64,
                },
            },
            headers=headers, timeout=10,
        ).raise_for_status()
        return True
    except requests.RequestException:
        logger.warning(
            'No se pudo enviar el recibo %s por WhatsApp a %s.',
            pago.numero_recibo, chat_id, exc_info=True,
        )
        return False
