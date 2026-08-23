import { useCrudForm } from '../hooks/useCrudForm';
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
  const {
    items, loading, error, form, editingId, formError,
    handleChange, handleSubmit, handleEdit, handleCancel, handleDelete,
  } = useCrudForm({
    endpoint: 'inquilinos',
    valorVacio: VACIO,
    mapearAFormulario: (inquilino) => ({
      nombre: inquilino.nombre,
      apellido: inquilino.apellido,
      tipo_documento: inquilino.tipo_documento,
      numero_documento: inquilino.numero_documento,
      email: inquilino.email,
      telefono_principal: inquilino.telefono_principal,
      activo: inquilino.activo,
    }),
    mensajeConfirmarBorrado: '¿Eliminar este inquilino?',
  });

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
