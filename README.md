# SIA — Sistema de Inserción Automática (BGH)

Web app para registrar magazines producidos por las líneas SMD1..SMD8, con panel admin y dashboard analítico. Pensada para correr on-prem con Docker Compose.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL 16
- NextAuth (Credentials) — **sesión sin expiración automática**, login/logout manual
- Recharts (gráficos) — xlsx (export Excel)

## Estructura
```
SIA/
├── docker-compose.yml       # app + db
├── Dockerfile
├── docker/entrypoint.sh     # espera DB, db push, seed, start
├── prisma/schema.prisma     # modelos
├── prisma/seed.ts           # seed SMD1..SMD8 + admin inicial
└── src/
    ├── app/
    │   ├── login/           # login
    │   ├── (app)/           # magazines, wo, defectivos (todos los roles)
    │   ├── admin/           # dashboard, users, work-orders (solo ADMIN)
    │   └── api/             # endpoints REST
    ├── components/
    ├── lib/                 # db, auth, rbac, shift
    ├── middleware.ts        # protección por rol
    └── types/
```

## Deploy on-prem con Docker

1. Instalar Docker y Docker Compose en el servidor de planta.
2. Clonar/copiar este repo al servidor.
3. Copiar `.env.example` a `.env` y editarlo:
   ```bash
   cp .env.example .env
   ```
   - Cambiar `POSTGRES_PASSWORD` a algo fuerte.
   - Generar un `NEXTAUTH_SECRET` seguro (ej. `openssl rand -base64 48`).
   - Poner `NEXTAUTH_URL=http://<ip-del-servidor>:3000` o el dominio interno.
   - Definir usuario/pass del admin inicial.
4. Levantar:
   ```bash
   docker compose up -d --build
   ```
5. Ver logs:
   ```bash
   docker compose logs -f app
   ```
6. Abrir `http://<ip-servidor>:3000` y loguearse con las credenciales del admin inicial.

El entrypoint del contenedor `app`:
- Espera a que `db` esté disponible.
- Ejecuta `prisma db push` (sincroniza schema).
- Ejecuta el seed (crea SMD1..SMD8 y el admin inicial si no existe).
- Arranca el servidor Next en el puerto 3000.

## Roles
- **ADMIN**: todo + dashboard + CRUD de usuarios + gestión de WO.
- **SUPERVISOR**: carga magazines, reporta defectuosas, cierra WO, edita registros.
- **OPERADOR**: carga magazines, reporta defectuosas, cierra su WO.

## Dominio
- **Líneas**: SMD1..SMD8 (fijas, seedeadas).
- **Turnos**: `MORNING` (06–14) y `AFTERNOON` (resto). El formulario los precarga según la hora y pueden editarse.
- **WO**: número, código de producto, cantidad total, capacidad del magazine (17 / 25 / 50). La capacidad se fija por WO.
- **Magazine**: un registro por magazine cerrado (no acumulativo). El acumulado de una WO se calcula en las vistas.
- **Defectuosas**: se cargan al final del turno en una tabla aparte (`DefectiveReport`).

## Sesión
La sesión queda activa hasta que el usuario presione "Salir" en el header. No hay expiración automática. Esto cubre el turno completo y evita desconexiones durante la producción.

## Export
Desde `/magazines` se puede exportar el listado filtrado a XLSX o CSV.

## Backups
Para respaldar la BD:
```bash
docker exec sia_db pg_dump -U sia sia > backup_$(date +%F).sql
```

Para restaurar:
```bash
cat backup.sql | docker exec -i sia_db psql -U sia -d sia
```

## Desarrollo local (sin Docker)
```bash
npm install
cp .env.example .env           # ajustar DATABASE_URL
npx prisma db push
npm run db:seed
npm run dev
```

## Paleta
Azul corporativo BGH: `#14387f` (primary). Fondo blanco. Letras en azul.
