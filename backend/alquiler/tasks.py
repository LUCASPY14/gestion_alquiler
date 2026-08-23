from celery import shared_task

from .services.whatsapp import enviar_recibo_whatsapp


@shared_task
def enviar_recibo_whatsapp_task(pago_id):
    from .models import Pago

    try:
        pago = Pago.objects.select_related('contrato').get(pk=pago_id)
    except Pago.DoesNotExist:
        return False
    return enviar_recibo_whatsapp(pago)
