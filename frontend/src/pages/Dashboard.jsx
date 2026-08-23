import { useEffect, useState } from 'react';
import api from '../api/client';
import { card, pageTitle } from '../ui/styles';

const RECURSOS = [
  { endpoint: 'inmuebles', label: 'Inmuebles' },
  { endpoint: 'inquilinos', label: 'Inquilinos' },
  { endpoint: 'contratos', label: 'Contratos' },
  { endpoint: 'pagos', label: 'Pagos' },
  { endpoint: 'gastos', label: 'Gastos' },
];

export default function Dashboard() {
  const [conteos, setConteos] = useState({});

  useEffect(() => {
    RECURSOS.forEach(({ endpoint }) => {
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
        {RECURSOS.map(({ endpoint, label }) => (
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
