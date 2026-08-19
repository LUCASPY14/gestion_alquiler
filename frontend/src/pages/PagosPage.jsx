import { useState } from 'react';
import { useResource } from '../hooks/useResource';
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
  const { items, loading, error, create, update, remove } = useResource('pagos');
  const { items: contratos } = useResource('contratos');

  const [form, setForm] = useState(VACIO);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) {
        await update(editingId, form);
      } else {
        await create(form);
      }
      setForm(VACIO);
      setEditingId(null);
    } catch {
      setFormError('No se pudo guardar. ¿Ya existe un pago para ese contrato y período?');
    }
  }

  function handleEdit(pago) {
    setEditingId(pago.id);
    setForm({
      contrato: pago.contrato,
      fecha_pago: pago.fecha_pago,
      fecha_periodo: pago.fecha_periodo,
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      estado: pago.estado,
    });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(VACIO);
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este pago?')) return;
    await remove(id);
  }

  return (
    <div>
      <h1>Pagos</h1>

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
            <th></th>
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
              <td className="actions">
                <button type="button" onClick={() => handleEdit(pago)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(pago.id)}>
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
