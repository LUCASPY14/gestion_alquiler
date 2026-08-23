import { useState } from 'react';
import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { METODO_PAGO, ESTADO_PAGO } from '../utils/choices';

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
      <h1>{esInquilino ? 'Mis pagos' : 'Pagos'}</h1>

      {!esInquilino && (
        <form onSubmit={handleSubmit} className="form-grid">
          <select name="contrato" value={form.contrato} onChange={handleChange} required>
            <option value="">Contrato...</option>
            {contratos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.numero_contrato}
              </option>
            ))}
          </select>
          <input type="date" name="fecha_pago" value={form.fecha_pago} onChange={handleChange} required />
          <input
            type="date"
            name="fecha_periodo"
            value={form.fecha_periodo}
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
          <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange}>
            {METODO_PAGO.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select name="estado" value={form.estado} onChange={handleChange}>
            {ESTADO_PAGO.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Guardar' : 'Agregar'}</button>
            {editingId && (
              <button type="button" onClick={handleCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}
      {formError && <p className="error">{formError}</p>}

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Período</th>
            <th>Fecha de pago</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Recibo</th>
            {!esInquilino && <th></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((pago) => (
            <tr key={pago.id}>
              <td>{pago.contrato_numero}</td>
              <td>{pago.fecha_periodo}</td>
              <td>{pago.fecha_pago}</td>
              <td>{pago.monto}</td>
              <td>{METODO_PAGO.find((m) => m.value === pago.metodo_pago)?.label}</td>
              <td>{ESTADO_PAGO.find((s) => s.value === pago.estado)?.label}</td>
              <td>
                {pago.recibo_pdf ? (
                  <a href={pago.recibo_pdf} target="_blank" rel="noreferrer">
                    Descargar
                  </a>
                ) : esInquilino ? (
                  '—'
                ) : pago.estado === 'PAG' ? (
                  <button
                    type="button"
                    disabled={emitiendo === pago.id}
                    onClick={() => handleEmitirRecibo(pago.id)}
                  >
                    {emitiendo === pago.id ? 'Emitiendo...' : 'Emitir recibo'}
                  </button>
                ) : (
                  '—'
                )}
              </td>
              {!esInquilino && (
                <td className="actions">
                  <button type="button" onClick={() => handleEdit(pago)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(pago.id)}>
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
