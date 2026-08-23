import { useState } from 'react';
import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ESTADO_PAGO, ESTADO_PAGO_TONO, METODO_PAGO } from '../utils/choices';
import Badge from '../components/Badge';
import {
  btnDanger, btnPrimary, btnSecondary, btnSm, card, errorText, field, input,
  label, pageTitle, td, tableRow, th,
} from '../ui/styles';

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

const VACIO = {
  contrato: '',
  fecha_pago: hoy(),
  fecha_periodo: '',
  monto: '',
  metodo_pago: 'TRANS',
  estado: 'PEN',
};

export default function PagosPage() {
  const { esInquilino } = useAuth();
  const {
    items, loading, error, form, editingId, formError, reload,
    handleChange, handleSubmit, handleEdit, handleCancel, handleDelete,
  } = useCrudForm({
    endpoint: 'pagos',
    valorVacio: VACIO,
    mapearAFormulario: (pago) => ({
      contrato: pago.contrato,
      fecha_pago: pago.fecha_pago,
      fecha_periodo: pago.fecha_periodo,
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      estado: pago.estado,
    }),
    mensajeError: 'No se pudo guardar. ¿Ya existe un pago para ese contrato y período?',
    mensajeConfirmarBorrado: '¿Eliminar este pago?',
  });
  const { items: contratos } = useResource('contratos');
  const [emitiendo, setEmitiendo] = useState(null);

  async function handleEmitirRecibo(id) {
    setEmitiendo(id);
    try {
      await api.post(`/pagos/${id}/regenerar-recibo/`);
      await reload();
    } finally {
      setEmitiendo(null);
    }
  }

  return (
    <div>
      <h1 className={pageTitle}>{esInquilino ? 'Mis pagos' : 'Pagos'}</h1>

      {!esInquilino && (
        <form onSubmit={handleSubmit} className={`${card} mb-6`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={field}>
              <label className={label} htmlFor="contrato">Contrato</label>
              <select id="contrato" name="contrato" className={input} value={form.contrato} onChange={handleChange} required>
                <option value="">Contrato...</option>
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>{c.numero_contrato}</option>
                ))}
              </select>
            </div>
            <div className={field}>
              <label className={label} htmlFor="fecha_pago">Fecha de pago</label>
              <input id="fecha_pago" type="date" name="fecha_pago" className={input} value={form.fecha_pago} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="fecha_periodo">Período</label>
              <input id="fecha_periodo" type="date" name="fecha_periodo" className={input} value={form.fecha_periodo} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="monto">Monto (Gs)</label>
              <input id="monto" type="number" step="0.01" name="monto" className={input} value={form.monto} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="metodo_pago">Método de pago</label>
              <select id="metodo_pago" name="metodo_pago" className={input} value={form.metodo_pago} onChange={handleChange}>
                {METODO_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className={field}>
              <label className={label} htmlFor="estado">Estado</label>
              <select id="estado" name="estado" className={input} value={form.estado} onChange={handleChange}>
                {ESTADO_PAGO.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className={btnPrimary}>{editingId ? 'Guardar' : 'Agregar'}</button>
            {editingId && (
              <button type="button" className={btnSecondary} onClick={handleCancel}>Cancelar</button>
            )}
          </div>
        </form>
      )}
      {formError && <p className={`${errorText} mb-4`}>{formError}</p>}

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>}
      {error && <p className={errorText}>{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>Contrato</th>
              <th className={th}>Período</th>
              <th className={th}>Fecha de pago</th>
              <th className={th}>Monto</th>
              <th className={th}>Método</th>
              <th className={th}>Estado</th>
              <th className={th}>Recibo</th>
              {!esInquilino && <th className={th}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((pago) => (
              <tr key={pago.id} className={tableRow}>
                <td className={`${td} font-medium text-slate-900 dark:text-white`}>{pago.contrato_numero}</td>
                <td className={td}>{pago.fecha_periodo}</td>
                <td className={td}>{pago.fecha_pago}</td>
                <td className={`${td} tabular-nums`}>{pago.monto}</td>
                <td className={td}>{METODO_PAGO.find((m) => m.value === pago.metodo_pago)?.label}</td>
                <td className={td}>
                  <Badge tone={ESTADO_PAGO_TONO[pago.estado]}>
                    {ESTADO_PAGO.find((s) => s.value === pago.estado)?.label}
                  </Badge>
                </td>
                <td className={td}>
                  {pago.recibo_pdf ? (
                    <a href={pago.recibo_pdf} target="_blank" rel="noreferrer" className="font-medium text-accent-600 hover:underline dark:text-accent-400">
                      Descargar
                    </a>
                  ) : esInquilino ? (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  ) : pago.estado === 'PAG' ? (
                    <button
                      type="button"
                      className={`${btnSecondary} ${btnSm}`}
                      disabled={emitiendo === pago.id}
                      onClick={() => handleEmitirRecibo(pago.id)}
                    >
                      {emitiendo === pago.id ? 'Emitiendo...' : 'Emitir recibo'}
                    </button>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
                {!esInquilino && (
                  <td className={`${td} text-right`}>
                    <div className="flex justify-end gap-2">
                      <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => handleEdit(pago)}>Editar</button>
                      <button type="button" className={`${btnDanger} ${btnSm}`} onClick={() => handleDelete(pago.id)}>Eliminar</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
