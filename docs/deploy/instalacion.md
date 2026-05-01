# Instalación

Cómo levantar SIA por primera vez en un servidor de planta.

## Requisitos

- **Docker** y **Docker Compose** v2 instalados.
- **2 GB RAM libre** mínimo (Postgres + Next.js + node).
- **5 GB disco** para datos (crece con magazines y paradas; ver [Operación → backups](operacion.md#backups)).
- Un puerto TCP libre para exponer la app (3000 por default; configurable, ver [cambiar puerto](#cambiar-puerto)).
- Un puerto TCP libre para Postgres si vas a conectarte desde fuera del contenedor (5432 por default; podés sacarlo del compose si solo usás la app).

## Paso 1 — Clonar el repo

```bash
git clone <url-del-repo> sia-bgh
cd sia-bgh
```

> Si el servidor no tiene acceso a internet directo, traé el repo en un USB o por SCP.

## Paso 2 — Configurar `.env`

```bash
cp .env.example .env
```

Editá `.env` con un editor cualquiera. Los campos a tocar **sí o sí**:

| Variable | Qué poner | Por qué |
|---|---|---|
| `POSTGRES_PASSWORD` | Algo fuerte (mínimo 16 chars) | Es la contraseña de la DB. Si la dejás en `cambiame`, cualquiera con acceso de red al puerto 5432 entra. |
| `NEXTAUTH_SECRET` | `openssl rand -base64 48` | Firma los JWT de sesión. Si lo cambiás, **se invalidan todas las sesiones activas**. |
| `NEXTAUTH_URL` | `http://<ip-o-dominio>:3000` | URL pública por la que los usuarios entran. Tiene que coincidir con cómo entran al sitio (puerto incluido). Si está mal, el login redirige mal y no podés entrar. |
| `ADMIN_INITIAL_USERNAME` | Usuario admin | Solo se usa la **primera vez**, para crear el admin inicial. |
| `ADMIN_INITIAL_PASSWORD` | Contraseña admin | Idem. Cambiala desde la app después del primer login. |
| `ADMIN_INITIAL_FULLNAME` | Nombre y apellido | Lo que aparece en el header. |

Lo demás (`POSTGRES_USER`, `POSTGRES_DB`, `DATABASE_URL`) podés dejarlo como está si no tenés un Postgres preexistente.

> **Importante**: `DATABASE_URL` apunta al host `db` (nombre del servicio en docker-compose), no a `localhost`. No lo cambies salvo que sepás lo que hacés.

## Paso 3 — Levantar los contenedores

```bash
docker compose up -d --build
```

Primera vez tarda ~5 minutos: bajar la imagen de Postgres + buildear la imagen de la app + correr el seed.

## Paso 4 — Verificar que arrancó

```bash
docker compose logs -f app
```

Tenés que ver, en orden:

```
[entrypoint] Esperando a Postgres...
[entrypoint] Sincronizando schema (prisma db push)...
[entrypoint] Ejecutando seed...
[seed] Líneas SMD1..SMD8 aseguradas.
[seed] Estaciones y fallas comunes aseguradas.
[seed] Admin inicial creado: admin
[entrypoint] Iniciando app...
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
```

Si ves `[seed] Admin "admin" ya existe, se omite.` está OK — significa que ya corriste antes y no se recrea.

Si te traba antes, andá a [Troubleshooting](troubleshooting.md).

## Paso 5 — Primer login

Abrí `http://<ip-servidor>:<puerto>` en el navegador. Te lleva a `/login`. Ingresá con las credenciales de `ADMIN_INITIAL_USERNAME` / `ADMIN_INITIAL_PASSWORD`.

Lo primero que conviene hacer:

1. **Cambiar la contraseña del admin**: ir a `/admin/users`, en tu fila usá "Reset pass".
2. **Crear los demás usuarios**: ir a `/admin/users` → "Nuevo usuario". Asigná los roles correctos (ver [Glosario → Roles](../glosario.md#roles-y-permisos)).
3. **Revisar el catálogo de estaciones**: `/admin/stations`. Ya vienen las 16 del seed. Si tu planta usa otras, agregalas o desactivá las que no.
4. **Revisar el catálogo de fallas**: `/admin/failures`. Ya vienen 3-5 fallas típicas por estación. Personalizalas.

## Cambiar puerto

Si necesitás exponer la app en otro puerto (no 3000) tenés que tocar 3 lugares. Asumí `8080` como ejemplo.

### a) `Dockerfile`

```dockerfile
ENV PORT=8080
EXPOSE 8080
```

### b) `docker-compose.yml` — servicio `app`

```yaml
ports:
  - "8080:8080"
```

> Atajo si solo querés cambiar el puerto **del lado del servidor** y dejar 3000 dentro del contenedor: usá `"8080:3000"` en compose y **no** toques el Dockerfile. En ese caso `PORT` queda 3000.

### c) `.env`

```env
NEXTAUTH_URL=http://<ip-o-dominio>:8080
```

Crítico: si `NEXTAUTH_URL` no coincide con el puerto por el que entrás, el login no funciona.

### d) Reconstruir

```bash
docker compose down
docker compose up -d --build
```

## Cosas que NO hace falta

- Instalar Postgres en el host: lo levanta el compose dentro del contenedor `db`.
- Crear la DB ni las tablas a mano: el `entrypoint.sh` corre `prisma db push` al arrancar.
- Cargar los códigos de líneas, estaciones o fallas: el seed lo hace.

## Próximos pasos

- [Operación](operacion.md) — backups, logs, reinicios.
- [Troubleshooting](troubleshooting.md) — si algo se rompe.
