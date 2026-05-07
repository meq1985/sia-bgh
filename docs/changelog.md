# Changelog

Registro de cambios en SIA. Sigue el formato de [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [Unreleased]

### Agregado
- **Dashboard — sección "Paradas de línea"** con 5 gráficos nuevos:
  1. Tiempo de parada hoy por línea (incluye paradas en curso).
  2. Tendencia diaria de tiempo de parada — últimos 7 días.
  3. Top 10 estaciones por tiempo de parada — últimos 7 días.
  4. Top 10 fallas más frecuentes — últimos 7 días.
  5. MTTR por estación — últimos 30 días.
- `src/lib/lineStopAggregations.ts` con 5 helpers puros para las
  agregaciones, separados del UI para que sean testeables.
- 22 tests unitarios nuevos sobre los helpers.

### Cambiado
- **Paradas de línea — selector de WO al iniciar:** cuando la línea tiene
  2 o más WOs abiertas, se despliega un selector para elegir una en el
  momento de crear la parada (antes quedaba sin WO y había que editar
  después). Si hay una sola WO abierta se autovincula como antes; si no
  hay ninguna, la parada se registra sin WO.
- **Magazines — auto-cierre de WO al 100%.** El POST `/api/magazines`
  bloquea la creación si la WO ya está completa y, al alcanzar o
  superar el `totalQty`, cierra la WO automáticamente. El form de
  `Nuevo magazine` filtra las WOs completadas como defensa en
  profundidad.
- **Work Orders — reapertura.** Nuevo endpoint
  `POST /api/wo/[id]/reopen` y botón en el listado para reabrir WOs
  cerradas con menos del 100% producido (ADMIN/SUPERVISOR).
- **Work Orders — edición.** Nuevo endpoint `PATCH /api/wo/[id]` con
  modal en la UI. Si la WO no tiene magazines se pueden editar todos
  los campos (`woNumber`, `productCode`, `totalQty`, `dailyTargetQty`,
  `magazineCapacity`, `smdLineId`); con magazines cargados se restringe
  a `productCode`, `totalQty`, `dailyTargetQty` y `magazineCapacity`.
- **Magazines y WOs — borrado y edición para SUPERVISOR.** Antes
  `DELETE /api/magazines/[id]` y `DELETE /api/wo/[id]` requerían ADMIN;
  ahora también lo permite SUPERVISOR. La UI suma botones Editar/Borrar
  por fila en `/magazines` y `/work-orders`.
- **Magazines — formulario embebido en `/magazines`.** Se eliminó la
  página `/magazines/new` y el botón "Nuevo magazine"; el formulario
  ahora aparece arriba del listado, igual que en `/paradas`. Se filtran
  las WOs al 100% para que no aparezcan en el desplegable.
- **Work Orders — filtros en el listado.** Nueva sección de filtros en
  `/work-orders` con búsqueda por número de WO o código de producto,
  línea, estado (Abiertas/Cerradas) y rango de fechas de apertura.
- **Nuevo concepto: panel y troquel.** Lo que antes se llamaba "placa"
  pasa a llamarse **panel**. La WO suma un campo `troquel: Int` que
  indica cuántas placas se obtienen de cada panel. La columna
  `Magazine.placasCount` mantiene su nombre por compatibilidad pero
  ahora representa **paneles**. El producido y el avance se calculan
  como `paneles × troquel = placas` y se comparan contra
  `WorkOrder.totalQty` (que sigue siendo placas). El troquel es
  obligatorio al crear una WO; las WOs existentes quedan en troquel=1
  (default de migración).
- Helpers nuevos: `panelsFromMagazines` (renombrado desde
  `producedFromMagazines`) y `producedPlacasFromMagazines` en
  `src/lib/wo.ts`. Tests actualizados.
- UI: form de Nueva WO suma input "Troquel"; label "Capacidad" pasa a
  "Capacidad (paneles × magazine)". Listado de WO suma columna
  Troquel. En `/magazines` la columna "Placas" se renombra a "Paneles"
  y "Acumulado WO" pasa a mostrarse en placas. El export incluye
  Troquel y la columna "Placas" calculada.

### Agregado (helpers)
- `src/lib/wo.ts` con `producedFromMagazines` e `isWoComplete`,
  reusados en API, dashboard y UI.
- `canManageMagazines` y `canManageWorkOrders` en
  `src/lib/permissions.ts`.
- Tests unitarios nuevos en `src/lib/wo.test.ts` y casos extra en
  `src/lib/permissions.test.ts`.

### Próximamente
- Flujo de defectivos con destino: Validación / Reparación / Scrap.
- Cierre formal de turno con override por horas extra.

## [0.1.0] — 2026-04

Versión inicial usable on-prem para registro de producción y paradas de línea.

### Producción
- Líneas SMD1..SMD8 seedeadas.
- Work Orders con línea, código de producto, capacidad de magazine, total objetivo y target diario.
- Magazines con código, placas, turno, asociación a WO.
- Defectivos por línea + WO + turno (contador único, sin destino).
- Listado de magazines con acumulado por WO en orden cronológico.

### Paradas de línea
- Catálogo de estaciones (16 seedeadas) y fallas comunes filtradas por estación.
- Paradas con inicio/fin manual o por botón, falla común + texto libre, comentario.
- Auto-vinculación de WO si la línea tiene una sola WO abierta.
- Flujo de finalización con selección de rol + usuario intervinente.
- Validación / rechazo restringido al usuario intervinente (con ADMIN como override). Rechazo exige comentario.

### Roles y RBAC
- 5 roles: ADMIN, SUPERVISOR, OPERADOR, MANTENIMIENTO, PROGRAMACION.
- Middleware de protección por rol para `/admin/*` y `/work-orders`.
- Helpers puros en `src/lib/permissions.ts` con tests.

### Dashboard
- Avance de orden por línea (% producido vs total objetivo).
- Producción de hoy por línea (placas + defectuosas).
- FPY por WO activa, agrupado por línea.
- Cumplimiento del target diario por línea.
- Tabla "WOs abiertas — detalle" con FPY individual.

### Admin
- CRUD de usuarios con cambio de rol, activación, reset de contraseña.
- CRUD de estaciones con desactivación y borrado seguro.
- CRUD de fallas comunes filtradas por estación.

### Infraestructura
- Docker Compose con Postgres 16 y Next.js 15.
- Entrypoint con espera de DB, `prisma db push` automático y seed.
- Postinstall que regenera el cliente Prisma.
- CI con typecheck + lint + tests + build.
- 48 tests unitarios cubriendo helpers puros (`fpy`, `cumulative`, `shift`, `stopCodes`, `permissions`).

### Documentación
- README con quick start.
- Glosario del dominio.
- Guía de instalación, operación y troubleshooting.

### Bugs corregidos durante la construcción
- Build de Docker fallaba con `apk add openssl` por mirror desactualizado: pinear Alpine 3.20 + `apk update`.
- `Buffer<ArrayBufferLike>` no asignable a `BodyInit` en route de export: envolver en `new Uint8Array`.
- `useSearchParams` sin Suspense en `/login`: separar form en componente interno con `<Suspense>`.
- `prisma generate` durante build de Docker fallaba por falta de schema: copiar `prisma/` antes del `npm install`.
- `vite-tsconfig-paths` ESM-only rompía vitest config en Windows: alias manual con `process.cwd()`.

---

## Cómo agregar una entrada

Cuando hagas un cambio, sumalo bajo `[Unreleased]` con el subtítulo correspondiente:

- **Agregado** — nuevas features.
- **Cambiado** — cambios en funcionalidad existente.
- **Deprecado** — features que se van a quitar.
- **Removido** — features eliminadas.
- **Corregido** — bugs.
- **Seguridad** — fixes de seguridad.

Cuando se cierra una versión:

1. Renombrá `[Unreleased]` por `[X.Y.Z] — YYYY-MM-DD`.
2. Creá una nueva sección `[Unreleased]` arriba.
3. Etiquetá el commit con `git tag vX.Y.Z`.
