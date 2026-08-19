from decimal import Decimal
from io import BytesIO

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _formatear_gs(monto):
    return f"Gs. {int(Decimal(monto)):,}".replace(',', '.')


def generar_recibo_pdf(pago):
    """Genera el PDF del recibo de un pago y devuelve sus bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2 * cm, leftMargin=2 * cm, rightMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    contrato = pago.contrato
    inmueble = contrato.inmueble
    titulares = ', '.join(
        str(ci.inquilino) for ci in contrato.contrato_inquilinos.select_related('inquilino')
    ) or '—'

    elementos = [
        Paragraph('RECIBO DE PAGO', styles['Title']),
        Paragraph(pago.numero_recibo, styles['Heading3']),
        Spacer(1, 0.5 * cm),
        Paragraph(f"Emitido el {timezone.localdate():%d/%m/%Y}", styles['Normal']),
        Spacer(1, 1 * cm),
    ]

    datos = [
        ['Inquilino(s)', titulares],
        ['Inmueble', f"{inmueble.codigo_referencia} - {inmueble.direccion}"],
        ['Contrato', contrato.numero_contrato],
        ['Período', f"{pago.fecha_periodo:%m/%Y}"],
        ['Fecha de pago', f"{pago.fecha_pago:%d/%m/%Y}"],
        ['Método de pago', pago.get_metodo_pago_display()],
        ['Monto', _formatear_gs(pago.monto)],
    ]
    tabla = Table(datos, colWidths=[4 * cm, 11 * cm])
    tabla.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.lightgrey),
    ]))
    elementos.append(tabla)

    if pago.observaciones:
        elementos.append(Spacer(1, 0.8 * cm))
        elementos.append(Paragraph(f"<b>Observaciones:</b> {pago.observaciones}", styles['Normal']))

    elementos.append(Spacer(1, 2.5 * cm))
    elementos.append(Paragraph('_' * 40, styles['Normal']))
    elementos.append(Paragraph('Firma', styles['Normal']))

    doc.build(elementos)
    return buffer.getvalue()
