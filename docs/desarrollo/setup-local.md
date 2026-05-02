# Setup local para desarrollo

Cómo correr SIA en tu máquina (sin Docker) para desarrollar.

## Prerrequisitos

- **Node.js 20** (recomendado 20.18+).
- **npm** 10+.
- **Postgres 16** corriendo en algún lado:
  - Más fácil: levantar **solo el servicio db** del compose.
  - Alternativa: Postgres nativo en tu máquina.
- **Git** y un editor (recomendado VS Code con extensión de Prisma).

## Paso 1 — Clonar y entrar al repo

```bash
git clone <url-del-repo> sia-bgh
cd sia-bgh
```

## Paso 2 — Instalar dependencias

```bash
npm install
```

El `postinstall` corre `prisma generate` automáticamente, así que el cliente de Prisma queda generado contra el schema actual.

> Si esto falla en Windows con `vite-tsconfig-paths` ESM, ya está fixeado en el repo. Si volviera a aparecer, ver [troubleshooting](../deploy/troubleshooting.md#vite-tsconfig-paths-se-queja-de-esm-en-windows).

## Paso 3 — Levantar Postgres

Opción más simple: usar el `db` del compose.

```bash
# levanta SOLO postgres, no la app
docker compose up -d db
```

Esto te da Postgres 16 expuesto en `localhost:5432` con usuario `sia` / password lo que tengas en `.env`.

## Paso 4 — Configurar `.env`

```bash
cp .env.example .env
```

Editá `DATABASE_URL` para que apunte a `localhost` en vez de `db`:

```env
DATABASE_URL=postgresql://sia:cambiame@localhost:5432/sia?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cualquier-cosa-larga-para-dev
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=admin123
ADMIN_INITIAL_FULLNAME=Dev Admin
```

## Paso 5 — Sincronizar schema y seedear

```bash
npx prisma db push
npm run db:seed
```

`db push` crea las tablas según `prisma/schema.prisma`. `db:seed` agrega líneas SMD, estaciones, fallas y el admin inicial.

## Paso 6 — Arrancar el dev server

```bash
npm run dev
```

Listo. Abrí `http://localhost:3000`.

## Comandos útiles

```bash
# dev server con hot reload
npm run dev

# build de producción (lo que corre el Dockerfile)
npm run build

# arrancar la build
npm run start

# typecheck (no genera archivos)
npm run typecheck

# linter
npm run lint

# tests unitarios (una pasada)
npm test

# tests en watch mode
npm run test:watch

# cobertura de tests
npm run test:coverage

# regenerar el cliente de Prisma manualmente
npx prisma generate

# aplicar cambios de schema a la DB local
npx prisma db push

# Prisma Studio (GUI para la DB en localhost:5555)
npx prisma studio

# correr el seed de nuevo
npm run db:seed
```

## Estructura del repo

```
sia-bgh/
├── prisma/
│   ├── schema.prisma            # modelo de datos (fuente de verdad)
│   └── seed.ts                  # datos iniciales (SMDs, estaciones, fallas, admin)
├── src/
│   ├── app/                     # rutas Next.js (App Router)
│   │   ├── (app)/               # rutas autenticadas: magazines, work-orders, paradas...
│   │   ├── admin/               # rutas admin-only: dashboard, users, stations, failures
│   │   ├── api/                 # route handlers (REST)
│   │   ├── login/               # login page
│   │   └── layout.tsx           # root layout
│   ├── components/              # Header, Providers
│   ├── lib/                     # helpers puros + integración con Prisma/NextAuth
│   │   ├── auth.ts              # NextAuth options
│   │   ├── db.ts                # singleton de PrismaClient
│   │   ├── permissions.ts       # roles y helpers PUROS (testeable sin DB)
│   │   ├── rbac.ts              # requireSession/requireRole + re-export de permissions
│   │   ├── shift.ts             # detección de turno
│   │   ├── stopCodes.ts         # catálogo de códigos + helpers de duración
│   │   ├── fpy.ts               # cálculo de FPY
│   │   ├── cumulative.ts        # acumulado de placas por WO
│   │   └── *.test.ts            # tests unitarios al lado del código
│   ├── middleware.ts            # protección de rutas por rol
│   └── types/
│       └── next-auth.d.ts       # extensión de tipos de sesión
├── docs/                        # documentación (esto)
├── docker/                      # entrypoint del contenedor
├── public/                      # assets estáticos
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```

## Workflow típico de desarrollo

1. **Crear branch**: `git checkout -b feature/lo-que-sea`.
2. **Tocar código**: edits en `src/`. Si cambia el schema, también `prisma/schema.prisma`.
3. **Si cambió el schema**:
   ```bash
   npx prisma db push   # aplica a tu DB local
   npx prisma generate  # regenera cliente (lo hace solo el postinstall, pero forzalo si tipos no actualizan)
   ```
4. **Verificar localmente**:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```
5. **Commit + push**:
   ```bash
   git add -A
   git commit -m "feat: descripción corta del cambio"
   git push -u origin feature/lo-que-sea
   ```
6. **Abrir PR** contra `main`. CI corre los mismos checks de arriba + `npm run build`.

Más detalle en [contribuir.md](contribuir.md).

## Cosas que conviene saber

### El cliente de Prisma se regenera solo

`postinstall` corre `prisma generate` después de cualquier `npm install`. Si tipos no aparecen después de un cambio de schema, corré `npx prisma generate` a mano y reiniciá tu editor (TS server cachea).

### `db push` vs migrations

El proyecto usa `db push --accept-data-loss` (en el entrypoint de Docker) en lugar de `prisma migrate`. Esto es más simple para iterar pero tiene riesgos cuando hay datos. Si vas a cambiar el schema con datos existentes:

- Hacé el campo nullable primero.
- Backfilleá.
- Después hacelo NOT NULL.

Ver [troubleshooting → schema y migraciones](../deploy/troubleshooting.md#schema-y-migraciones) para casos.

### Rutas con grupo `(app)`

Carpetas con paréntesis en App Router son **route groups** — no agregan segmento a la URL pero permiten compartir layout. `src/app/(app)/layout.tsx` aplica auth a todo lo que está adentro.

### Server Components por default

Casi todas las páginas son async server components que llaman directo a Prisma. Solo lo que tiene `"use client"` arriba corre en el browser. Esto reduce mucho el código boilerplate de fetching pero hay que tener cuidado con qué ponés en cada lado.

### Path alias `@/`

`@/` apunta a `src/`. Configurado en `tsconfig.json`, `next.config.mjs` (vía Next), y `vitest.config.ts` (manual con `process.cwd()`).

## Próximos pasos

- [Arquitectura](arquitectura.md) — capas y flujos.
- [Modelo de datos](modelo-datos.md) — qué representa cada tabla.
- [Testing](testing.md) — qué probamos y cómo.
- [Contribuir](contribuir.md) — convenciones de commits, branches y PRs.
