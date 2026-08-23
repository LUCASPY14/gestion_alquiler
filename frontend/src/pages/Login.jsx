import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { btnPrimary, errorText, field, input, label } from '../ui/styles';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Usuario o contraseña incorrectos');
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Gestión Alquiler
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Iniciá sesión para continuar</p>

        <div className="flex flex-col gap-4">
          <div className={field}>
            <label className={label} htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              className={input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className={field}>
            <label className={label} htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button type="submit" className={`${btnPrimary} mt-6 w-full`}>
          Entrar
        </button>
        {error && <p className={`${errorText} mt-3`}>{error}</p>}
      </form>
    </div>
  );
}
