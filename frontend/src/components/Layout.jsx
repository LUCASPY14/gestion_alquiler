import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS_COMPLETO = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/inmuebles', label: 'Inmuebles' },
  { to: '/inquilinos', label: 'Inquilinos' },
  { to: '/contratos', label: 'Contratos' },
  { to: '/pagos', label: 'Pagos' },
  { to: '/gastos', label: 'Gastos' },
  { to: '/ciudades', label: 'Ciudades' },
];

const LINKS_INQUILINO = [
  { to: '/contratos', label: 'Mis contratos' },
  { to: '/pagos', label: 'Mis pagos' },
];

export default function Layout() {
  const { logout, esInquilino } = useAuth();
  const navigate = useNavigate();
  const links = esInquilino ? LINKS_INQUILINO : LINKS_COMPLETO;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <h2>Gestión Alquiler</h2>
        <ul>
          {links.map((link) => (
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
