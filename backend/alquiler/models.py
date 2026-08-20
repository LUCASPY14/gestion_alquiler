from decimal import Decimal

from django.db import models
from django.db.models import Q, F, Func
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators
from django.core.validators import MinValueValidator

# --------------------- CHOICES (Opciones) ---------------------
class TipoUsuario(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrador'
    PROPIETARIO = 'PROPIETARIO', 'Propietario'
    INQUILINO = 'INQUILINO', 'Inquilino'

class TipoInmueble(models.TextChoices):
    CASA = 'CASA', 'Casa'
    DEPARTAMENTO = 'DPTO', 'Departamento'
    LOCAL = 'LOCAL', 'Local Comercial'
    OFICINA = 'OFIC', 'Oficina'
    OTRO = 'OTRO', 'Otro'

class TipoDocumento(models.TextChoices):
    DNI = 'DNI', 'DNI'
    NIE = 'NIE', 'NIE'
    PASAPORTE = 'PAS', 'Pasaporte'

class MetodoPago(models.TextChoices):
    EFECTIVO = 'EFEC', 'Efectivo'
    TRANSFERENCIA = 'TRANS', 'Transferencia'
    TARJETA = 'TARJ', 'Tarjeta'
    CHEQUE = 'CHEQ', 'Cheque'

class EstadoPago(models.TextChoices):
    PAGADO = 'PAG', 'Pagado'
    PENDIENTE = 'PEN', 'Pendiente'
    ANULADO = 'ANU', 'Anulado'

class PeriodicidadContrato(models.TextChoices):
    MENSUAL = 'MEN', 'Mensual'
    TRIMESTRAL = 'TRI', 'Trimestral'
    ANUAL = 'ANU', 'Anual'

class EstadoContrato(models.TextChoices):
    ACTIVO = 'ACT', 'Activo'
    FINALIZADO = 'FIN', 'Finalizado'
    RESCINDIDO = 'RES', 'Rescindido'
    RENOVADO = 'REN', 'Renovado'

class RolInquilino(models.TextChoices):
    TITULAR = 'TIT', 'Titular'
    CODEUDOR = 'COD', 'Codeudor'
    FIADOR = 'FIA', 'Fiador/Garante'

class CategoriaGasto(models.TextChoices):
    REPARACION = 'REP', 'Reparación'
    IMPUESTO = 'IMP', 'Impuesto'
    SERVICIOS = 'SERV', 'Servicios (agua/luz)'
    OTRO = 'OTRO', 'Otro'


# --------------------- BASE ---------------------
class TimeStampedModel(models.Model):
    creado_en = models.DateTimeField('Creado el', auto_now_add=True)
    actualizado_en = models.DateTimeField('Actualizado el', auto_now=True)

    class Meta:
        abstract = True


# --------------------- MODELO DE USUARIO PERSONALIZADO ---------------------
class User(AbstractUser):
    telefono = models.CharField('Teléfono', max_length=20, blank=True)
    tipo_usuario = models.CharField(
        'Tipo de usuario', max_length=20,
        choices=TipoUsuario.choices, default=TipoUsuario.PROPIETARIO,
    )

    def __str__(self):
        return self.username


# --------------------- CATÁLOGOS ---------------------
class Ciudad(models.Model):
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    departamento = models.CharField('Departamento/Provincia', max_length=100, blank=True)

    class Meta:
        verbose_name = 'Ciudad'
        verbose_name_plural = 'Ciudades'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


# --------------------- MODELOS DE NEGOCIO ---------------------

class Inmueble(TimeStampedModel):
    propietario = models.ForeignKey(User, on_delete=models.PROTECT, related_name='inmuebles')
    codigo_referencia = models.CharField('Código de referencia', max_length=20, unique=True)
    direccion = models.CharField('Dirección', max_length=255)
    ciudad = models.ForeignKey(Ciudad, on_delete=models.PROTECT, related_name='inmuebles')
    tipo = models.CharField('Tipo', max_length=10, choices=TipoInmueble.choices)
    habitaciones = models.PositiveIntegerField('Habitaciones', default=0)
    banos = models.PositiveIntegerField('Baños', default=0)
    area_construida = models.DecimalField('Área construida (m²)', max_digits=10, decimal_places=2, blank=True, null=True)
    precio_mensual = models.DecimalField(
        'Precio mensual (Gs)', max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    deposito_garantia = models.DecimalField('Depósito de garantía (Gs)', max_digits=12, decimal_places=2, blank=True, null=True)
    disponible = models.BooleanField('Disponible', default=True)
    foto_principal = models.ImageField('Foto principal', upload_to='inmuebles/fotos/', blank=True, null=True)

    class Meta:
        verbose_name = 'Inmueble'
        verbose_name_plural = 'Inmuebles'
        ordering = ['codigo_referencia']
        constraints = [
            models.CheckConstraint(condition=Q(precio_mensual__gt=0), name='inmueble_precio_mensual_positivo'),
        ]

    def __str__(self):
        return f"{self.codigo_referencia} - {self.direccion[:30]}"


class Inquilino(TimeStampedModel):
    nombre = models.CharField('Nombre', max_length=100)
    apellido = models.CharField('Apellido', max_length=100)
    tipo_documento = models.CharField('Tipo de documento', max_length=3, choices=TipoDocumento.choices)
    numero_documento = models.CharField('Número de documento', max_length=20)
    email = models.EmailField('Correo electrónico')
    telefono_principal = models.CharField('Teléfono principal', max_length=20)
    telefono_secundario = models.CharField('Teléfono secundario', max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField('Fecha de nacimiento', blank=True, null=True)
    activo = models.BooleanField('Activo', default=True)
    registrado_por = models.ForeignKey(
        User, on_delete=models.PROTECT, null=True, blank=True,
        related_name='inquilinos_registrados',
    )
    usuario = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='inquilino_perfil',
    )

    class Meta:
        verbose_name = 'Inquilino'
        verbose_name_plural = 'Inquilinos'
        ordering = ['apellido', 'nombre']
        constraints = [
            models.UniqueConstraint(fields=['tipo_documento', 'numero_documento'], name='inquilino_documento_unico'),
        ]

    def __str__(self):
        return f"{self.apellido}, {self.nombre} ({self.numero_documento})"


class ContratoAlquiler(TimeStampedModel):
    inmueble = models.ForeignKey(Inmueble, on_delete=models.PROTECT, related_name='contratos')
    inquilinos = models.ManyToManyField(Inquilino, through='ContratoInquilino', related_name='contratos')
    numero_contrato = models.CharField('Número de contrato', max_length=50, unique=True)
    fecha_inicio = models.DateField('Fecha de inicio')
    fecha_fin = models.DateField('Fecha de fin')
    monto_mensual = models.DecimalField(
        'Monto mensual (Gs)', max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    deposito = models.DecimalField(
        'Depósito (Gs)', max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
    )
    periodicidad = models.CharField('Periodicidad', max_length=3, choices=PeriodicidadContrato.choices, default=PeriodicidadContrato.MENSUAL)
    estado = models.CharField('Estado', max_length=3, choices=EstadoContrato.choices, default=EstadoContrato.ACTIVO)
    documento_contrato = models.FileField('Documento del contrato (PDF)', upload_to='contratos/', blank=True, null=True)

    class Meta:
        verbose_name = 'Contrato de alquiler'
        verbose_name_plural = 'Contratos de alquiler'
        ordering = ['-fecha_inicio']
        constraints = [
            models.CheckConstraint(condition=Q(fecha_fin__gt=F('fecha_inicio')), name='contrato_fecha_fin_posterior'),
            models.CheckConstraint(condition=Q(monto_mensual__gt=0), name='contrato_monto_mensual_positivo'),
            models.CheckConstraint(condition=Q(deposito__gte=0), name='contrato_deposito_no_negativo'),
            ExclusionConstraint(
                name='contrato_sin_solapamiento_por_inmueble',
                expressions=[
                    (Func('fecha_inicio', 'fecha_fin', function='daterange'), RangeOperators.OVERLAPS),
                    ('inmueble', RangeOperators.EQUAL),
                ],
                condition=Q(estado=EstadoContrato.ACTIVO),
            ),
        ]

    def __str__(self):
        return f"{self.numero_contrato} - {self.inmueble.codigo_referencia}"


class ContratoInquilino(models.Model):
    contrato = models.ForeignKey(ContratoAlquiler, on_delete=models.CASCADE, related_name='contrato_inquilinos')
    inquilino = models.ForeignKey(Inquilino, on_delete=models.PROTECT, related_name='contrato_inquilinos')
    rol = models.CharField('Rol', max_length=3, choices=RolInquilino.choices, default=RolInquilino.TITULAR)

    class Meta:
        verbose_name = 'Inquilino de contrato'
        verbose_name_plural = 'Inquilinos de contrato'
        constraints = [
            models.UniqueConstraint(fields=['contrato', 'inquilino'], name='contrato_inquilino_unico'),
        ]

    def __str__(self):
        return f"{self.inquilino} - {self.contrato} ({self.get_rol_display()})"


class Pago(TimeStampedModel):
    contrato = models.ForeignKey(ContratoAlquiler, on_delete=models.PROTECT, related_name='pagos')
    fecha_pago = models.DateField('Fecha de pago')
    fecha_periodo = models.DateField('Fecha del período (mes al que corresponde)')
    monto = models.DecimalField(
        'Monto (Gs)', max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    metodo_pago = models.CharField('Método de pago', max_length=10, choices=MetodoPago.choices)
    comprobante = models.FileField('Comprobante', upload_to='comprobantes/', blank=True, null=True)
    observaciones = models.TextField('Observaciones', blank=True, null=True)
    estado = models.CharField('Estado', max_length=3, choices=EstadoPago.choices, default=EstadoPago.PENDIENTE)
    recibo_pdf = models.FileField(
        'Recibo (PDF)', upload_to='recibos/', blank=True, null=True, editable=False,
    )

    @property
    def numero_recibo(self):
        return f'REC-{self.id:06d}'

    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago']
        constraints = [
            models.CheckConstraint(condition=Q(monto__gt=0), name='pago_monto_positivo'),
            models.UniqueConstraint(fields=['contrato', 'fecha_periodo'], name='pago_periodo_unico_por_contrato'),
        ]

    def __str__(self):
        return f"Pago {self.id} - {self.contrato.numero_contrato} ({self.monto} Gs)"


class Gasto(TimeStampedModel):
    inmueble = models.ForeignKey(Inmueble, on_delete=models.CASCADE, related_name='gastos')
    descripcion = models.CharField('Descripción', max_length=200)
    monto = models.DecimalField(
        'Monto (Gs)', max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    fecha = models.DateField('Fecha del gasto')
    categoria = models.CharField('Categoría', max_length=5, choices=CategoriaGasto.choices)
    comprobante = models.FileField('Comprobante', upload_to='gastos/', blank=True, null=True)
    pagado = models.BooleanField('¿Pagado?', default=True)
    observaciones = models.TextField('Observaciones', blank=True, null=True)

    class Meta:
        verbose_name = 'Gasto'
        verbose_name_plural = 'Gastos'
        ordering = ['-fecha']
        constraints = [
            models.CheckConstraint(condition=Q(monto__gt=0), name='gasto_monto_positivo'),
        ]

    def __str__(self):
        return f"{self.descripcion[:30]} - {self.monto} Gs ({self.fecha})"
