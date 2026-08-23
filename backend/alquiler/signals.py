from django.core.files.base import ContentFile
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import EstadoPago, Pago
from .services.recibos import generar_recibo_pdf
from .tasks import enviar_recibo_whatsapp_task


@receiver(post_save, sender=Pago)
def emitir_recibo_al_pagar(sender, instance, created, **kwargs):
    if instance.estado != EstadoPago.PAGADO or instance.recibo_pdf:
        return

    pdf_bytes = generar_recibo_pdf(instance)
    instance.recibo_pdf.save(
        f'{instance.numero_recibo}.pdf', ContentFile(pdf_bytes), save=True,
    )
    enviar_recibo_whatsapp_task.delay(instance.pk)
