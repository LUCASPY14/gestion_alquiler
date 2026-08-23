export const TIPO_USUARIO = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'PROPIETARIO', label: 'Propietario' },
  { value: 'INQUILINO', label: 'Inquilino' },
];

export const TIPO_INMUEBLE = [
  { value: 'CASA', label: 'Casa' },
  { value: 'DPTO', label: 'Departamento' },
  { value: 'LOCAL', label: 'Local Comercial' },
  { value: 'OFIC', label: 'Oficina' },
  { value: 'OTRO', label: 'Otro' },
];

export const TIPO_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'NIE', label: 'NIE' },
  { value: 'PAS', label: 'Pasaporte' },
];

export const PERIODICIDAD_CONTRATO = [
  { value: 'MEN', label: 'Mensual' },
  { value: 'TRI', label: 'Trimestral' },
  { value: 'ANU', label: 'Anual' },
];

export const ESTADO_CONTRATO = [
  { value: 'ACT', label: 'Activo' },
  { value: 'FIN', label: 'Finalizado' },
  { value: 'RES', label: 'Rescindido' },
  { value: 'REN', label: 'Renovado' },
];

export const ESTADO_CONTRATO_TONO = { ACT: 'green', FIN: 'slate', RES: 'rose', REN: 'accent' };

export const ROL_INQUILINO = [
  { value: 'TIT', label: 'Titular' },
  { value: 'COD', label: 'Codeudor' },
  { value: 'FIA', label: 'Fiador/Garante' },
];

export const METODO_PAGO = [
  { value: 'EFEC', label: 'Efectivo' },
  { value: 'TRANS', label: 'Transferencia' },
  { value: 'TARJ', label: 'Tarjeta' },
  { value: 'CHEQ', label: 'Cheque' },
];

export const ESTADO_PAGO = [
  { value: 'PAG', label: 'Pagado' },
  { value: 'PEN', label: 'Pendiente' },
  { value: 'ANU', label: 'Anulado' },
];

export const ESTADO_PAGO_TONO = { PAG: 'green', PEN: 'amber', ANU: 'rose' };

export const CATEGORIA_GASTO = [
  { value: 'REP', label: 'Reparación' },
  { value: 'IMP', label: 'Impuesto' },
  { value: 'SERV', label: 'Servicios (agua/luz)' },
  { value: 'OTRO', label: 'Otro' },
];
