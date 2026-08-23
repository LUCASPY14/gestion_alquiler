import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, cargandoSesion } = useAuth();

  if (cargandoSesion) {
    return <div className="pagina-cargando">Cargando…</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
