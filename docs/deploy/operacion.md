# Operación

Tareas habituales para mantener SIA funcionando una vez instalado.

## Tabla de contenidos

- [Comandos del día a día](#comandos-del-día-a-día)
- [Logs](#logs)
- [Backups](#backups)
- [Restore](#restore)
- [Reinicio y actualizaciones](#reinicio-y-actualizaciones)
- [Recuperar acceso si te quedaste afuera](#recuperar-acceso-si-te-quedaste-afuera)
- [Reset completo de la base](#reset-completo-de-la-base)
- [Conectarse a Postgres directamente](#conectarse-a-postgres-directamente)
- [Volúmenes y persistencia](#volúmenes-y-persistencia)

## Comandos del día a día

```bash
# ver estado de los contenedores
docker compose ps

# detener (mantiene los datos)
docker compose stop

# arrancar de nuevo
docker compose start

# detener y borrar contenedores (mantiene los datos en el volumen)
docker compose down

# detener y borrar contenedores + volumen (borra TODOS los datos)
docker compose down -v

# rebuildear la imagen de la app y reiniciarla
docker compose up -d --build app
```

## Logs

```bash
# logs de la app en tiempo real
docker compose logs -f app

# logs de la base
docker compose logs -f db

# últimas 200 líneas de la app
docker compose logs --tail=200 app

# todo a un archivo
docker compose logs app > sia-app.log
```

Los logs viven en el filesystem de Docker (no en el repo). Si reiniciás los contenedores no se pierden, pero si hacés `docker compose down -v` sí.

## Backups

### Backup manual

```bash
docker exec sia_db pg_dump -U sia sia > backup_$(date +%F_%H%M).sql
```

Esto genera un archivo `.sql` con **todo** el contenido de la DB (schema + datos). El archivo queda en el directorio donde corriste el comando, **no** dentro del contenedor.

Tamaño esperado: bytes para una DB recién seedeada, MBs para una con meses de uso.

### Backup automático (cron)

En el host del servidor, agregá una entrada al cron del usuario que tiene acceso a Docker:

```bash
crontab -e
```

Línea para backup diario a las 02:00, manteniendo los últimos 14 días:

```cron
0 2 * * * cd /opt/sia-bgh && docker exec sia_db pg_dump -U sia sia > backups/sia_$(date +\%F).sql && find backups/ -type f -name "sia_*.sql" -mtime +14 -delete
```

Asegurate de:

- Crear el directorio `backups/` antes (`mkdir backups`).
- Tener `pg_dump` accesible adentro del contenedor (lo está, viene con la imagen `postgres:16-alpine`).
- Que el disco tenga espacio para 14 backups.

### Backup remoto

Mejor todavía: copiá el `.sql` a otro host con `rsync` o subilo a un bucket S3/MinIO. El cron de arriba no resuelve "se rompe el servidor entero".

## Restore

```bash
# desde un archivo .sql en el host
cat backup_2026-04-30.sql | docker exec -i sia_db psql -U sia -d sia
```

> **Atención**: el restore agrega datos sobre la DB existente. Si querés una restauración "limpia" hacé primero `docker compose down -v && docker compose up -d db` para arrancar con la DB vacía y después aplicar el dump.

Variante: si el archivo tiene estructura completa (CREATE TABLE etc.), `pg_dump` lo regenera. Pero el entrypoint del compose corre `prisma db push` que va a sincronizar el schema apenas levante la app, así que puede haber colisiones.

**Camino seguro para restaurar a un punto en el tiempo**:

1. `docker compose down -v` — borra volumen y contenedores.
2. `docker compose up -d db` — solo Postgres, sin la app (no corre seed).
3. `cat backup.sql | docker exec -i sia_db psql -U sia -d sia` — aplicás el dump.
4. `docker compose up -d app` — la app arranca, el entrypoint detecta que el schema ya existe y hace `db push` idempotente.

## Reinicio y actualizaciones

### Reiniciar solo la app (no toca la DB)

```bash
docker compose restart app
```

### Aplicar nueva versión de código

```bash
git pull
docker compose up -d --build app
```

`db push` se corre solo en el entrypoint si hubo cambios de schema. **Verificá los logs** después: si Prisma reporta "data loss", parate y mandanos eso antes de seguir.

### Cambiar `.env`

Modificás `.env` y después:

```bash
docker compose up -d
```

Compose detecta que cambió env y recrea los contenedores que dependen.

> **Cuidado con `NEXTAUTH_SECRET`**: cambiarlo invalida todas las sesiones activas. Cualquiera logueado va a tener que volver a entrar.

## Recuperar acceso si te quedaste afuera

Casos típicos: cambiaste a `admin` por otro usuario, lo desactivaste por accidente, te olvidaste la contraseña, etc.

### Plan A — re-crear admin desde el seed

El seed crea el usuario admin con `ADMIN_INITIAL_USERNAME` **solo si no existe**. Para forzarlo:

```bash
# editá .env y cambiá ADMIN_INITIAL_USERNAME a un nombre nuevo (ej. admin2)
docker compose exec app npx tsx prisma/seed.ts
```

Esto crea `admin2` con `ADMIN_INITIAL_PASSWORD`. Logueate con eso y reactivá tu admin original desde la UI.

### Plan B — resetear contraseña a mano en la DB

```bash
docker compose exec app sh
# adentro del contenedor:
node -e "require('bcryptjs').hash('NUEVA_PASS', 10).then(h => console.log(h))"
# copiate el hash que imprime, salí del contenedor
exit

# actualizá la fila en Postgres
docker exec -it sia_db psql -U sia -d sia
# adentro de psql:
UPDATE users SET "passwordHash" = '$2a$10$...EL_HASH...', active = true WHERE username = 'admin';
\q
```

## Reset completo de la base

Si necesitás tirar todo y empezar de cero:

```bash
docker compose down -v       # borra contenedores + volumen
docker compose up -d --build # rebuild + seed corre desde cero
```

Esto te deja con:
- Líneas SMD1..SMD8 cargadas
- 16 estaciones + fallas comunes seedeadas
- Admin inicial creado según `.env`
- 0 usuarios extra, 0 WOs, 0 magazines, 0 paradas

> **Antes de hacer esto, hacé un backup**. `down -v` es irreversible.

## Conectarse a Postgres directamente

### Desde el host (psql interno)

```bash
docker exec -it sia_db psql -U sia -d sia
```

Comandos útiles dentro de psql:

```sql
\dt                              -- listar tablas
\d users                         -- ver columnas de la tabla users
SELECT count(*) FROM line_stops; -- contar paradas
SELECT username, role, active FROM users ORDER BY active DESC, username;
\q                               -- salir
```

### Desde tu máquina (cliente externo)

El `docker-compose.yml` mapea `5432:5432`. Si querés conectarte con DBeaver, pgAdmin, TablePlus, etc.:

- Host: `<ip-del-servidor>` (o `localhost` si estás en el mismo host)
- Puerto: `5432`
- DB: `sia`
- User: `sia`
- Password: lo que pusiste en `POSTGRES_PASSWORD`

> **Si no querés exponer 5432 a la red**, sacá el bloque `ports` del servicio `db` en `docker-compose.yml`. La app sigue accediendo internamente; solo perdés el acceso externo.

## Volúmenes y persistencia

Lo que persiste entre reinicios:

| Dato | Dónde vive | Sobrevive a `down`? | Sobrevive a `down -v`? |
|---|---|---|---|
| Datos de Postgres | Volumen `sia_db_data` | Sí | **No** |
| Logs de los contenedores | Filesystem de Docker | No | No |
| Imágenes construidas | Filesystem de Docker | Sí | Sí |
| `.env` | Disco del host | Sí | Sí |
| Código fuente | Disco del host | Sí | Sí |

Reglas prácticas:

- Para reiniciar/actualizar: `docker compose up -d --build` o `docker compose restart`.
- Para liberar espacio sin perder datos: `docker compose down`.
- Para empezar de cero: `docker compose down -v` (con backup previo).

## Próximos pasos

- [Troubleshooting](troubleshooting.md) — qué hacer cuando algo falla.
- [Glosario](../glosario.md) — vocabulario del dominio si te perdés.
