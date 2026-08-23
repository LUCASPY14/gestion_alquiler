import { useState } from 'react';
import { useResource } from './useResource';

const IDENTIDAD = (item) => item;

/**
 * Encapsula el patrón repetido en las páginas de listado+formulario CRUD:
 * estado del formulario, alta/edición/baja contra `useResource`, y los
 * handlers de UI que antes se reescribían en cada página.
 */
export function useCrudForm({
  endpoint,
  valorVacio,
  mapearAFormulario = IDENTIDAD,
  mensajeError = 'No se pudo guardar. Revisá los datos.',
  mensajeConfirmarBorrado = '¿Eliminar este registro?',
  params,
}) {
  const resource = useResource(endpoint, { params });
  const [form, setForm] = useState(valorVacio);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      // <input type="file"> no se puede controlar con `value` (por seguridad
      // del navegador): tomamos el archivo elegido directo de `files`.
      setForm((f) => ({ ...f, [name]: files[0] ?? null }));
      return;
    }
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e, { onCreado } = {}) {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) {
        await resource.update(editingId, form);
      } else {
        const creado = await resource.create(form);
        if (onCreado) await onCreado(creado);
      }
      setForm(valorVacio);
      setEditingId(null);
    } catch {
      setFormError(mensajeError);
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm(mapearAFormulario(item));
  }

  function handleCancel() {
    setEditingId(null);
    setForm(valorVacio);
  }

  async function handleDelete(id) {
    if (!window.confirm(mensajeConfirmarBorrado)) return;
    await resource.remove(id);
  }

  return {
    ...resource,
    form,
    setForm,
    editingId,
    formError,
    handleChange,
    handleSubmit,
    handleEdit,
    handleCancel,
    handleDelete,
  };
}
