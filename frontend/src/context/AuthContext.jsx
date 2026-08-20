import { createContext, useContext, useMemo, useState } from 'react';
import axios from 'axios';
import { decodeJwtPayload } from '../utils/jwt';

const AuthContext = createContext(null);

function sesionDesdeTokenGuardado() {
  const token = localStorage.getItem('access_token');
  if (!token) return { userId: null, tipoUsuario: null };
  const payload = decodeJwtPayload(token);
  return { userId: payload?.user_id ?? null, tipoUsuario: payload?.tipo_usuario ?? null };
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(sesionDesdeTokenGuardado);

  async function login(username, password) {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/token/`, {
      username,
      password,
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const payload = decodeJwtPayload(data.access);
    setSesion({ userId: payload?.user_id ?? null, tipoUsuario: payload?.tipo_usuario ?? null });
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setSesion({ userId: null, tipoUsuario: null });
  }

  const value = useMemo(
    () => ({
      userId: sesion.userId,
      tipoUsuario: sesion.tipoUsuario,
      esInquilino: sesion.tipoUsuario === 'INQUILINO',
      isAuthenticated: sesion.userId !== null,
      login,
      logout,
    }),
    [sesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
