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
    <div className="flex min-h-svh">
      <nav className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="mb-6 px-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Gestión Alquiler
        </h2>
        <ul className="flex flex-1 flex-col gap-0.5">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
      </nav>
      <main className="flex-1 overflow-x-auto bg-white p-8 dark:bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
}
