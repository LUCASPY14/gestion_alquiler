from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible


@deconstructible
class ValidarTamanoArchivo:
    def __init__(self, max_mb):
        self.max_mb = max_mb

    def __call__(self, archivo):
        limite = self.max_mb * 1024 * 1024
        if archivo.size > limite:
            raise ValidationError(f'El archivo no puede superar los {self.max_mb} MB.')

    def __eq__(self, other):
        return isinstance(other, ValidarTamanoArchivo) and self.max_mb == other.max_mb
