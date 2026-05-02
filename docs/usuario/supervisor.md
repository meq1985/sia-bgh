# Guía del Supervisor

Tu rol agrega gestión de Work Orders y validación de paradas sobre lo que hace un operador.

> Si todavía no leíste la [guía del operador](operador.md), te recomiendo darle una pasada — varias acciones se hacen igual y no las repito acá.

## Tabla de contenidos

- [Qué ves al entrar](#qué-ves-al-entrar)
- [Crear una Work Order](#crear-una-work-order)
- [Cerrar una Work Order](#cerrar-una-work-order)
- [Validar o rechazar una parada](#validar-o-rechazar-una-parada)
- [Auditar lo que cargaron los operadores](#auditar-lo-que-cargaron-los-operadores)
- [Lo que NO podés hacer](#lo-que-no-podés-hacer)
- [Errores frecuentes](#errores-frecuentes)

## Qué ves al entrar

El header te muestra:

- **Magazines** — listado y carga (igual que un operador).
- **Work Orders** — listado completo, creación, cierre, borrado.
- **Defectuosas** — listado y carga.
- **Paradas** — listado completo, intervención cuando te designan, validación.

`[captura: header del supervisor]`

## Crear una Work Order

1. Andá a **Work Orders**.
2. Tenés un form arriba **"Nueva WO"**. Completá:
   - **Línea**: para qué línea es la WO. Después solo los magazines de esa línea van a poder asociarse.
   - **Número de WO**: lo que viene de planificación (ej. `WO-2026-0042`). Tiene que ser único en todo el sistema.
   - **Código de producto**: lo que se está fabricando (ej. `TKLE3214D`).
   - **Capacidad**: cuántas placas entran en cada magazine (17, 25 o 50). Una vez creada **no se puede cambiar**.
   - **Cantidad total de placas**: objetivo total de la WO.
   - **Cantidad diaria estimada**: target diario para el dashboard. Si dejás 0, no se reportan métricas de cumplimiento diario para esta WO.
3. **Crear WO**.

`[captura: form de nueva WO]`

La WO arranca en estado **Abierta**. Apenas existe, los operadores pueden cargar magazines y defectivos contra ella.

### Una línea, varias WOs abiertas

Está permitido. El operador, al cargar, va a ver todas las WOs abiertas de su línea y elegir la correcta. Para que la auto-vinculación de paradas funcione mejor, conviene tener **una sola WO abierta por línea** cuando sea posible.

## Cerrar una Work Order

Cuando se terminó la producción de la WO (o se decide pararla), cerrarla.

1. En el listado de Work Orders, ubicá la WO en estado **Abierta**.
2. Apretá **Cerrar WO** y confirmá.

Una vez cerrada:
- No se pueden cargar más magazines contra ella.
- No se pueden cargar más defectivos contra ella.
- Queda registrado quién la cerró y cuándo.
- No se puede reabrir desde la UI — si te equivocaste, pedile a un admin.

> **Antes de cerrar**, asegurate de que se cargaron todos los magazines del último turno y los defectivos del cierre. Una WO cerrada se vuelve solo-lectura.

## Validar o rechazar una parada

Solo podés validar/rechazar paradas en las que **te designaron como intervinente** al finalizarlas. Si la parada la cerró otro y eligió a otro intervinente, no vas a ver los botones.

### Validar

1. Andá a **Paradas**.
2. Filtrá por **Estado: Pendiente** y **Solo en curso: NO** (las que ya cerraron pero no se validaron).
3. En la columna **Resolvió** vas a ver tu nombre en las paradas que te toca revisar.
4. Si la carga es correcta, apretá **Validar**. La parada pasa a estado **Validada** con tu firma y la fecha.

### Rechazar

Si la carga está mal (estación equivocada, comentario falso, duración irreal, etc.):

1. Apretá **Rechazar**.
2. **Te va a pedir un comentario obligatorio** explicando por qué la rechazás.
3. Confirmá.

La parada queda en estado **Rechazada** con tu comentario. El operador la ve, la corrige, y vuelve a quedar pendiente de validar.

`[captura: tabla de paradas con botones validar y rechazar]`

### Cuándo rechazar

- Estación incorrecta (la falla no fue en esa máquina).
- Hora de fin claramente equivocada (ej. parada de 4 horas que duró 10 minutos).
- Comentario que contradice lo que pasó en el piso.
- WO asignada a una parada que ya estaba cerrada cuando ocurrió.

### Cuándo NO rechazar

- Diferencias menores de minutos en horarios — se puede editar.
- Falta el comentario pero está bien todo lo demás — pediselo al operador y validá cuando lo agregue.

## Auditar lo que cargaron los operadores

Tu rol también incluye revisar lo que se cargó en el turno. No tenés un panel específico, pero sí los listados.

### Listado de magazines

- Pestaña **Magazines** te muestra los últimos 200 con todos los filtros (línea, WO, turno, fecha, autor).
- Botones **Exportar XLSX / CSV** generan archivo descargable con los filtros aplicados.

### Listado de paradas

- Pestaña **Paradas** filtrable por estado, línea, estación, turno.
- Útil para revisar el turno: filtrá por **Estado: Pendiente** + tu turno → ahí están las que faltan validar.

### Defectivos

- Pestaña **Defectuosas** lista todos los reportes con el mismo set de filtros.

## Lo que NO podés hacer

| Acción | Quién la hace |
|---|---|
| Validar paradas en las que no sos intervinente | El intervinente designado o un Admin |
| Borrar magazines / defectivos / paradas | Admin |
| Reabrir una WO cerrada | Admin |
| Cambiar la capacidad de una WO ya creada | Nadie (es inmutable) |
| Crear o desactivar usuarios | Admin |
| Modificar el catálogo de estaciones o fallas | Admin |
| Ver el dashboard de producción | Admin |

## Errores frecuentes

**"Ya existe una WO con ese número"**
El campo `woNumber` es único. O ya cargaste esa WO antes (buscala en el listado), o es una WO que se borró y dejó el número ocupado (pedile al admin).

**"No se puede borrar: hay X magazines asociados"**
Solo podés borrar una WO si nunca se le cargó ningún magazine. Si tiene producción registrada, cerrala en lugar de borrarla.

**"No se puede validar una parada en curso. Finalizala primero."**
Solo se valida lo cerrado. Si la parada sigue activa, terminala primero (lo puede hacer cualquier usuario, no solo el creador).

**"Solo el usuario intervinente o un ADMIN pueden validar/rechazar esta parada"**
No te designaron como intervinente al cerrarla. Si tendrías que ser vos, pedile a un admin que cambie el intervinente.

**El operador cargó algo mal y ya validaste**
La parada queda como **Validada** con tu firma. Pedile al admin que la borre y se cree de nuevo, o que cambie el estado manualmente.
