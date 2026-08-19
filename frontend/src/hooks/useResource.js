import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

export function useResource(endpoint, { params } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .get(`/${endpoint}/`, { params: { page_size: 200, ...params } })
      .then(({ data }) => setItems(data.results ?? data))
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
