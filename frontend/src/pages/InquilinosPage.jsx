import { useState } from 'react';
import { useResource } from '../hooks/useResource';
import { TIPO_DOCUMENTO } from '../utils/choices';

const VACIO = {
  nombre: '',
  apellido: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  email: '',
  telefono_principal: '',
  activo: true,
};

export default function InquilinosPage() {
  const { items, loading, error, create, update, remove } = useResource('inquilinos');
  const [form, setForm] = useState(VACIO);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) {
        await update(editingId, form);
      } else {
        await create(form);
      }
      setForm(VACIO);
      setEditingId(null);
    } catch {
      setFormError('No se pudo guardar. Revisá los datos.');
    }
  }

  function handleEdit(inquilino) {
    setEditingId(inquilino.id);
    setForm({
      nombre: inquilino.nombre,
      apellido: inquilino.apellido,
      tipo_documento: inquilino.tipo_documento,
      numero_documento: inquilino.numero_documento,
      email: inquilino.email,
      telefono_principal: inquilino.telefono_principal,
      activo: inquilino.activo,
    });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(VACIO);
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este inquilino?')) return;
    await remove(id);
  }

  return (
    <div>
      <h1>Inquilinos</h1>

      <form onSubmit={handleSubmit} className="form-grid">
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
        <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required />
        <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange}>
          {TIPO_DOCUMENTO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          name="numero_documento"
          placeholder="Número de documento"
          value={form.numero_documento}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="telefono_principal"
          placeholder="Teléfono principal"
          value={form.telefono_principal}
          onChange={handleChange}
          required
        />
        <label className="checkbox">
          <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
          Activo
        </label>
        <div className="form-actions">
          <button type="submit">{editingId ? 'Guardar' : 'Agregar'}</button>
          {editingId && (
            <button type="button" onClick={handleCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      {formError && <p className="error">{formError}</p>}

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((inquilino) => (
            <tr key={inquilino.id}>
              <td>{inquilino.apellido}, {inquilino.nombre}</td>
              <td>{inquilino.tipo_documento} {inquilino.numero_documento}</td>
              <td>{inquilino.email}</td>
              <td>{inquilino.telefono_principal}</td>
              <td>{inquilino.activo ? 'Sí' : 'No'}</td>
              <td className="actions">
                <button type="button" onClick={() => handleEdit(inquilino)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(inquilino.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
