from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import (
    User, Ciudad, Inmueble, Inquilino,
    ContratoAlquiler, ContratoInquilino, Pago, Gasto,
)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    # admin.ModelAdmin genérico guardaría la contraseña tal cual se escribe
    # en el campo (sin hashear); heredando de UserAdmin se usan los forms de
    # auth (UserCreationForm/UserChangeForm) que sí llaman a set_password.
    list_display = ['username', 'email', 'tipo_usuario', 'is_active', 'is_staff']
    list_filter = ['tipo_usuario', 'is_active']
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Gestión Alquiler', {'fields': ('telefono', 'tipo_usuario')}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ('Gestión Alquiler', {'fields': ('telefono', 'tipo_usuario')}),
    )


@admin.register(Ciudad)
class CiudadAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'departamento']
    search_fields = ['nombre']


@admin.register(Inmueble)
class InmuebleAdmin(admin.ModelAdmin):
    list_display = ['codigo_referencia', 'direccion', 'ciudad', 'tipo', 'precio_mensual', 'disponible']
    list_filter = ['ciudad', 'tipo', 'disponible']
    search_fields = ['codigo_referencia', 'direccion']


@admin.register(Inquilino)
class InquilinoAdmin(admin.ModelAdmin):
    list_display = ['apellido', 'nombre', 'tipo_documento', 'numero_documento', 'activo', 'registrado_por', 'usuario']
    list_filter = ['registrado_por']
    search_fields = ['nombre', 'apellido', 'numero_documento']


class ContratoInquilinoInline(admin.TabularInline):
    model = ContratoInquilino
    extra = 1


@admin.register(ContratoAlquiler)
class ContratoAlquilerAdmin(admin.ModelAdmin):
    list_display = ['numero_contrato', 'inmueble', 'fecha_inicio', 'fecha_fin', 'estado']
    list_filter = ['estado', 'periodicidad']
    search_fields = ['numero_contrato']
    inlines = [ContratoInquilinoInline]


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ['contrato', 'fecha_pago', 'fecha_periodo', 'monto', 'estado', 'recibo_pdf']
    list_filter = ['estado', 'metodo_pago']
    readonly_fields = ['recibo_pdf']


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = ['inmueble', 'descripcion', 'monto', 'fecha', 'categoria', 'pagado']
    list_filter = ['categoria', 'pagado']
