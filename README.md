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

## Frontend

```
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:5173`, consumiendo la API vía `VITE_API_URL` (ver `.env`).
