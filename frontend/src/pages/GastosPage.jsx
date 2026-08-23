import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { CATEGORIA_GASTO } from '../utils/choices';
import Badge from '../components/Badge';
import {
  btnDanger, btnPrimary, btnSecondary, btnSm, card, checkbox, checkboxRow,
  errorText, field, input, label, pageTitle, td, tableRow, th,
} from '../ui/styles';

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
      <h1 className={pageTitle}>Gastos</h1>

      <form onSubmit={handleSubmit} className={`${card} mb-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={field}>
            <label className={label} htmlFor="inmueble">Inmueble</label>
            <select id="inmueble" name="inmueble" className={input} value={form.inmueble} onChange={handleChange} required>
              <option value="">Inmueble...</option>
              {inmuebles.map((i) => (
                <option key={i.id} value={i.id}>{i.codigo_referencia} - {i.direccion}</option>
              ))}
            </select>
          </div>
          <div className={field}>
            <label className={label} htmlFor="descripcion">Descripción</label>
            <input id="descripcion" name="descripcion" className={input} value={form.descripcion} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="monto">Monto (Gs)</label>
            <input id="monto" type="number" step="0.01" name="monto" className={input} value={form.monto} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="fecha">Fecha</label>
            <input id="fecha" type="date" name="fecha" className={input} value={form.fecha} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="categoria">Categoría</label>
            <select id="categoria" name="categoria" className={input} value={form.categoria} onChange={handleChange}>
              {CATEGORIA_GASTO.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <label className={checkboxRow}>
            <input type="checkbox" name="pagado" className={checkbox} checked={form.pagado} onChange={handleChange} />
            Pagado
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
              <th className={th}>Inmueble</th>
              <th className={th}>Descripción</th>
              <th className={th}>Monto</th>
              <th className={th}>Fecha</th>
              <th className={th}>Categoría</th>
              <th className={th}>Pagado</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((gasto) => (
              <tr key={gasto.id} className={tableRow}>
                <td className={`${td} font-medium text-slate-900 dark:text-white`}>{gasto.inmueble_direccion}</td>
                <td className={td}>{gasto.descripcion}</td>
                <td className={`${td} tabular-nums`}>{gasto.monto}</td>
                <td className={td}>{gasto.fecha}</td>
                <td className={td}>{CATEGORIA_GASTO.find((c) => c.value === gasto.categoria)?.label}</td>
                <td className={td}>
                  <Badge tone={gasto.pagado ? 'green' : 'amber'}>{gasto.pagado ? 'Sí' : 'No'}</Badge>
                </td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => handleEdit(gasto)}>Editar</button>
                    <button type="button" className={`${btnDanger} ${btnSm}`} onClick={() => handleDelete(gasto.id)}>Eliminar</button>
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
