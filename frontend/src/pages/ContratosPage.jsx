import { useState } from 'react';
import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { useAuth } from '../context/AuthContext';
import { PERIODICIDAD_CONTRATO, ESTADO_CONTRATO, ROL_INQUILINO } from '../utils/choices';

const VACIO = {
  inmueble: '',
  numero_contrato: '',
  fecha_inicio: '',
  fecha_fin: '',
  monto_mensual: '',
  deposito: '',
  periodicidad: 'MEN',
  estado: 'ACT',
};

export default function ContratosPage() {
  const { esInquilino } = useAuth();
  const {
    items, loading, error, form, editingId, formError,
    handleChange, handleSubmit, handleEdit, handleCancel, handleDelete,
  } = useCrudForm({
    endpoint: 'contratos',
    valorVacio: VACIO,
    mapearAFormulario: (contrato) => ({
      inmueble: contrato.inmueble,
      numero_contrato: contrato.numero_contrato,
      fecha_inicio: contrato.fecha_inicio,
      fecha_fin: contrato.fecha_fin,
      monto_mensual: contrato.monto_mensual,
      deposito: contrato.deposito,
      periodicidad: contrato.periodicidad,
      estado: contrato.estado,
    }),
    mensajeError: 'No se pudo guardar. Revisá los datos (¿fechas superpuestas con otro contrato activo?).',
    mensajeConfirmarBorrado: '¿Eliminar este contrato?',
  });
  const { items: inmuebles } = useResource('inmuebles');
  const { items: inquilinos } = useResource('inquilinos');
  const { create: crearContratoInquilino } = useResource('contrato-inquilinos');

  const [inquilinoTitular, setInquilinoTitular] = useState('');
  const [agregando, setAgregando] = useState(null); // contrato id
  const [nuevoInquilino, setNuevoInquilino] = useState({ inquilino: '', rol: 'TIT' });

  async function onSubmit(e) {
    await handleSubmit(e, {
      onCreado: async (contrato) => {
        if (inquilinoTitular) {
          await crearContratoInquilino({ contrato: contrato.id, inquilino: inquilinoTitular, rol: 'TIT' });
        }
      },
    });
    setInquilinoTitular('');
  }

  function onCancel() {
    handleCancel();
    setInquilinoTitular('');
  }

  async function handleAgregarInquilino(contratoId) {
    if (!nuevoInquilino.inquilino) return;
    await crearContratoInquilino({ contrato: contratoId, ...nuevoInquilino });
    setNuevoInquilino({ inquilino: '', rol: 'TIT' });
    setAgregando(null);
  }

  return (
    <div>
      <h1>{esInquilino ? 'Mis contratos' : 'Contratos'}</h1>

      {!esInquilino && (
        <form onSubmit={onSubmit} className="form-grid">
          <select name="inmueble" value={form.inmueble} onChange={handleChange} required>
            <option value="">Inmueble...</option>
            {inmuebles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.codigo_referencia} - {i.direccion}
              </option>
            ))}
          </select>
          <input
            name="numero_contrato"
            placeholder="Número de contrato"
            value={form.numero_contrato}
            onChange={handleChange}
            required
          />
          <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} required />
          <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} required />
          <input
            type="number"
            step="0.01"
            name="monto_mensual"
            placeholder="Monto mensual (Gs)"
            value={form.monto_mensual}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            step="0.01"
            name="deposito"
            placeholder="Depósito (Gs)"
            value={form.deposito}
            onChange={handleChange}
            required
          />
          <select name="periodicidad" value={form.periodicidad} onChange={handleChange}>
            {PERIODICIDAD_CONTRATO.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select name="estado" value={form.estado} onChange={handleChange}>
            {ESTADO_CONTRATO.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {!editingId && (
            <select value={inquilinoTitular} onChange={(e) => setInquilinoTitular(e.target.value)}>
              <option value="">Inquilino titular (opcional)...</option>
              {inquilinos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.apellido}, {i.nombre}
                </option>
              ))}
            </select>
          )}
          <div className="form-actions">
            <button type="submit">{editingId ? 'Guardar' : 'Agregar'}</button>
            {editingId && (
              <button type="button" onClick={onCancel}>
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
            <th>Número</th>
            <th>Inmueble</th>
            <th>Vigencia</th>
            <th>Monto mensual</th>
            <th>Estado</th>
            <th>Inquilinos</th>
            {!esInquilino && <th></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((contrato) => (
            <tr key={contrato.id}>
              <td>{contrato.numero_contrato}</td>
              <td>{contrato.inmueble_direccion}</td>
              <td>{contrato.fecha_inicio} a {contrato.fecha_fin}</td>
              <td>{contrato.monto_mensual}</td>
              <td>{ESTADO_CONTRATO.find((s) => s.value === contrato.estado)?.label}</td>
              <td>
                <ul className="inline-list">
                  {contrato.inquilinos_detalle?.map((ci) => (
                    <li key={ci.id}>
                      {ci.inquilino_nombre} ({ROL_INQUILINO.find((r) => r.value === ci.rol)?.label})
                    </li>
                  ))}
                </ul>
                {!esInquilino && (
                  agregando === contrato.id ? (
                    <div className="form-inline">
                      <select
                        value={nuevoInquilino.inquilino}
                        onChange={(e) => setNuevoInquilino({ ...nuevoInquilino, inquilino: e.target.value })}
                      >
                        <option value="">Inquilino...</option>
                        {inquilinos.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.apellido}, {i.nombre}
                          </option>
                        ))}
                      </select>
                      <select
                        value={nuevoInquilino.rol}
                        onChange={(e) => setNuevoInquilino({ ...nuevoInquilino, rol: e.target.value })}
                      >
                        {ROL_INQUILINO.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => handleAgregarInquilino(contrato.id)}>
                        Guardar
                      </button>
                      <button type="button" onClick={() => setAgregando(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setAgregando(contrato.id)}>
                      + inquilino
                    </button>
                  )
                )}
              </td>
              {!esInquilino && (
                <td className="actions">
                  <button type="button" onClick={() => handleEdit(contrato)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(contrato.id)}>
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
