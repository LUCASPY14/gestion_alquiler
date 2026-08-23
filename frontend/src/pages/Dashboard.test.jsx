import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import api from '../api/client';
import Dashboard from './Dashboard';

vi.mock('../api/client', () => ({
  default: { get: vi.fn() },
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const RESUMEN = {
  conteos: { inmuebles: 4, inquilinos: 3, contratos: 2, pagos: 5, gastos: 1 },
  ingresos_por_mes: Array.from({ length: 12 }, (_, i) => ({
    mes: `2026-${String(i + 1).padStart(2, '0')}`,
    total: i === 11 ? 1500000 : 0,
  })),
  estado_pagos_mes: { PAG: 2, PEN: 1, ANU: 0 },
  alertas: {
    pagos_atrasados: { cantidad: 1, items: [{ id: 1, contrato_numero: 'CTR-0001', fecha_periodo: '2026-06-01', monto: 900000 }] },
    contratos_por_vencer: { cantidad: 0, items: [] },
  },
  ocupacion: { total: 4, disponibles: 1, ocupados: 3, porcentaje_ocupado: 75.0 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  it('propietario/admin: pide el resumen agregado y muestra sus secciones', async () => {
    mockUseAuth.mockReturnValue({ esInquilino: false });
    api.get.mockResolvedValue({ data: RESUMEN });

    renderDashboard();

    expect(await screen.findByText('Ingresos por mes')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/dashboard/resumen/');
    expect(screen.getByText('Ocupación')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('CTR-0001')).toBeInTheDocument();
    expect(screen.getByText('Ninguno en los próximos 30 días.')).toBeInTheDocument();
  });

  it('inquilino: no pide el resumen agregado, usa las tarjetas simples de siempre', async () => {
    mockUseAuth.mockReturnValue({ esInquilino: true });
    api.get.mockResolvedValue({ data: { count: 1 } });

    renderDashboard();

    await screen.findAllByText('1');
    expect(api.get).not.toHaveBeenCalledWith('/dashboard/resumen/');
    expect(screen.queryByText('Ingresos por mes')).not.toBeInTheDocument();
  });

  it('muestra un mensaje de error si falla la carga del resumen', async () => {
    mockUseAuth.mockReturnValue({ esInquilino: false });
    api.get.mockRejectedValue(new Error('network'));

    renderDashboard();

    expect(await screen.findByText('No se pudo cargar el resumen.')).toBeInTheDocument();
  });
});
