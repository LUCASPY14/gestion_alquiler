import { useCrudForm } from '../hooks/useCrudForm';
import { TIPO_DOCUMENTO } from '../utils/choices';
import Badge from '../components/Badge';
import {
  btnDanger, btnPrimary, btnSecondary, btnSm, card, checkbox, checkboxRow,
  errorText, field, input, label, pageTitle, td, tableRow, th,
} from '../ui/styles';

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
      <h1 className={pageTitle}>Inquilinos</h1>

      <form onSubmit={handleSubmit} className={`${card} mb-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={field}>
            <label className={label} htmlFor="nombre">Nombre</label>
            <input id="nombre" name="nombre" className={input} value={form.nombre} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="apellido">Apellido</label>
            <input id="apellido" name="apellido" className={input} value={form.apellido} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="tipo_documento">Tipo de documento</label>
            <select id="tipo_documento" name="tipo_documento" className={input} value={form.tipo_documento} onChange={handleChange}>
              {TIPO_DOCUMENTO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className={field}>
            <label className={label} htmlFor="numero_documento">Número de documento</label>
            <input id="numero_documento" name="numero_documento" className={input} value={form.numero_documento} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" name="email" className={input} value={form.email} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="telefono_principal">Teléfono principal</label>
            <input id="telefono_principal" name="telefono_principal" className={input} value={form.telefono_principal} onChange={handleChange} required />
          </div>
          <label className={checkboxRow}>
            <input type="checkbox" name="activo" className={checkbox} checked={form.activo} onChange={handleChange} />
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
              <th className={th}>Nombre</th>
              <th className={th}>Documento</th>
              <th className={th}>Email</th>
              <th className={th}>Teléfono</th>
              <th className={th}>Activo</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((inquilino) => (
              <tr key={inquilino.id} className={tableRow}>
                <td className={`${td} font-medium text-slate-900 dark:text-white`}>{inquilino.apellido}, {inquilino.nombre}</td>
                <td className={td}>{inquilino.tipo_documento} {inquilino.numero_documento}</td>
                <td className={td}>{inquilino.email}</td>
                <td className={td}>{inquilino.telefono_principal}</td>
                <td className={td}>
                  <Badge tone={inquilino.activo ? 'green' : 'slate'}>{inquilino.activo ? 'Sí' : 'No'}</Badge>
                </td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => handleEdit(inquilino)}>Editar</button>
                    <button type="button" className={`${btnDanger} ${btnSm}`} onClick={() => handleDelete(inquilino.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
