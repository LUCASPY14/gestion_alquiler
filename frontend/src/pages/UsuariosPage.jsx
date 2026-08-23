import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCrudForm } from '../hooks/useCrudForm';
import api from '../api/client';
import { TIPO_USUARIO } from '../utils/choices';
import Badge from '../components/Badge';
import {
  btnDanger, btnPrimary, btnSecondary, btnSm, card, checkbox, checkboxRow,
  errorText, field, input, label, pageTitle, td, tableRow, th,
} from '../ui/styles';

const VACIO = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  telefono: '',
  tipo_usuario: 'PROPIETARIO',
  is_active: true,
  password: '',
};

export default function UsuariosPage() {
  const { esAdmin } = useAuth();
  const {
    items, loading, error, form, editingId, formError,
    handleChange, handleSubmit, handleEdit, handleCancel, handleDelete,
  } = useCrudForm({
    endpoint: 'users',
    valorVacio: VACIO,
    mapearAFormulario: (u) => ({
      username: u.username,
      email: u.email,
      first_name: u.first_name ?? '',
      last_name: u.last_name ?? '',
      telefono: u.telefono ?? '',
      tipo_usuario: u.tipo_usuario,
      is_active: u.is_active,
    }),
    mensajeError: 'No se pudo guardar. Revisá los datos (¿el usuario ya existe?).',
    mensajeConfirmarBorrado: '¿Eliminar este usuario? Esta acción no se puede deshacer.',
  });

  const [cambiandoId, setCambiandoId] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  function iniciarCambioPassword(id) {
    setCambiandoId(id);
    setNuevaPassword('');
    setErrorPassword('');
  }

  async function confirmarCambioPassword(id) {
    setErrorPassword('');
    try {
      await api.post(`/users/${id}/cambiar-password/`, { password: nuevaPassword });
      setCambiandoId(null);
      setNuevaPassword('');
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setErrorPassword(Array.isArray(detalle) ? detalle.join(' ') : detalle || 'No se pudo cambiar la contraseña.');
    }
  }

  return (
    <div>
      <h1 className={pageTitle}>Usuarios</h1>

      <form onSubmit={handleSubmit} className={`${card} mb-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={field}>
            <label className={label} htmlFor="username">Usuario</label>
            <input id="username" name="username" className={input} value={form.username} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" name="email" className={input} value={form.email} onChange={handleChange} />
          </div>
          <div className={field}>
            <label className={label} htmlFor="first_name">Nombre</label>
            <input id="first_name" name="first_name" className={input} value={form.first_name} onChange={handleChange} />
          </div>
          <div className={field}>
            <label className={label} htmlFor="last_name">Apellido</label>
            <input id="last_name" name="last_name" className={input} value={form.last_name} onChange={handleChange} />
          </div>
          <div className={field}>
            <label className={label} htmlFor="telefono">Teléfono</label>
            <input id="telefono" name="telefono" className={input} value={form.telefono} onChange={handleChange} />
          </div>
          <div className={field}>
            <label className={label} htmlFor="tipo_usuario">Tipo de usuario</label>
            <select id="tipo_usuario" name="tipo_usuario" className={input} value={form.tipo_usuario} onChange={handleChange}>
              {TIPO_USUARIO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {!editingId && (
            <div className={field}>
              <label className={label} htmlFor="password">Contraseña</label>
              <input id="password" type="password" name="password" className={input} value={form.password} onChange={handleChange} required autoComplete="new-password" />
            </div>
          )}
          <label className={checkboxRow}>
            <input type="checkbox" name="is_active" className={checkbox} checked={form.is_active} onChange={handleChange} />
            Activo
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className={btnPrimary}>{editingId ? 'Guardar' : 'Agregar'}</button>
          {editingId && (
            <button type="button" className={btnSecondary} onClick={handleCancel}>Cancelar</button>
          )}
        </div>
      </form>
      {formError && <p className={`${errorText} mb-4`}>{formError}</p>}

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>}
      {error && <p className={errorText}>{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>Usuario</th>
              <th className={th}>Nombre</th>
              <th className={th}>Email</th>
              <th className={th}>Tipo</th>
              <th className={th}>Activo</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((usuario) => (
              <tr key={usuario.id} className={tableRow}>
                <td className={`${td} font-medium text-slate-900 dark:text-white`}>{usuario.username}</td>
                <td className={td}>{[usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td className={td}>{usuario.email || '—'}</td>
                <td className={td}>{TIPO_USUARIO.find((t) => t.value === usuario.tipo_usuario)?.label}</td>
                <td className={td}>
                  <Badge tone={usuario.is_active ? 'green' : 'slate'}>{usuario.is_active ? 'Sí' : 'No'}</Badge>
                </td>
                <td className={`${td} text-right`}>
                  {cambiandoId === usuario.id ? (
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <input
                        type="password"
                        className={`${input} w-40 py-1 text-xs`}
                        placeholder="Nueva contraseña"
                        value={nuevaPassword}
                        onChange={(e) => setNuevaPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button type="button" className={`${btnPrimary} ${btnSm}`} onClick={() => confirmarCambioPassword(usuario.id)}>
                        Guardar
                      </button>
                      <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => setCambiandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => iniciarCambioPassword(usuario.id)}>
                        Cambiar contraseña
                      </button>
                      <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => handleEdit(usuario)}>Editar</button>
                      <button type="button" className={`${btnDanger} ${btnSm}`} onClick={() => handleDelete(usuario.id)}>Eliminar</button>
                    </div>
                  )}
                  {cambiandoId === usuario.id && errorPassword && (
                    <p className={`${errorText} mt-1.5 text-right`}>{errorPassword}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
