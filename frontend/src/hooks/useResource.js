import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

async function fetchAllPages(endpoint, params) {
  let url = `/${endpoint}/`;
  let requestConfig = { params: { page_size: 200, ...params } };
  const acumulado = [];

  while (url) {
    const { data } = await api.get(url, requestConfig);
    if (!data.results) return data; // endpoint sin paginación
    acumulado.push(...data.results);
    url = data.next;
    requestConfig = undefined; // `next` ya viene con la query completa
  }
  return acumulado;
}

export function useResource(endpoint, { params } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return fetchAllPages(endpoint, params)
      .then(setItems)
      .catch(() => setError('No se pudo cargar la información.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload) {
    const { data } = await api.post(`/${endpoint}/`, payload);
    await load();
    return data;
  }

  async function update(id, payload) {
    await api.patch(`/${endpoint}/${id}/`, payload);
    await load();
  }

  async function remove(id) {
    await api.delete(`/${endpoint}/${id}/`);
    await load();
  }

  return { items, loading, error, create, update, remove, reload: load };
}
