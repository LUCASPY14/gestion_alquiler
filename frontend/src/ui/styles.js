// Clases de Tailwind reutilizadas entre las páginas de listado+formulario
// para que los 6 CRUD (Ciudades, Inmuebles, Inquilinos, Contratos, Pagos,
// Gastos) mantengan la misma apariencia sin repetir el mismo string largo
// en cada archivo.

export const btnPrimary =
  'inline-flex items-center justify-center rounded-md bg-accent-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent-500 dark:hover:bg-accent-600 dark:focus:ring-offset-slate-950';

export const btnSecondary =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950';

export const btnDanger =
  'inline-flex items-center justify-center rounded-md border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 dark:border-rose-900/60 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:focus:ring-offset-slate-950';

export const btnSm = 'px-2.5 py-1.5 text-xs';

export const input =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

export const label = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

export const field = 'flex flex-col';

export const checkboxRow = 'flex items-center gap-2 pt-5 text-sm text-slate-700 dark:text-slate-300';

export const checkbox =
  'h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500 dark:border-slate-600 dark:bg-slate-800';

export const card =
  'rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

export const th =
  'border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400';

export const td = 'border-b border-slate-100 px-3 py-2.5 align-middle dark:border-slate-800/60';

export const tableRow = 'transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40';

export const errorText = 'text-sm text-rose-600 dark:text-rose-400';

export const pageTitle = 'mb-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white';
