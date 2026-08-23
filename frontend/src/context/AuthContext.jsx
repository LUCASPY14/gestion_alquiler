import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setOnSessionExpired } from '../api/client';

const AuthContext = createContext(null);

const SESION_VACIA = { userId: null, tipoUsuario: null, esAdmin: false };

function sesionDesde(data) {
  return {
    userId: data.id,
    tipoUsuario: data.tipo_usuario,
    esAdmin: data.tipo_usuario === 'ADMIN' || data.is_staff || data.is_superuser,
  };
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(SESION_VACIA);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    setOnSessionExpired(() => setSesion(SESION_VACIA));

    api
      .get('/me/')
      .then(({ data }) => setSesion(sesionDesde(data)))
      .catch(() => setSesion(SESION_VACIA))
      .finally(() => setCargandoSesion(false));
  }, []);

  async function login(username, password) {
    const { data } = await api.post('/token/', { username, password });
    setSesion(sesionDesde(data));
  }

  async function logout() {
    try {
      await api.post('/logout/');
    } catch {
      // Igual limpiamos la sesión del lado del cliente aunque el backend
      // no responda (ej. sin red): que un fallo ahí no trabe la navegación.
    } finally {
      setSesion(SESION_VACIA);
    }
  }

  const value = useMemo(
    () => ({
      userId: sesion.userId,
      tipoUsuario: sesion.tipoUsuario,
      esInquilino: sesion.tipoUsuario === 'INQUILINO',
      esAdmin: sesion.esAdmin,
      isAuthenticated: sesion.userId !== null,
      cargandoSesion,
      login,
      logout,
    }),
    [sesion, cargandoSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
