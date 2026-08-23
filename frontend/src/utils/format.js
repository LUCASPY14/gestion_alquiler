export function formatearGs(valor) {
  return `Gs. ${Math.round(Number(valor)).toLocaleString('es-PY')}`;
}

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

// `clave` viene como "YYYY-MM" del backend.
export function formatearMesCorto(clave) {
  const [anio, mes] = clave.split('-').map(Number);
  return `${MESES_CORTOS[mes - 1]} '${String(anio).slice(-2)}`;
}

export function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}
