from django.apps import AppConfig


class AlquilerConfig(AppConfig):
    name = 'alquiler'

    def ready(self):
        from . import signals  # noqa: F401
