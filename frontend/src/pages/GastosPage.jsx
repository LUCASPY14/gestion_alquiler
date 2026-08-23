import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { CATEGORIA_GASTO } from '../utils/choices';

const VACIO = {
  inmueble: '',
  descripcion: '',
  monto: '',
  fecha: '',
  categoria: 'REP',
  pagado: true,
};

export default function GastosPage() {
  const {
    items, loading, error, form, editingId, formError,
    handleChange, handleSubmit, handleEdit, handleCancel, handleDelete,
  } = useCrudForm({
    endpoint: 'gastos',
    valorVacio: VACIO,
    mapearAFormulario: (gasto) => ({
      inmueble: gasto.inmueble,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      categoria: gasto.categoria,
      pagado: gasto.pagado,
    }),
    mensajeConfirmarBorrado: '¿Eliminar este gasto?',
  });
  const { items: inmuebles } = useResource('inmuebles');

  return (
    <div>
      <h1>Gastos</h1>

      <form onSubmit={handleSubmit} className="form-grid">
        <select name="inmueble" value={form.inmueble} onChange={handleChange} required>
          <option value="">Inmueble...</option>
          {inmuebles.map((i) => (
            <option key={i.id} value={i.id}>
              {i.codigo_referencia} - {i.direccion}
            </option>
          ))}
        </select>
        <input
          name="descripcion"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          step="0.01"
          name="monto"
          placeholder="Monto (Gs)"
          value={form.monto}
          onChange={handleChange}
          required
        />
        <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
        <select name="categoria" value={form.categoria} onChange={handleChange}>
          {CATEGORIA_GASTO.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input type="checkbox" name="pagado" checked={form.pagado} onChange={handleChange} />
          Pagado
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
            <th>Inmueble</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Pagado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((gasto) => (
            <tr key={gasto.id}>
              <td>{gasto.inmueble_direccion}</td>
              <td>{gasto.descripcion}</td>
              <td>{gasto.monto}</td>
              <td>{gasto.fecha}</td>
              <td>{CATEGORIA_GASTO.find((c) => c.value === gasto.categoria)?.label}</td>
              <td>{gasto.pagado ? 'Sí' : 'No'}</td>
              <td className="actions">
                <button type="button" onClick={() => handleEdit(gasto)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(gasto.id)}>
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
