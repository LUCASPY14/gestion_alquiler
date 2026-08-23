import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import BarChart from '../components/BarChart';
import Badge from '../components/Badge';
import { formatearFecha, formatearGs } from '../utils/format';
import { card, pageTitle } from '../ui/styles';

const RECURSOS_SIMPLES = [
  { endpoint: 'inmuebles', label: 'Inmuebles' },
  { endpoint: 'inquilinos', label: 'Inquilinos' },
  { endpoint: 'contratos', label: 'Contratos' },
  { endpoint: 'pagos', label: 'Pagos' },
  { endpoint: 'gastos', label: 'Gastos' },
];

const ESTADO_PAGO_TILE = [
  { clave: 'PAG', label: 'Pagados', tone: 'green' },
  { clave: 'PEN', label: 'Pendientes', tone: 'amber' },
  { clave: 'ANU', label: 'Anulados', tone: 'rose' },
];

function DashboardInquilino() {
  const [conteos, setConteos] = useState({});

  useEffect(() => {
    RECURSOS_SIMPLES.forEach(({ endpoint }) => {
      api
        .get(`/${endpoint}/`, { params: { page_size: 1 } })
        .then(({ data }) => setConteos((prev) => ({ ...prev, [endpoint]: data.count })))
        .catch(() => setConteos((prev) => ({ ...prev, [endpoint]: '—' })));
    });
  }, []);

  return (
    <div>
      <h1 className={pageTitle}>Resumen</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {RECURSOS_SIMPLES.map(({ endpoint, label }) => (
          <div className={card} key={endpoint}>
            <span className="block text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {conteos[endpoint] ?? '…'}
            </span>
            <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { esInquilino } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (esInquilino) return;
    api
      .get('/dashboard/resumen/')
      .then(({ data }) => setResumen(data))
      .catch(() => setError('No se pudo cargar el resumen.'));
  }, [esInquilino]);

  if (esInquilino) return <DashboardInquilino />;

  if (error) {
    return (
      <div>
        <h1 className={pageTitle}>Resumen</h1>
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      </div>
    );
  }

  if (!resumen) {
    return (
      <div>
        <h1 className={pageTitle}>Resumen</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      </div>
    );
  }

  const { conteos, ingresos_por_mes: ingresosPorMes, estado_pagos_mes: estadoPagosMes, alertas, ocupacion } = resumen;
  const totalAtrasados = alertas.pagos_atrasados.cantidad;
  const totalPorVencer = alertas.contratos_por_vencer.cantidad;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={pageTitle}>Resumen</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {RECURSOS_SIMPLES.map(({ endpoint, label }) => (
            <div className={card} key={endpoint}>
              <span className="block text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
                {conteos[endpoint]}
              </span>
              <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${card} lg:col-span-2`}>
          <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Ingresos por mes</h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Pagos cobrados en los últimos 12 meses</p>
          <BarChart datos={ingresosPorMes} />
        </div>

        <div className={card}>
          <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Ocupación</h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            {ocupacion.total > 0 ? `${ocupacion.ocupados} de ${ocupacion.total} inmuebles ocupados` : 'Sin inmuebles cargados'}
          </p>
          {ocupacion.total > 0 ? (
            <>
              <div className="mb-2 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
                {ocupacion.porcentaje_ocupado}%
              </div>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-accent-600 dark:bg-accent-400"
                  style={{ width: `${ocupacion.porcentaje_ocupado}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{ocupacion.ocupados} ocupados</span>
                <span>{ocupacion.disponibles} disponibles</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">—</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={card}>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Pagos del mes</h2>
          <div className="grid grid-cols-3 gap-3">
            {ESTADO_PAGO_TILE.map(({ clave, label, tone }) => (
              <div key={clave} className="text-center">
                <div className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {estadoPagosMes[clave]}
                </div>
                <Badge tone={tone}>{label}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Pagos atrasados</h2>
            {totalAtrasados > 0 && <Badge tone="rose">{totalAtrasados}</Badge>}
          </div>
          {totalAtrasados === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Sin pagos atrasados.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {alertas.pagos_atrasados.items.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700 dark:text-slate-300">{p.contrato_numero}</span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">{formatearGs(p.monto)}</span>
                </li>
              ))}
              {totalAtrasados > alertas.pagos_atrasados.items.length && (
                <li className="text-xs text-slate-400 dark:text-slate-500">
                  y {totalAtrasados - alertas.pagos_atrasados.items.length} más...
                </li>
              )}
            </ul>
          )}
          <Link to="/pagos" className="mt-3 inline-block text-xs font-medium text-accent-600 hover:underline dark:text-accent-400">
            Ver pagos →
          </Link>
        </div>

        <div className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Contratos por vencer</h2>
            {totalPorVencer > 0 && <Badge tone="amber">{totalPorVencer}</Badge>}
          </div>
          {totalPorVencer === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Ninguno en los próximos 30 días.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {alertas.contratos_por_vencer.items.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700 dark:text-slate-300">{c.numero_contrato}</span>
                  <span className="text-slate-500 dark:text-slate-400">{formatearFecha(c.fecha_fin)}</span>
                </li>
              ))}
              {totalPorVencer > alertas.contratos_por_vencer.items.length && (
                <li className="text-xs text-slate-400 dark:text-slate-500">
                  y {totalPorVencer - alertas.contratos_por_vencer.items.length} más...
                </li>
              )}
            </ul>
          )}
          <Link to="/contratos" className="mt-3 inline-block text-xs font-medium text-accent-600 hover:underline dark:text-accent-400">
            Ver contratos →
          </Link>
        </div>
      </div>
    </div>
  );
}
