import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, { setOnSessionExpired } from './client';

let mock;

beforeEach(() => {
  mock = new MockAdapter(api);
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  setOnSessionExpired(null);
});

afterEach(() => {
  mock.restore();
});

describe('cliente axios (cookies + CSRF)', () => {
  it('no manda X-CSRFToken en un GET', async () => {
    document.cookie = 'csrftoken=el-token-csrf';
    mock.onGet('/inmuebles/').reply((config) => {
      expect(config.headers['X-CSRFToken']).toBeUndefined();
      return [200, { results: [] }];
    });

    await api.get('/inmuebles/');
  });

  it('adjunta X-CSRFToken leído de la cookie en un POST', async () => {
    document.cookie = 'csrftoken=el-token-csrf';
    mock.onPost('/ciudades/').reply((config) => {
      expect(config.headers['X-CSRFToken']).toBe('el-token-csrf');
      return [201, { id: 1 }];
    });

    await api.post('/ciudades/', { nombre: 'Luque' });
  });

  it('sin cookie csrftoken, no manda el header (deja que el backend responda 403)', async () => {
    mock.onPost('/ciudades/').reply((config) => {
      expect(config.headers['X-CSRFToken']).toBeUndefined();
      return [201, { id: 1 }];
    });

    await api.post('/ciudades/', { nombre: 'Luque' });
  });

  it('ante un 401, intenta refrescar la cookie de sesión y reintenta la request original', async () => {
    let intentos = 0;
    mock.onGet('/pagos/').reply(() => {
      intentos += 1;
      return intentos === 1 ? [401] : [200, { results: [] }];
    });
    mock.onPost('/token/refresh/').reply(200, { detail: 'ok' });

    const response = await api.get('/pagos/');

    expect(response.status).toBe(200);
    expect(intentos).toBe(2);
  });

  it('si el refresh también falla, avisa que la sesión expiró y no reintenta en bucle', async () => {
    const onSessionExpired = vi.fn();
    setOnSessionExpired(onSessionExpired);

    mock.onGet('/pagos/').reply(401);
    mock.onPost('/token/refresh/').reply(401);

    await expect(api.get('/pagos/')).rejects.toBeTruthy();
    expect(onSessionExpired).toHaveBeenCalled();
    // Un GET a /pagos/ + un POST a /token/refresh/, sin reintentos extra.
    expect(mock.history.get.length).toBe(1);
    expect(mock.history.post.length).toBe(1);
  });
});
