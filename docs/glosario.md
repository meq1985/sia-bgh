# Glosario

Vocabulario común usado en SIA y referenciado por el resto de la documentación. Si en otro doc ves un término en **negrita** que no entendés, está acá.

## Producción

### Línea SMD
Línea de inserción automática de componentes (Surface-Mount Device). En BGH están **SMD1** a **SMD8**. Cada línea es una secuencia ordenada de **estaciones** físicas. Modelo Prisma: `SmdLine`.

### Estación
Cada máquina o puesto físico dentro de una línea. Ejemplos: `loader`, `printer`, `spi`, `cm602-1`, `horno`, `unloader`. Es donde puede ocurrir una **parada**. El catálogo de estaciones se administra desde **/admin/stations**. Modelo: `Station`.

### Work Order (WO)
Orden de trabajo. Define qué producto se va a fabricar, en qué cantidad, en qué línea y con qué capacidad de magazine. Tiene un `dailyTargetQty` (cantidad diaria estimada) y un `totalQty` (objetivo total). Mientras está abierta (`OPEN`) se pueden cargar magazines contra ella; al cerrarse (`CLOSED`) se congela. Modelo: `WorkOrder`.

### Magazine
Bandeja física que se carga con N **placas** producidas. Cuando se cierra y sale de la línea, se registra como un **Magazine** con su `placasCount`, código de magazine, turno, autor y WO asociada. La capacidad teórica del magazine (17 / 25 / 50 placas) se define en la WO. Modelo: `Magazine`.

### Producción Conforme
Suma de `placasCount` de todos los magazines registrados contra una WO. Es la métrica de "cuánto se produjo bien".

### Acumulado WO
En el listado de magazines, suma progresiva de placas dentro de la misma WO en orden cronológico. Útil para ver el avance acumulado WO por WO.

## Defectos *(modelo actual; en evolución)*

### Defectivo (DefectiveReport)
Reporte que se carga al cierre de turno indicando cuántas placas salieron con defecto en una línea + WO + turno. Hoy es un único contador `defectiveQty`. Modelo: `DefectiveReport`.

> **En evolución**: la planta distingue **Validación / Reparación / Scrap** como tres destinos. La conversación con QA está abierta para definir el modelo nuevo. Ver el changelog.

### FPY (First-Pass Yield)
Porcentaje de placas que pasaron bien la primera vez:

```
FPY = placas / (placas + defectivos brutos) * 100
```

Si las dos cantidades son 0, no hay dato (no se renderiza un %).

### Yield final *(planificado)*
Misma fórmula que FPY pero descontando placas recuperadas en reparación. Pendiente de implementar cuando aterrice el flujo de reparación.

## Turnos

### Turno (Shift)
Bloque horario de trabajo. Hay dos: **MORNING** (mañana) y **AFTERNOON** (tarde). El sistema autodetecta el turno desde el horario actual:

- `06:00..14:59` → MORNING
- todo el resto → AFTERNOON (cubre tarde + horas extra de noche)

La detección es solo una sugerencia; los formularios donde aplica permiten elegir manualmente.

> **Nota**: la planta usa horarios oficiales 06:00–15:00 y 15:00–23:36, con horas extra posibles. El cierre formal de turno con override (cuando se trabaja fuera de la ventana oficial) está pendiente de implementar.

## Paradas de línea

### Parada (LineStop)
Evento donde una línea deja de producir por algún motivo (falla técnica, falta de material, mantenimiento, etc.). Tiene **inicio** (`startedAt`), **fin** (`endedAt`) y se asocia a una **estación** y, si hay una WO abierta para esa línea, se autovincula. Modelo: `LineStop`.

### Falla común (CommonFailure)
Catálogo curado por estación. Cada estación tiene su lista de fallas típicas (ej. `printer` → "Stencil sucio", "Falta pasta"). Se administra desde **/admin/failures**. Modelo: `CommonFailure`.

### Falla libre (customFailure)
Texto que el operador escribe a mano cuando la falla no está en el catálogo. Convive con la falla común — se puede usar una, otra o ambas.

### Intervinente
Usuario que trabajó en resolver la parada. Se selecciona al **finalizar** la parada (rol + usuario filtrado por ese rol). Es el único habilitado para **validar** o **rechazar** la parada después (junto con cualquier ADMIN como override).

### Estados de parada
- **PENDING** — abierta o cerrada pero no validada todavía.
- **VALIDATED** — el intervinente (o un admin) confirmó que la parada está bien cargada.
- **REJECTED** — el intervinente (o un admin) rechazó la carga, con comentario obligatorio del motivo.

### Cola de paradas pendientes
Conjunto de paradas en estado `PENDING` con `endedAt != null`. Es lo que tiene que revisar y validar mantenimiento/programación.

### Categoría de código *(legado, no se usa hoy en el form)*
Los códigos 1–18 del formulario BSIA F.20 están agrupados en `OPERATOR` (1–12), `MAINTENANCE` (13–16) y `PROGRAMMER` (17–18). El campo `code` quedó nullable en DB para uso futuro, pero el form de iniciar parada ya no lo pide.

## Roles y permisos

### ADMIN
Puede todo: dashboard, gestión de usuarios, gestión de estaciones y fallas, crear/cerrar/borrar WOs, validar paradas como override. Es el único que puede borrar paradas y catálogos.

### SUPERVISOR
Crea y cierra WOs, valida o rechaza paradas (cuando es el intervinente designado), carga magazines y defectivos.

### OPERADOR
Carga magazines, carga defectivos, inicia paradas. **No** ve la pestaña de Work Orders ni puede validar paradas.

### MANTENIMIENTO
Interviene en paradas técnicas. Cuando se finaliza una parada y se lo elige como intervinente, queda habilitado para validarla o rechazarla.

### PROGRAMACION
Igual que mantenimiento, pero pensado para fallas de programa o lanzamientos (códigos 17–18 del formulario original).

> Detalle de qué pantallas ve cada rol: ver guías de usuario *(próximamente)*.

## Otros

### Cierre de turno *(planificado)*
Acción formal del supervisor que congela los datos del turno (magazines, defectivos, paradas) y los marca como auditados. Hoy no existe — todos los datos quedan editables hasta que el admin cierre la WO o invalide manualmente.

### Auto-vinculación con WO
Al iniciar una parada, si la línea elegida tiene **exactamente una** WO abierta, esa WO se asocia automáticamente al `LineStop`. Si hay 0 o más de 1, queda sin WO y se puede asignar manualmente después.

### Default shift
Función `defaultShiftForNow()` que devuelve el turno sugerido según la hora actual. Usada en formularios para precargar el campo. Ver [src/lib/shift.ts](../src/lib/shift.ts).
