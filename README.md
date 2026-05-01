# SIA — Sistema de Inserción Automática (BGH)

Aplicación web on-prem para registrar la producción de las líneas SMD: magazines, work orders, defectivos y paradas de línea. Diseñada para correr en un servidor de planta con Docker Compose.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL 16
- NextAuth (sesión sin expiración automática, login/logout manual)
- Recharts para gráficos del dashboard

## Quick start

```bash
git clone <url-del-repo> sia-bgh
cd sia-bgh
cp .env.example .env
# Editá .env: cambiá POSTGRES_PASSWORD, generá NEXTAUTH_SECRET, ajustá NEXTAUTH_URL
docker compose up -d --build
docker compose logs -f app
```

Cuando veas `Iniciando app...` y el log de Next.js, abrí `http://<ip-servidor>:3000` y entrá con las credenciales de admin que pusiste en `.env`.

> Si vas a usar otro puerto, ver [Instalación → cambiar puerto](docs/deploy/instalacion.md#cambiar-puerto).
> Si el build falla, ver [Troubleshooting](docs/deploy/troubleshooting.md).

## Documentación

| Para vos si sos... | Empezá por |
|---|---|
| Operador, supervisor, mantenimiento, programación | [Manuales por rol](docs/usuario/) (próximamente) |
| Admin del sistema / IT de planta | [Instalación](docs/deploy/instalacion.md) → [Operación](docs/deploy/operacion.md) |
| Desarrollador | [Setup local](docs/desarrollo/setup-local.md) (próximamente) |

- [Glosario del dominio](docs/glosario.md) — vocabulario común para todos.
- [Troubleshooting](docs/deploy/troubleshooting.md) — errores conocidos y cómo salir.
- [Changelog](docs/changelog.md) — qué cambió y cuándo.

## Roles

- **ADMIN**: dashboard + CRUD de usuarios + gestión de catálogos (estaciones, fallas) + todo lo que hacen los demás.
- **SUPERVISOR**: crear y cerrar Work Orders, validar paradas, cargar magazines/defectivos.
- **OPERADOR**: cargar magazines, cargar defectivos, iniciar paradas de línea.
- **MANTENIMIENTO**: intervenir y validar paradas de línea.
- **PROGRAMACION**: igual que mantenimiento, para fallas de programa/lanzamientos.

Detalle de qué puede hacer cada uno y cómo en la [guía de usuario](docs/usuario/).

## Backup rápido

```bash
docker exec sia_db pg_dump -U sia sia > backup_$(date +%F).sql
```

Detalles en [Operación → backups](docs/deploy/operacion.md#backups).
