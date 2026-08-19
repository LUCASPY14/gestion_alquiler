import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/inmuebles', label: 'Inmuebles' },
  { to: '/inquilinos', label: 'Inquilinos' },
  { to: '/contratos', label: 'Contratos' },
  { to: '/pagos', label: 'Pagos' },
  { to: '/gastos', label: 'Gastos' },
  { to: '/ciudades', label: 'Ciudades' },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <h2>Gestión Alquiler</h2>
        <ul>
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
