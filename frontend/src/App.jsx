import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CiudadesPage from './pages/CiudadesPage';
import InmueblesPage from './pages/InmueblesPage';
import InquilinosPage from './pages/InquilinosPage';
import ContratosPage from './pages/ContratosPage';
import PagosPage from './pages/PagosPage';
import GastosPage from './pages/GastosPage';
import UsuariosPage from './pages/UsuariosPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ciudades" element={<CiudadesPage />} />
              <Route path="/inmuebles" element={<InmueblesPage />} />
              <Route path="/inquilinos" element={<InquilinosPage />} />
              <Route path="/contratos" element={<ContratosPage />} />
              <Route path="/pagos" element={<PagosPage />} />
              <Route path="/gastos" element={<GastosPage />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
