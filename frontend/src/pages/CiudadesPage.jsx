import { useCrudForm } from '../hooks/useCrudForm';
import { btnDanger, btnPrimary, btnSecondary, btnSm, card, errorText, field, input, label, pageTitle, td, tableRow, th } from '../ui/styles';

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
      <h1 className={pageTitle}>Ciudades</h1>

      <form onSubmit={handleSubmit} className={`${card} mb-6 flex flex-wrap items-end gap-3`}>
        <div className={`${field} w-48`}>
          <label className={label} htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" className={input} value={form.nombre} onChange={handleChange} required />
        </div>
        <div className={`${field} w-48`}>
          <label className={label} htmlFor="departamento">Departamento</label>
          <input
            id="departamento"
            name="departamento"
            className={input}
            value={form.departamento}
            onChange={handleChange}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>{editingId ? 'Guardar' : 'Agregar'}</button>
          {editingId && (
            <button type="button" className={btnSecondary} onClick={handleCancel}>
              Cancelar
            </button>
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
              <th className={th}>Departamento</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((ciudad) => (
              <tr key={ciudad.id} className={tableRow}>
                <td className={`${td} font-medium text-slate-900 dark:text-white`}>{ciudad.nombre}</td>
                <td className={td}>{ciudad.departamento}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => handleEdit(ciudad)}>
                      Editar
                    </button>
                    <button type="button" className={`${btnDanger} ${btnSm}`} onClick={() => handleDelete(ciudad.id)}>
                      Eliminar
                    </button>
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
