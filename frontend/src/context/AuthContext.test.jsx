import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import api from '../api/client';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  setOnSessionExpired: vi.fn(),
}));

function Sonda() {
  const { isAuthenticated, cargandoSesion, tipoUsuario, login, logout } = useAuth();
  if (cargandoSesion) return <p>cargando</p>;
  return (
    <div>
      <p>autenticado: {String(isAuthenticated)}</p>
      <p>tipo: {tipoUsuario ?? 'ninguno'}</p>
      <button onClick={() => login('ana', 'clave')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('arranca en estado "cargando" y luego autenticado si /me/ responde 200', async () => {
    api.get.mockResolvedValue({ data: { id: 1, username: 'ana', tipo_usuario: 'PROPIETARIO' } });

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );

    expect(screen.getByText('cargando')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('autenticado: true')).toBeInTheDocument());
    expect(screen.getByText('tipo: PROPIETARIO')).toBeInTheDocument();
  });

  it('si /me/ falla (sin sesión), arranca sin autenticar', async () => {
    api.get.mockRejectedValue({ response: { status: 401 } });

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('autenticado: false')).toBeInTheDocument());
  });

  it('login() setea la sesión con los datos que devuelve el backend', async () => {
    api.get.mockRejectedValue({ response: { status: 401 } });
    api.post.mockResolvedValue({ data: { id: 2, username: 'ana', tipo_usuario: 'ADMIN' } });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('autenticado: false')).toBeInTheDocument());

    await user.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByText('autenticado: true')).toBeInTheDocument());
    expect(api.post).toHaveBeenCalledWith('/token/', { username: 'ana', password: 'clave' });
    expect(screen.getByText('tipo: ADMIN')).toBeInTheDocument();
  });

  it('logout() limpia la sesión aunque el POST al backend falle', async () => {
    api.get.mockResolvedValue({ data: { id: 1, username: 'ana', tipo_usuario: 'PROPIETARIO' } });
    api.post.mockRejectedValue(new Error('network'));
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('autenticado: true')).toBeInTheDocument());

    await user.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByText('autenticado: false')).toBeInTheDocument());
  });
});
