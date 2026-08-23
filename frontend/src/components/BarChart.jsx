import { useState } from 'react';
import { formatearGs, formatearMesCorto } from '../utils/format';

const ALTO = 180;
const PADDING_SUP = 12;
const PADDING_INF = 24;
const ALTO_BARRAS = ALTO - PADDING_SUP - PADDING_INF;

function pathBarraRedondeadaArriba(x, anchoBarra, alto, radio) {
  const y = PADDING_SUP + (ALTO_BARRAS - alto);
  if (alto <= 0) return '';
  const r = Math.min(radio, anchoBarra / 2, alto);
  return `M${x},${y + alto} V${y + r} Q${x},${y} ${x + r},${y} H${x + anchoBarra - r} Q${x + anchoBarra},${y} ${x + anchoBarra},${y + r} V${y + alto} Z`;
}

export default function BarChart({ datos }) {
  const [hover, setHover] = useState(null);

  const max = Math.max(...datos.map((d) => d.total), 1);
  const anchoTotal = 760;
  const anchoBarra = anchoTotal / datos.length - 8;

  if (datos.every((d) => d.total === 0)) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        Sin pagos cobrados en este período.
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${anchoTotal} ${ALTO}`} className="w-full" role="img" aria-label="Ingresos por mes">
        <line
          x1="0" y1={PADDING_SUP + ALTO_BARRAS} x2={anchoTotal} y2={PADDING_SUP + ALTO_BARRAS}
          className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1"
        />
        {datos.map((d, i) => {
          const alto = (d.total / max) * ALTO_BARRAS;
          const x = i * (anchoTotal / datos.length) + 4;
          const activo = hover === i;
          return (
            <g key={d.mes}>
              <path
                d={pathBarraRedondeadaArriba(x, anchoBarra, alto > 0 ? Math.max(alto, 3) : 0, 4)}
                className={
                  activo
                    ? 'fill-accent-600 dark:fill-accent-400'
                    : 'fill-accent-200 dark:fill-accent-800'
                }
                style={{ transition: 'opacity 120ms' }}
              />
              <rect
                x={x} y={PADDING_SUP} width={anchoBarra} height={ALTO_BARRAS}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="cursor-default"
              />
              <text
                x={x + anchoBarra / 2} y={ALTO - 6} textAnchor="middle"
                className="fill-slate-400 text-[10px] dark:fill-slate-500"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatearMesCorto(d.mes)}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800"
          style={{
            left: `${((hover * (anchoTotal / datos.length) + anchoBarra / 2 + 4) / anchoTotal) * 100}%`,
            top: `${((PADDING_SUP + (ALTO_BARRAS - (datos[hover].total / max) * ALTO_BARRAS)) / ALTO) * 100}%`,
          }}
        >
          <div className="font-medium text-slate-900 dark:text-white">{formatearGs(datos[hover].total)}</div>
          <div className="text-slate-500 dark:text-slate-400">{formatearMesCorto(datos[hover].mes)}</div>
        </div>
      )}
    </div>
  );
}
