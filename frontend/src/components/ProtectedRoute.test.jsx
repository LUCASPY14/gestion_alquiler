import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderConRuta() {
  return render(
    <MemoryRouter initialEntries={['/inmuebles']}>
      <Routes>
        <Route path="/login" element={<p>pantalla de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/inmuebles" element={<p>contenido protegido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('mientras se resuelve la sesión, no redirige ni muestra el contenido', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, cargandoSesion: true });
    renderConRuta();

    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument();
  });

  it('sin sesión, redirige a /login', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, cargandoSesion: false });
    renderConRuta();

    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
  });

  it('con sesión, muestra el contenido protegido', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, cargandoSesion: false });
    renderConRuta();

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });
});
