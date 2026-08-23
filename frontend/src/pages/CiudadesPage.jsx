import { useCrudForm } from '../hooks/useCrudForm';

const VACIO = { nombre: '', departamento: '' };

export default function CiudadesPage() {
  const {
    items, loading, error, form, editingId, formError,
    handleChange, handleSubmit, handleEdit, handleCancel, handleDelete,
  } = useCrudForm({
    endpoint: 'ciudades',
    valorVacio: VACIO,
    mapearAFormulario: (ciudad) => ({ nombre: ciudad.nombre, departamento: ciudad.departamento ?? '' }),
    mensajeConfirmarBorrado: '¿Eliminar esta ciudad?',
  });

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
