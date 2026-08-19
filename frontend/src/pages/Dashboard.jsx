import { useEffect, useState } from 'react';
import api from '../api/client';

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
      <h1>Resumen</h1>
      <div className="cards">
        {RECURSOS.map(({ endpoint, label }) => (
          <div className="card" key={endpoint}>
            <span className="card-value">{conteos[endpoint] ?? '…'}</span>
            <span className="card-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
