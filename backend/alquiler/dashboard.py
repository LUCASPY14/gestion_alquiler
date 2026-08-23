from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ContratoAlquiler, EstadoContrato, EstadoPago, Gasto, Inmueble,
    Inquilino, Pago, TipoUsuario,
)
from .permissions import es_staff_o_admin


def _restar_meses(fecha, meses):
    """Primer día del mes `meses` atrás (ej. restar_meses(hoy, 11) da el
    primer día de hace 11 meses, así el rango incluye 12 meses en total
    contando el actual)."""
    total = fecha.month - 1 - meses
    anio = fecha.year + total // 12
    mes = total % 12 + 1
    return fecha.replace(year=anio, month=mes, day=1)


def _primer_dia_del_mes_siguiente(fecha):
    if fecha.month == 12:
        return fecha.replace(year=fecha.year + 1, month=1, day=1)
    return fecha.replace(month=fecha.month + 1, day=1)


def _scope(qs, user, campo_propietario):
    if es_staff_o_admin(user):
        return qs
    return qs.filter(**{campo_propietario: user})


class DashboardResumenView(APIView):
    """Resumen agregado para el dashboard: todo en una sola consulta por
    sección en vez de que el frontend traiga registros crudos y calcule.
    No disponible para INQUILINO (son métricas del negocio, no de su
    contrato/pago individual, que ya tienen en sus propias páginas)."""

    def get(self, request):
        user = request.user
        if user.tipo_usuario == TipoUsuario.INQUILINO:
            return Response({'detail': 'No disponible para este tipo de usuario.'}, status=403)

        hoy = timezone.localdate()
        inicio_mes = hoy.replace(day=1)
        fin_mes = _primer_dia_del_mes_siguiente(hoy)

        inmuebles = _scope(Inmueble.objects.all(), user, 'propietario')
        inquilinos = _scope(Inquilino.objects.all(), user, 'registrado_por')
        contratos = _scope(ContratoAlquiler.objects.all(), user, 'inmueble__propietario')
        pagos = _scope(Pago.objects.all(), user, 'contrato__inmueble__propietario')
        gastos = _scope(Gasto.objects.all(), user, 'inmueble__propietario')

        # --- Ingresos por mes (últimos 12 meses, pagos ya cobrados) ---
        desde = _restar_meses(hoy, 11)
        ingresos_qs = (
            pagos.filter(estado=EstadoPago.PAGADO, fecha_pago__gte=desde)
            .annotate(mes=TruncMonth('fecha_pago'))
            .values('mes')
            .annotate(total=Sum('monto'))
            .order_by('mes')
        )
        por_mes = {item['mes'].strftime('%Y-%m'): item['total'] for item in ingresos_qs}
        ingresos_por_mes = []
        for i in range(11, -1, -1):
            clave = _restar_meses(hoy, i).strftime('%Y-%m')
            ingresos_por_mes.append({'mes': clave, 'total': por_mes.get(clave, 0)})

        # --- Estado de los pagos cuyo período es el mes actual ---
        pagos_del_mes = pagos.filter(fecha_periodo__gte=inicio_mes, fecha_periodo__lt=fin_mes)
        conteo = {row['estado']: row['n'] for row in pagos_del_mes.values('estado').annotate(n=Count('id'))}
        estado_pagos_mes = {
            'PAG': conteo.get(EstadoPago.PAGADO, 0),
            'PEN': conteo.get(EstadoPago.PENDIENTE, 0),
            'ANU': conteo.get(EstadoPago.ANULADO, 0),
        }

        # --- Alertas: pagos atrasados y contratos por vencer ---
        atrasados_qs = pagos.filter(
            estado=EstadoPago.PENDIENTE, fecha_periodo__lt=inicio_mes,
        ).select_related('contrato').order_by('fecha_periodo')
        limite_vencimiento = hoy + timedelta(days=30)
        por_vencer_qs = contratos.filter(
            estado=EstadoContrato.ACTIVO, fecha_fin__gte=hoy, fecha_fin__lte=limite_vencimiento,
        ).select_related('inmueble').order_by('fecha_fin')

        # --- Ocupación ---
        total_inmuebles = inmuebles.count()
        disponibles = inmuebles.filter(disponible=True).count()
        ocupados = total_inmuebles - disponibles

        return Response({
            'conteos': {
                'inmuebles': total_inmuebles,
                'inquilinos': inquilinos.count(),
                'contratos': contratos.count(),
                'pagos': pagos.count(),
                'gastos': gastos.count(),
            },
            'ingresos_por_mes': ingresos_por_mes,
            'estado_pagos_mes': estado_pagos_mes,
            'alertas': {
                'pagos_atrasados': {
                    'cantidad': atrasados_qs.count(),
                    'items': [
                        {
                            'id': p.id,
                            'contrato_numero': p.contrato.numero_contrato,
                            'fecha_periodo': p.fecha_periodo,
                            'monto': p.monto,
                        }
                        for p in atrasados_qs[:5]
                    ],
                },
                'contratos_por_vencer': {
                    'cantidad': por_vencer_qs.count(),
                    'items': [
                        {
                            'id': c.id,
                            'numero_contrato': c.numero_contrato,
                            'inmueble_direccion': c.inmueble.direccion,
                            'fecha_fin': c.fecha_fin,
                        }
                        for c in por_vencer_qs[:5]
                    ],
                },
            },
            'ocupacion': {
                'total': total_inmuebles,
                'disponibles': disponibles,
                'ocupados': ocupados,
                'porcentaje_ocupado': round(ocupados / total_inmuebles * 100, 1) if total_inmuebles else 0,
            },
        })
