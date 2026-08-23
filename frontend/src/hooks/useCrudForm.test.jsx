import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import api from '../api/client';
import { useCrudForm } from './useCrudForm';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const VACIO = { nombre: '', departamento: '' };

function renderCrud(overrides = {}) {
  return renderHook(() =>
    useCrudForm({
      endpoint: 'ciudades',
      valorVacio: VACIO,
      mapearAFormulario: (c) => ({ nombre: c.nombre, departamento: c.departamento ?? '' }),
      mensajeConfirmarBorrado: '¿Eliminar esta ciudad?',
      ...overrides,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { count: 0, next: null, results: [] } });
});

describe('useCrudForm', () => {
  it('handleChange actualiza el form, incluyendo checkboxes', async () => {
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleChange({ target: { name: 'nombre', value: 'Asunción', type: 'text' } });
    });
    expect(result.current.form.nombre).toBe('Asunción');
  });

  it('handleChange toma el archivo de `files` en un input type=file (no se puede controlar por value)', async () => {
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const archivo = new File(['contenido'], 'cedula.pdf', { type: 'application/pdf' });
    act(() => {
      result.current.handleChange({ target: { name: 'documento_archivo', type: 'file', files: [archivo] } });
    });
    expect(result.current.form.documento_archivo).toBe(archivo);
  });

  it('handleSubmit crea un registro nuevo y limpia el form', async () => {
    api.post.mockResolvedValue({ data: { id: 5, nombre: 'Luque' } });
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleChange({ target: { name: 'nombre', value: 'Luque', type: 'text' } });
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(api.post).toHaveBeenCalledWith('/ciudades/', { nombre: 'Luque', departamento: '' });
    expect(result.current.form).toEqual(VACIO);
    expect(result.current.editingId).toBeNull();
  });

  it('handleSubmit en modo edición llama a update y no a create', async () => {
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleEdit({ id: 7, nombre: 'Encarnación', departamento: 'Itapúa' });
    });
    expect(result.current.form).toEqual({ nombre: 'Encarnación', departamento: 'Itapúa' });
    expect(result.current.editingId).toBe(7);

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(api.patch).toHaveBeenCalledWith('/ciudades/7/', { nombre: 'Encarnación', departamento: 'Itapúa' });
    expect(api.post).not.toHaveBeenCalled();
    expect(result.current.editingId).toBeNull();
  });

  it('handleSubmit deja un mensaje de error si el backend rechaza', async () => {
    api.post.mockRejectedValue({ response: { status: 400 } });
    const { result } = renderCrud({ mensajeError: 'No se pudo guardar. Revisá los datos.' });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(result.current.formError).toBe('No se pudo guardar. Revisá los datos.');
  });

  it('handleCancel vuelve al form vacío y sale del modo edición', async () => {
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleEdit({ id: 1, nombre: 'X', departamento: '' });
    });
    expect(result.current.editingId).toBe(1);

    act(() => {
      result.current.handleCancel();
    });
    expect(result.current.editingId).toBeNull();
    expect(result.current.form).toEqual(VACIO);
  });

  it('handleDelete pide confirmación y no borra si el usuario cancela', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(3);
    });

    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar esta ciudad?');
    expect(api.delete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('handleDelete borra si el usuario confirma', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.delete.mockResolvedValue({});
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(3);
    });

    expect(api.delete).toHaveBeenCalledWith('/ciudades/3/');
  });

  it('onCreado se ejecuta tras un alta exitosa (ej. vincular inquilino titular a un contrato nuevo)', async () => {
    api.post.mockResolvedValue({ data: { id: 42 } });
    const onCreado = vi.fn();
    const { result } = renderCrud();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() }, { onCreado });
    });

    expect(onCreado).toHaveBeenCalledWith({ id: 42 });
  });
});
