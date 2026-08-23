import { useState } from 'react';
import { useResource } from '../hooks/useResource';
import { useCrudForm } from '../hooks/useCrudForm';
import { useAuth } from '../context/AuthContext';
import { ESTADO_CONTRATO, ESTADO_CONTRATO_TONO, PERIODICIDAD_CONTRATO, ROL_INQUILINO } from '../utils/choices';
import Badge from '../components/Badge';
import {
  btnDanger, btnPrimary, btnSecondary, btnSm, card, errorText, field, input,
  label, pageTitle, td, tableRow, th,
} from '../ui/styles';

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
      <h1 className={pageTitle}>{esInquilino ? 'Mis contratos' : 'Contratos'}</h1>

      {!esInquilino && (
        <form onSubmit={onSubmit} className={`${card} mb-6`}>
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
              <label className={label} htmlFor="numero_contrato">Número de contrato</label>
              <input id="numero_contrato" name="numero_contrato" className={input} value={form.numero_contrato} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="fecha_inicio">Fecha de inicio</label>
              <input id="fecha_inicio" type="date" name="fecha_inicio" className={input} value={form.fecha_inicio} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="fecha_fin">Fecha de fin</label>
              <input id="fecha_fin" type="date" name="fecha_fin" className={input} value={form.fecha_fin} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="monto_mensual">Monto mensual (Gs)</label>
              <input id="monto_mensual" type="number" step="0.01" name="monto_mensual" className={input} value={form.monto_mensual} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="deposito">Depósito (Gs)</label>
              <input id="deposito" type="number" step="0.01" name="deposito" className={input} value={form.deposito} onChange={handleChange} required />
            </div>
            <div className={field}>
              <label className={label} htmlFor="periodicidad">Periodicidad</label>
              <select id="periodicidad" name="periodicidad" className={input} value={form.periodicidad} onChange={handleChange}>
                {PERIODICIDAD_CONTRATO.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className={field}>
              <label className={label} htmlFor="estado">Estado</label>
              <select id="estado" name="estado" className={input} value={form.estado} onChange={handleChange}>
                {ESTADO_CONTRATO.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            {!editingId && (
              <div className={field}>
                <label className={label} htmlFor="inquilino_titular">Inquilino titular (opcional)</label>
                <select
                  id="inquilino_titular"
                  className={input}
                  value={inquilinoTitular}
                  onChange={(e) => setInquilinoTitular(e.target.value)}
                >
                  <option value="">Inquilino titular (opcional)...</option>
                  {inquilinos.map((i) => (
                    <option key={i.id} value={i.id}>{i.apellido}, {i.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className={btnPrimary}>{editingId ? 'Guardar' : 'Agregar'}</button>
            {editingId && (
              <button type="button" className={btnSecondary} onClick={onCancel}>Cancelar</button>
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
              <th className={th}>Número</th>
              <th className={th}>Inmueble</th>
              <th className={th}>Vigencia</th>
              <th className={th}>Monto mensual</th>
              <th className={th}>Estado</th>
              <th className={th}>Inquilinos</th>
              {!esInquilino && <th className={th}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((contrato) => (
              <tr key={contrato.id} className={tableRow}>
                <td className={`${td} font-medium text-slate-900 dark:text-white`}>{contrato.numero_contrato}</td>
                <td className={td}>{contrato.inmueble_direccion}</td>
                <td className={`${td} whitespace-nowrap`}>{contrato.fecha_inicio} a {contrato.fecha_fin}</td>
                <td className={`${td} tabular-nums`}>{contrato.monto_mensual}</td>
                <td className={td}>
                  <Badge tone={ESTADO_CONTRATO_TONO[contrato.estado]}>
                    {ESTADO_CONTRATO.find((s) => s.value === contrato.estado)?.label}
                  </Badge>
                </td>
                <td className={`${td} min-w-48`}>
                  <ul className="mb-1.5 list-none space-y-0.5 p-0 text-xs text-slate-600 dark:text-slate-400">
                    {contrato.inquilinos_detalle?.map((ci) => (
                      <li key={ci.id}>
                        {ci.inquilino_nombre} <span className="text-slate-400 dark:text-slate-500">({ROL_INQUILINO.find((r) => r.value === ci.rol)?.label})</span>
                      </li>
                    ))}
                  </ul>
                  {!esInquilino && (
                    agregando === contrato.id ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <select
                          className={`${input} w-36 py-1 text-xs`}
                          value={nuevoInquilino.inquilino}
                          onChange={(e) => setNuevoInquilino({ ...nuevoInquilino, inquilino: e.target.value })}
                        >
                          <option value="">Inquilino...</option>
                          {inquilinos.map((i) => (
                            <option key={i.id} value={i.id}>{i.apellido}, {i.nombre}</option>
                          ))}
                        </select>
                        <select
                          className={`${input} w-28 py-1 text-xs`}
                          value={nuevoInquilino.rol}
                          onChange={(e) => setNuevoInquilino({ ...nuevoInquilino, rol: e.target.value })}
                        >
                          {ROL_INQUILINO.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <button type="button" className={`${btnPrimary} ${btnSm}`} onClick={() => handleAgregarInquilino(contrato.id)}>
                          Guardar
                        </button>
                        <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => setAgregando(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => setAgregando(contrato.id)}>
                        + inquilino
                      </button>
                    )
                  )}
                </td>
                {!esInquilino && (
                  <td className={`${td} text-right`}>
                    <div className="flex justify-end gap-2">
                      <button type="button" className={`${btnSecondary} ${btnSm}`} onClick={() => handleEdit(contrato)}>Editar</button>
                      <button type="button" className={`${btnDanger} ${btnSm}`} onClick={() => handleDelete(contrato.id)}>Eliminar</button>
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
