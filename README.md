# gestion_alquiler

Sistema de control de alquiler de inmuebles, dividido en `backend/` (Django + DRF + PostgreSQL) y `frontend/` (React + Vite).

## Backend

```
cd backend
py -3.13 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # completar si hace falta
```

Levantar PostgreSQL (desde la raíz del repo):

```
docker compose up -d db
```

Migrar y correr:

```
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API disponible en `http://localhost:8000/api/`, admin en `http://localhost:8000/admin/`.

Documentación interactiva de la API (OpenAPI, generada con drf-spectacular):
- Swagger UI: `http://localhost:8000/api/docs/`
- Redoc: `http://localhost:8000/api/redoc/`
- Schema crudo: `http://localhost:8000/api/schema/`

## WhatsApp (recibos de pago)

Cuando un pago pasa a estado "Pagado", el sistema genera el recibo en PDF y lo
manda automáticamente por WhatsApp al inquilino titular del contrato, vía
[WAHA](https://waha.devlike.pro/) (WhatsApp HTTP API self-hosteada).

Levantar WAHA (desde la raíz del repo):

```
docker compose up -d waha
```

Vincular un número de WhatsApp (una sola vez; la sesión queda guardada en un
volumen y sobrevive a reinicios del contenedor):

1. Abrir `http://localhost:3010/dashboard`.
2. Crear una sesión (nombre `default`, para que coincida con `WAHA_SESSION` en `.env`).
3. Escanear el código QR con el WhatsApp que va a mandar los recibos.

Si WAHA no está corriendo o la sesión no está vinculada, el envío falla en
silencio (se loguea un warning) y no afecta el registro del pago ni la
generación del PDF — el recibo se puede descargar igual desde el panel.

## Frontend

```
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:5173`, consumiendo la API vía `VITE_API_URL` (ver `.env`).
