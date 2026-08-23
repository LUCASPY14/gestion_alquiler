import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import api from '../api/client';
import CiudadesPage from './CiudadesPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const CIUDADES = [
  { id: 1, nombre: 'Asunción', departamento: 'Central' },
  { id: 2, nombre: 'Luque', departamento: 'Central' },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { count: 2, next: null, results: CIUDADES } });
});

describe('CiudadesPage (integración con useCrudForm)', () => {
  it('lista las ciudades cargadas', async () => {
    render(<CiudadesPage />);

    expect(await screen.findByText('Asunción')).toBeInTheDocument();
    expect(screen.getByText('Luque')).toBeInTheDocument();
  });

  it('agrega una ciudad nueva y limpia el formulario', async () => {
    api.post.mockResolvedValue({ data: { id: 3, nombre: 'Encarnación', departamento: 'Itapúa' } });
    const user = userEvent.setup();
    render(<CiudadesPage />);
    await screen.findByText('Asunción');

    await user.type(screen.getByLabelText('Nombre'), 'Encarnación');
    await user.type(screen.getByLabelText('Departamento'), 'Itapúa');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/ciudades/', { nombre: 'Encarnación', departamento: 'Itapúa' }),
    );
    expect(screen.getByLabelText('Nombre')).toHaveValue('');
  });

  it('editar precarga el formulario y guarda con update', async () => {
    api.patch.mockResolvedValue({});
    const user = userEvent.setup();
    render(<CiudadesPage />);
    await screen.findByText('Asunción');

    const filaAsuncion = screen.getByText('Asunción').closest('tr');
    await user.click(within(filaAsuncion).getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Nombre')).toHaveValue('Asunción');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/ciudades/1/', { nombre: 'Asunción', departamento: 'Central' }),
    );
  });

  it('eliminar pide confirmación antes de llamar al backend', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<CiudadesPage />);
    await screen.findByText('Asunción');

    const filaAsuncion = screen.getByText('Asunción').closest('tr');
    await user.click(within(filaAsuncion).getByRole('button', { name: 'Eliminar' }));

    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar esta ciudad?');
    expect(api.delete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
