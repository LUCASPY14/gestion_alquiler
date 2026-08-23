import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import api from '../api/client';
import { useResource } from './useResource';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useResource', () => {
  it('recorre todas las páginas del backend en vez de truncar en la primera', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/inmuebles/') {
        return Promise.resolve({
          data: { count: 3, next: '/inmuebles/?page=2', results: [{ id: 1 }, { id: 2 }] },
        });
      }
      if (url === '/inmuebles/?page=2') {
        return Promise.resolve({ data: { count: 3, next: null, results: [{ id: 3 }] } });
      }
      throw new Error(`URL inesperada: ${url}`);
    });

    const { result } = renderHook(() => useResource('inmuebles'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('expone un error legible si falla la carga', async () => {
    api.get.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useResource('inmuebles'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('No se pudo cargar la información.');
    expect(result.current.items).toEqual([]);
  });

  it('create/update/remove recargan la lista', async () => {
    api.get.mockResolvedValue({ data: { count: 0, next: null, results: [] } });
    api.post.mockResolvedValue({ data: { id: 99 } });
    api.patch.mockResolvedValue({});
    api.delete.mockResolvedValue({});

    const { result } = renderHook(() => useResource('inmuebles'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    api.get.mockClear();
    await result.current.create({ nombre: 'x' });
    expect(api.post).toHaveBeenCalledWith('/inmuebles/', { nombre: 'x' });
    expect(api.get).toHaveBeenCalledTimes(1); // recarga

    api.get.mockClear();
    await result.current.update(1, { nombre: 'y' });
    expect(api.patch).toHaveBeenCalledWith('/inmuebles/1/', { nombre: 'y' });
    expect(api.get).toHaveBeenCalledTimes(1);

    api.get.mockClear();
    await result.current.remove(1);
    expect(api.delete).toHaveBeenCalledWith('/inmuebles/1/');
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('create manda FormData (multipart) cuando el payload trae un archivo', async () => {
    api.get.mockResolvedValue({ data: { count: 0, next: null, results: [] } });
    api.post.mockResolvedValue({ data: { id: 1 } });

    const { result } = renderHook(() => useResource('inquilinos'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const archivo = new File(['contenido'], 'cedula.pdf', { type: 'application/pdf' });
    await result.current.create({ nombre: 'Ana', activo: true, documento_archivo: archivo });

    const [url, body] = api.post.mock.calls[0];
    expect(url).toBe('/inquilinos/');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('nombre')).toBe('Ana');
    expect(body.get('activo')).toBe('true'); // booleano explícito: ausente = checkbox sin marcar para DRF
    expect(body.get('documento_archivo')).toBe(archivo);
  });

  it('create manda JSON plano cuando no hay archivos en el payload', async () => {
    api.get.mockResolvedValue({ data: { count: 0, next: null, results: [] } });
    api.post.mockResolvedValue({ data: { id: 1 } });

    const { result } = renderHook(() => useResource('ciudades'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.create({ nombre: 'Luque' });

    const [, body] = api.post.mock.calls[0];
    expect(body).toEqual({ nombre: 'Luque' });
    expect(body).not.toBeInstanceOf(FormData);
  });
});
