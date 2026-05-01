# Troubleshooting

Errores que ya nos pasaron, con su causa y su fix. Si encontrás uno nuevo, agregalo acá.

## Tabla de contenidos

- [Build de Docker](#build-de-docker)
- [Prisma](#prisma)
- [NextAuth y login](#nextauth-y-login)
- [Schema y migraciones](#schema-y-migraciones)
- [GitHub Actions / CI](#github-actions--ci)
- [Tests](#tests)
- [General](#general)

---

## Build de Docker

### `apk add --no-cache libc6-compat openssl` falla con "no such package"

```
ERROR: unable to select packages:
  openssl (no such package):
    required by: world[openssl]
  ...
  masked in: --no-network
```

**Causa**: el tag `node:20-alpine` apunta a una base de Alpine cuyos índices locales de `apk` quedaron desincronizados con el mirror.

**Fix**: ya aplicado en el repo. El `Dockerfile` pinea `node:20-alpine3.20` y corre `apk update` antes de `apk add`. Si vuelve a aparecer en una versión nueva de Alpine, repetí: pinear a una versión anterior y/o agregar `apk update`.

### `prisma generate` falla durante `npm install` con "schema not found"

```
Error: Could not find Prisma Schema that is required for this command.
schema.prisma: file not found
prisma/schema.prisma: file not found
```

**Causa**: el `postinstall` del `package.json` corre `prisma generate`, pero el `Dockerfile` hace `npm install` antes de copiar `prisma/`.

**Fix**: ya aplicado. El `Dockerfile` ahora copia `prisma/` **antes** del `npm install`:

```dockerfile
COPY package.json package-lock.json* ./
COPY prisma ./prisma     # ← antes del install
RUN npm install
```

Bonus: aprovecha mejor el cache de Docker (si solo cambia código fuente, no se reinstalan deps).

### Build muy lento en re-builds

**Causa**: cambios en `package.json` o `prisma/schema.prisma` invalidan el layer de `npm install`.

**Mitigación**: solo modificá esos archivos cuando hace falta. Para iterar sobre código fuente solo, el cache de Docker te salva los ~3 minutos del install.

---

## Prisma

### Error de tipos: `Property 'X' does not exist on type WorkOrder/Magazine/...`

**Causa típica**: cambió `prisma/schema.prisma` pero el cliente generado en `node_modules/@prisma/client` está desactualizado.

**Fix**:

```bash
npx prisma generate
```

**Prevención**: el `package.json` tiene `"postinstall": "prisma generate"`, así que cualquier `npm install` lo corre solo. Si te pasa, es porque alguien tocó el schema sin reinstalar deps o porque hiciste `git pull` sin `npm install`.

### `Buffer<ArrayBufferLike>` no es asignable a `BodyInit`

```
Type error: Argument of type 'Buffer<ArrayBufferLike>' is not assignable to parameter of type 'BodyInit | null | undefined'.
```

**Causa**: con `@types/node` reciente, `Buffer` se tipa como `Buffer<ArrayBufferLike>` (genérico) y deja de satisfacer `BodyInit` directamente.

**Fix**: envolver el buffer en `new Uint8Array(buffer)` antes de pasarlo a `NextResponse`. Buffer es subclase de Uint8Array, runtime-safe. Ejemplo aplicado en `src/app/api/magazines/export/route.ts`.

---

## NextAuth y login

### Login redirige mal después de cambiar el puerto o IP

**Síntoma**: entrás, ponés usuario y password, y o te tira error o te queda en loop.

**Causa**: `NEXTAUTH_URL` en `.env` no coincide con la URL real por la que entrás (puerto distinto, http vs https, IP cambiada).

**Fix**: editá `.env` y poné el valor correcto, después:

```bash
docker compose up -d app
```

Tiene que ser **exactamente** la URL pública por la que entran los usuarios, con esquema y puerto incluidos: `http://192.168.1.10:8080`.

### `useSearchParams() should be wrapped in a suspense boundary`

```
Error occurred prerendering page "/login"
useSearchParams() should be wrapped in a suspense boundary at page "/login"
```

**Causa**: en Next 15, cualquier componente client que use `useSearchParams()` necesita un `<Suspense>` arriba durante el prerender estático.

**Fix**: ya aplicado en `src/app/login/page.tsx`. Si reaparece en otra página, hacé:

```tsx
"use client";
import { Suspense, useState } from "react";

export default function MyPage() {
  return (
    <Suspense fallback={null}>
      <MyPageInner />
    </Suspense>
  );
}

function MyPageInner() {
  const params = useSearchParams();
  // ...
}
```

### Las sesiones se invalidaron solas

**Causa**: cambiaste `NEXTAUTH_SECRET` en `.env`. Los JWT firmados con el secret viejo dejan de validar.

**Fix**: nada que hacer del lado del servidor. Los usuarios se vuelven a loguear y listo. Para evitarlo a futuro, cambialo solo cuando necesités revocar sesiones intencionalmente.

---

## Schema y migraciones

### `prisma db push --accept-data-loss` está borrando una tabla

**Causa**: agregaste un campo NOT NULL sin default a una tabla con datos. Postgres no puede backfillear, Prisma decide que necesita dropear y recrear, y `--accept-data-loss` se lo permite.

**Fix preventivo**: cuando agregues un campo obligatorio a una tabla con datos:

1. Hacelo nullable primero (`Int?` / `String?`).
2. Backfilleá los datos existentes con un script.
3. Cambialo a NOT NULL en una segunda migración.

**Si ya pasó**: restaurá desde el último backup ([Operación → restore](operacion.md#restore)).

### Quiero agregar un valor a un enum sin perder datos

**Caso real**: agregar `MANTENIMIENTO` y `PROGRAMACION` al enum `Role`.

Postgres soporta `ALTER TYPE ADD VALUE` que es no destructivo. Prisma `db push` lo aplica solo. Esto **no** borra datos. Verás en los logs algo como:

```
The migration has been applied successfully.
```

Sin warnings de data loss.

---

## GitHub Actions / CI

### El workflow falla con "Permission to repo denied"

**Causa**: el GitHub App de Claude (o lo que esté pusheando) no tiene permiso de escritura sobre el repo.

**Fix**: dueño del repo va a https://github.com/settings/installations → Configure el app → Repository access → agregar el repo → Permisos: Contents (read/write) y Pull requests (read/write).

### El workflow falla en `npm ci` con E403 sobre `xlsx`

**Causa**: `xlsx` se descarga de `cdn.sheetjs.com`, no de npm. Algunas redes corporativas o sandboxes bloquean ese host.

**Fix**: poner el host en la lista blanca del proxy/firewall, o bajar el `.tgz` a tiempo y servirlo localmente. En GitHub-hosted runners no debería pasar.

### `vite-tsconfig-paths` se queja de ESM en Windows

```
"vite-tsconfig-paths" resolved to an ESM file. ESM file cannot be loaded by `require`.
```

**Causa**: el plugin es ESM-only y vitest cargaba el config como CJS.

**Fix**: ya aplicado. Removimos `vite-tsconfig-paths` y configuramos el alias `@/` a mano con `path.resolve(process.cwd(), "./src")` en `vitest.config.ts`. Si querés que vuelva el plugin, hacelo solo en proyectos donde el config esté en `.mts`.

---

## Tests

### `npm test` falla porque no encuentra `@/lib/...`

**Causa**: el alias `@/` no se está resolviendo. Suele pasar en Windows o cuando `process.cwd()` no es la raíz del proyecto.

**Fix**: corré `npm test` desde la raíz del repo (donde está el `package.json`). El alias está configurado en `vitest.config.ts` apuntando a `process.cwd() + /src`.

### Los tests pasan pero el typecheck falla

**Causa**: los tests no chequean tipos profundos en runtime; `tsc --noEmit` sí.

**Fix**:

```bash
npm run typecheck
```

Si falla con errores tipo "Property X does not exist on type Y" referidos a Prisma, casi seguro es el cliente desactualizado: `npx prisma generate` y reintentá.

---

## General

### "El sistema funciona en mi máquina pero no en planta"

Cosas a chequear, en orden:

1. **`.env` distinto**: especialmente `NEXTAUTH_URL`, `DATABASE_URL`, puerto.
2. **Versión del código distinta**: `git log --oneline -5` en ambos lados.
3. **Hora del servidor**: si está mal, el cálculo de turnos (`defaultShiftForNow`) y los timestamps de paradas van a estar desfasados. `timedatectl` o `date`.
4. **Docker version**: comandos como `docker compose` (v2) son distintos a `docker-compose` (v1, deprecated). Asegurate de tener v2.
5. **Espacio en disco**: `df -h`. Si el volumen de Postgres se llenó, la app empieza a tirar errores raros al insertar.

### "Cambié algo y ahora no levanta"

Estrategia general:

```bash
docker compose logs --tail=200 app    # qué dijo la app antes de morir
docker compose logs --tail=200 db     # qué dijo la base antes de morir
docker compose ps                     # quién quedó vivo
docker compose down && docker compose up -d --build   # último recurso sin perder datos
```

Si después de eso sigue, restaurá desde backup ([Operación → restore](operacion.md#restore)).

### "Necesito ayuda y nadie me responde"

Buscá en este doc primero. Si tu error no está, agregá una sección al final con:

- **Síntoma** (qué viste)
- **Causa** (qué descubriste investigando)
- **Fix** (qué hiciste para resolverlo)

Así el próximo que se topa con lo mismo no pierde el día.
