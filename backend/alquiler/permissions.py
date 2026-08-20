from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import TipoUsuario


def es_staff_o_admin(user):
    return user.is_staff or user.is_superuser or user.tipo_usuario == TipoUsuario.ADMIN


class EsPropietarioOStaff(BasePermission):
    """Bloquea escritura para usuarios de tipo INQUILINO; el resto puede escribir
    (el aislamiento de qué ve/edita cada quien lo resuelve el queryset del viewset)."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.tipo_usuario != TipoUsuario.INQUILINO
