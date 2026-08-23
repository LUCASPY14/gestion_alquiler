import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { TIPO_INMUEBLE } from '../utils/choices';

const VACIO = {
  codigo_referencia: '',
  direccion: '',
  ciudad: '',
  tipo: 'CASA',
  habitaciones: 0,
  banos: 0,
  precio_mensual: '',
  disponible: true,
};

export default function InmueblesPage() {
  const {
    items, loading, error, form, editingId, formError,
    handleChange, handleSubmit, handleEdit, handleCancel, handleDelete,
  } = useCrudForm({
    endpoint: 'inmuebles',
    valorVacio: VACIO,
    mapearAFormulario: (inmueble) => ({
      codigo_referencia: inmueble.codigo_referencia,
      direccion: inmueble.direccion,
      ciudad: inmueble.ciudad,
      tipo: inmueble.tipo,
      habitaciones: inmueble.habitaciones,
      banos: inmueble.banos,
      precio_mensual: inmueble.precio_mensual,
      disponible: inmueble.disponible,
    }),
    mensajeConfirmarBorrado: '¿Eliminar este inmueble?',
  });
  const { items: ciudades } = useResource('ciudades');

  return (
    <div>
      <h1>Inmuebles</h1>

      <form onSubmit={handleSubmit} className="form-grid">
        <input
          name="codigo_referencia"
          placeholder="Código de referencia"
          value={form.codigo_referencia}
          onChange={handleChange}
          required
        />
        <input
          name="direccion"
          placeholder="Dirección"
          value={form.direccion}
          onChange={handleChange}
          required
        />
        <select name="ciudad" value={form.ciudad} onChange={handleChange} required>
          <option value="">Ciudad...</option>
          {ciudades.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select name="tipo" value={form.tipo} onChange={handleChange}>
          {TIPO_INMUEBLE.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="habitaciones"
          placeholder="Habitaciones"
          value={form.habitaciones}
          onChange={handleChange}
          min="0"
        />
        <input
          type="number"
          name="banos"
          placeholder="Baños"
          value={form.banos}
          onChange={handleChange}
          min="0"
        />
        <input
          type="number"
          step="0.01"
          name="precio_mensual"
          placeholder="Precio mensual (Gs)"
          value={form.precio_mensual}
          onChange={handleChange}
          required
        />
        <label className="checkbox">
          <input
            type="checkbox"
            name="disponible"
            checked={form.disponible}
            onChange={handleChange}
          />
          Disponible
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
            <th>Código</th>
            <th>Dirección</th>
            <th>Ciudad</th>
            <th>Tipo</th>
            <th>Precio mensual</th>
            <th>Disponible</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((inmueble) => (
            <tr key={inmueble.id}>
              <td>{inmueble.codigo_referencia}</td>
              <td>{inmueble.direccion}</td>
              <td>{inmueble.ciudad_nombre}</td>
              <td>{TIPO_INMUEBLE.find((t) => t.value === inmueble.tipo)?.label}</td>
              <td>{inmueble.precio_mensual}</td>
              <td>{inmueble.disponible ? 'Sí' : 'No'}</td>
              <td className="actions">
                <button type="button" onClick={() => handleEdit(inmueble)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(inmueble.id)}>
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
