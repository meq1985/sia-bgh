# Contribuir

Convenciones del repo: branches, commits, PRs y flujo de revisión.

## Antes de tocar nada

1. **Mirá si ya está en marcha**: revisá branches abiertas y PRs.
2. **Para cambios grandes**: abrí un issue primero, discutí el approach. Evita refactors abandonados a mitad de camino.
3. **Para cambios chicos** (typo, doc, micro-refactor): mandá PR directo.

## Branches

### Naming

```
<tipo>/<descripción-corta-en-kebab-case>
```

Tipos:

- `feat/` — nueva funcionalidad. Ej: `feat/cierre-formal-turno`.
- `fix/` — bug fix. Ej: `fix/magazine-capacity-validation`.
- `refactor/` — reorganización sin cambio de comportamiento. Ej: `refactor/extract-permissions`.
- `docs/` — solo documentación. Ej: `docs/guia-supervisor`.
- `chore/` — tareas de mantenimiento (deps, configs). Ej: `chore/update-prisma`.
- `test/` — solo agregar/refactorizar tests. Ej: `test/api-line-stops`.

### Reglas

- **Una branch = una intención**. No mezcles "agrego feature X" con "refactorizo Y" en la misma branch.
- **Salí de `main` actualizado**: `git checkout main && git pull && git checkout -b feat/...`.
- **Nombres descriptivos**: `feat/x-y-z` no `feat/changes`.

## Commits

### Formato

Seguimos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
<tipo>(<scope opcional>): <descripción imperativa>

<cuerpo opcional explicando el por qué>

<footer opcional con refs/breaking changes>
```

Ejemplos:

```
feat(paradas): intervinente al finalizar + form sin turno/código

Schema:
- LineStop.code pasa a nullable.
- Nuevos campos interventionRole + interventionUserId con relación
  StopInterventionBy en User.

Iniciar parada:
- Form ya no pide turno (se autocomputa server-side desde startedAt).
- Form ya no pide código de falla.
```

```
fix(docker): copiar prisma/ antes de npm install para que corra postinstall
```

```
docs: README + índice + glosario + guía de instalación
```

### Reglas

- **Imperativo en castellano**: "agrega", "fix", "corrige", "extrae". No "agregando", "agregué", "agregado".
- **Línea de subject ≤ 72 chars**.
- **El por qué va en el cuerpo**, no en el título.
- **Un commit = un cambio coherente**. Si tu commit dice "feat: X y arreglo Y", probablemente sean dos commits.
- **Nada de `WIP`** en main. Si hace falta, hacé squash antes de mergear.

### Tipos válidos

| Tipo | Cuándo |
|---|---|
| `feat` | Funcionalidad nueva visible para el usuario |
| `fix` | Bug fix |
| `refactor` | Cambio interno sin afectar comportamiento |
| `docs` | Solo documentación |
| `test` | Solo tests |
| `chore` | Build, deps, configs, tooling |
| `perf` | Mejora de performance |
| `style` | Formato, indentación (raro, lint debería atraparlo) |
| `build` | Cambios en sistema de build (Dockerfile, package.json scripts) |

### Scope

Opcional. Sirve para agrupar cuando el repo crece. Ejemplos: `paradas`, `magazines`, `auth`, `dashboard`, `db`, `docker`.

## Pull Requests

### Antes de abrir el PR

Localmente:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Si los 4 pasan, ya sabés que el CI no va a saltar por algo evitable.

### Título del PR

Mismo formato que un commit:

```
feat(dashboard): agregar gráfico de cumplimiento diario por línea
```

Si la branch tiene varios commits y vas a mergear con squash, el título termina siendo el subject del commit final — vale la pena que sea bueno.

### Descripción del PR

Plantilla mínima:

```markdown
## Qué cambia

Descripción breve de qué hace el PR.

## Por qué

El por qué del cambio. Issue / decisión que lo motiva.

## Cómo probarlo

1. Pasos para que el reviewer reproduzca.
2. Datos de seed que tiene que tener cargados.
3. Qué tiene que ver / qué tiene que NO ver.

## Notas

Decisiones que tomaste, alternativas que descartaste, deuda técnica que dejás explícita.
```

Si es un PR chico y obvio, podés saltear secciones. Si es grande, llenalas todas.

### Checks de CI

El workflow `.github/workflows/ci.yml` corre:

1. `npm ci`
2. `npx prisma generate` + `prisma validate`
3. `npm run typecheck`
4. `npm run lint`
5. `npm test`
6. `npm run build`

Todos en verde para mergear.

### Code review

- **Quien revisa**: el dueño del repo o un dev con familiaridad de la zona afectada.
- **Comentarios**: específicos. "Esta función podría romper si X" mejor que "esto está mal".
- **Iteración**: el autor responde por comentario o con un commit nuevo. No fuerce push (`--force`) post-review salvo que se acuerde.

## Merge

### Estrategia

- **Squash merge** por default. Una branch = un commit en main.
- **Merge commit** solo si la branch tiene varios commits que valen como historia separada (raro).
- **Rebase** evitado — complica el historial y la trazabilidad.

### Quién merguea

- **El autor**, una vez que tiene aprobaciones y CI verde.
- **Excepción**: PRs sin reviewer disponible y urgentes — el autor puede self-merge si pasó CI.

### Después del merge

- Borrá la branch remota: GitHub lo ofrece con un botón.
- Borrá la local: `git checkout main && git pull && git branch -d feat/...`.

## Cambios al schema de Prisma

Tema sensible — un cambio mal hecho borra datos. Reglas:

1. **Hablalo antes** si toca tablas con datos.
2. **NUNCA** hagas un campo NOT NULL sin default sobre tabla con datos en un solo paso. Ver [troubleshooting → schema](../deploy/troubleshooting.md#schema-y-migraciones).
3. **Backfill antes de NOT NULL**: hacelo nullable, escribí un script o hacé `UPDATE` manual, después cambialo.
4. **Renombrar campo**: hacé add + backfill + drop en commits separados.
5. **Mencionalo en el changelog**.

## Documentación

- **Cambios en código que afectan a usuarios**: actualizá la guía de usuario correspondiente en el mismo PR.
- **Cambios de infra (Docker, env)**: actualizá `deploy/`.
- **Bugs nuevos resueltos**: agregá entrada en `troubleshooting.md`.
- **Cualquier release**: actualizá `changelog.md`.

Si el PR no toca docs cuando debería, el reviewer lo va a pedir. Es más barato hacerlo en el momento.

## Versionado

Seguimos [SemVer](https://semver.org/lang/es/):

- `MAJOR`: cambios incompatibles (nadie usa la version vieja).
- `MINOR`: features nuevas compatibles.
- `PATCH`: bugs.

En este repo todavía no hay tags formales — estamos en `0.x` exploratoria. Cuando saquemos `1.0.0`, se etiqueta:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Cosas que NO hacemos

- **`git push --force` en `main`**: jamás.
- **`--no-verify` para skipear hooks**: si un hook falla, arreglá la causa.
- **`--no-edit` o `--amend` sobre commits ya pusheados**: rompe el historial de los demás.
- **Mergear con CI en rojo**: arreglá el CI primero.
- **Branches que viven semanas sin update**: rebase / merge con `main` cada par de días para evitar conflictos masivos.
- **Comentarios "TODO" sin issue**: o lo hacés ahora o creás el issue.

## Si encontrás un bug en producción

1. **Reproducilo localmente**.
2. **Escribí el test que lo reproduce** (Capa 2 si es lógica pura, Capa 3 si es API).
3. **Arreglalo**.
4. **Verificá que el test pasa**.
5. **PR con prefijo `fix/`**.
6. **Agregá la entrada en `troubleshooting.md`** si aplica.

Esto convierte un incidente en algo que no vuelve.
