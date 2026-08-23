import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { TIPO_INMUEBLE } from '../utils/choices';
import Badge from '../components/Badge';
import {
  btnDanger, btnPrimary, btnSecondary, btnSm, card, checkbox, checkboxRow,
  errorText, field, input, label, pageTitle, td, tableRow, th,
} from '../ui/styles';

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
      <h1 className={pageTitle}>Inmuebles</h1>

      <form onSubmit={handleSubmit} className={`${card} mb-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={field}>
            <label className={label} htmlFor="codigo_referencia">Código de referencia</label>
            <input id="codigo_referencia" name="codigo_referencia" className={input} value={form.codigo_referencia} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="direccion">Dirección</label>
            <input id="direccion" name="direccion" className={input} value={form.direccion} onChange={handleChange} required />
          </div>
          <div className={field}>
            <label className={label} htmlFor="ciudad">Ciudad</label>
            <select id="ciudad" name="ciudad" className={input} value={form.ciudad} onChange={handleChange} required>
              <option value="">Ciudad...</option>
              {ciudades.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className={field}>
            <label className={label} htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" className={input} value={form.tipo} onChange={handleChange}>
              {TIPO_INMUEBLE.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className={field}>
            <label className={label} htmlFor="habitaciones">Habitaciones</label>
            <input id="habitaciones" type="number" name="habitaciones" className={input} value={form.habitaciones} onChange={handleChange} min="0" />
          </div>
          <div className={field}>
            <label className={label} htmlFor="banos">Baños</label>
            <input id="banos" type="number" name="banos" className={input} value={form.banos} onChange={handleChange} min="0" />
          </div>
          <div className={field}>
            <label className={label} htmlFor="precio_mensual">Precio mensual (Gs)</label>
            <input id="precio_mensual" type="number" step="0.01" name="precio_mensual" className={input} value={form.precio_mensual} onChange={handleChange} required />
          </div>
          <label className={checkboxRow}>
            <input type="checkbox" name="disponible" className={checkbox} checked={form.disponible} onChange={handleChange} />
            Disponible
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
              <th className={th}>Código</th>
              <th className={th}>Dirección</th>
              <th className={th}>Ciudad</th>
              <th className={th}>Tipo</th>
              <th className={th}>Precio mensual</th>
              <th className={th}>Disponible</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((inmueble) => (
              <tr key={inmueble.id} className={tableRow}>
                <td className={`${td} font-medium text-slate-900 dark:text-white`}>{inmueble.codigo_referencia}</td>
                <td className={td}>{inmueble.direccion}</td>
                <td className={td}>{inmueble.ciudad_nombre}</td>
                <td className={td}>{TIPO_INMUEBLE.find((t) => t.value === inmueble.tipo)?.label}</td>
                <td className={`${td} tabular-nums`}>{inmueble.precio_mensual}</td>
                <td className={td}>
                  <Badge tone={inmueble.disponible ? 'green' : 'slate'}>{inmueble.disponible ? 'Sí' : 'No'}</Badge>
                </td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => handleEdit(inmueble)}>Editar</button>
                    <button type="button" className={`${btnDanger} ${btnSm}`} onClick={() => handleDelete(inmueble.id)}>Eliminar</button>
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
