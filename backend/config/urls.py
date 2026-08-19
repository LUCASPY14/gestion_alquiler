# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from alquiler.views import (
    UserViewSet, CiudadViewSet, InmuebleViewSet, InquilinoViewSet,
    ContratoAlquilerViewSet, ContratoInquilinoViewSet, PagoViewSet, GastoViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'ciudades', CiudadViewSet)
router.register(r'inmuebles', InmuebleViewSet)
router.register(r'inquilinos', InquilinoViewSet)
router.register(r'contratos', ContratoAlquilerViewSet)
router.register(r'contrato-inquilinos', ContratoInquilinoViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'gastos', GastoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),  # Todas las rutas de la API estarán bajo /api/
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]