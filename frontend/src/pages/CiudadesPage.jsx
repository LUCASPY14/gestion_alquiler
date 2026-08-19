import { useState } from 'react';
import { useResource } from '../hooks/useResource';

const VACIO = { nombre: '', departamento: '' };

export default function CiudadesPage() {
  const { items, loading, error, create, update, remove } = useResource('ciudades');
  const [form, setForm] = useState(VACIO);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  function handleEdit(ciudad) {
    setEditingId(ciudad.id);
    setForm({ nombre: ciudad.nombre, departamento: ciudad.departamento ?? '' });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(VACIO);
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta ciudad?')) return;
    await remove(id);
  }

  return (
    <div>
      <h1>Ciudades</h1>

      <form onSubmit={handleSubmit} className="form-inline">
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />
        <input
          name="departamento"
          placeholder="Departamento"
          value={form.departamento}
          onChange={handleChange}
        />
        <button type="submit">{editingId ? 'Guardar' : 'Agregar'}</button>
        {editingId && (
          <button type="button" onClick={handleCancel}>
            Cancelar
          </button>
        )}
      </form>
      {formError && <p className="error">{formError}</p>}

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Departamento</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((ciudad) => (
            <tr key={ciudad.id}>
              <td>{ciudad.nombre}</td>
              <td>{ciudad.departamento}</td>
              <td className="actions">
                <button type="button" onClick={() => handleEdit(ciudad)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(ciudad.id)}>
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
