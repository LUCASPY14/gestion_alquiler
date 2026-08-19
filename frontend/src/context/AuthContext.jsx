import { createContext, useContext, useMemo, useState } from 'react';
import axios from 'axios';
import { decodeJwtPayload } from '../utils/jwt';

const AuthContext = createContext(null);

function userIdFromStoredToken() {
  const token = localStorage.getItem('access_token');
  return token ? decodeJwtPayload(token)?.user_id ?? null : null;
}

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(userIdFromStoredToken);

  async function login(username, password) {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/token/`, {
      username,
      password,
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUserId(decodeJwtPayload(data.access)?.user_id ?? null);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUserId(null);
  }

  const value = useMemo(
    () => ({ userId, isAuthenticated: userId !== null, login, logout }),
    [userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
