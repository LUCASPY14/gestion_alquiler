import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [inmuebles, setInmuebles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/inmuebles/')
      .then(({ data }) => setInmuebles(data.results ?? data))
      .catch(() => setError('No se pudo conectar con la API'));
  }, []);

  return (
    <div>
      <h1>Inmuebles</h1>
      {error && <p>{error}</p>}
      <ul>
        {inmuebles.map((inmueble) => (
          <li key={inmueble.id}>
            {inmueble.codigo_referencia} - {inmueble.direccion}
          </li>
        ))}
      </ul>
    </div>
  );
}
