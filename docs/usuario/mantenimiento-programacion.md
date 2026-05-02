# Guía de Mantenimiento y Programación

Estos dos roles cumplen la misma función dentro de SIA: **resolver paradas e intervenir en el cierre**. Lo único que cambia es el tipo de fallas que típicamente atienden.

- **Mantenimiento** — fallas técnicas: máquina, eléctricas, mecánicas, consumibles, mantenimiento preventivo o correctivo, servicio externo.
- **Programación** — ajustes de programa, lanzamientos de modelo nuevo.

## Tabla de contenidos

- [Qué ves al entrar](#qué-ves-al-entrar)
- [Cómo te enterás de las paradas](#cómo-te-enterás-de-las-paradas)
- [Aparecer como intervinente](#aparecer-como-intervinente)
- [Validar o rechazar paradas](#validar-o-rechazar-paradas)
- [Lo que NO podés hacer](#lo-que-no-podés-hacer)
- [Errores frecuentes](#errores-frecuentes)

## Qué ves al entrar

El header te muestra:

- **Paradas** — lo principal de tu rol.
- **Work Orders** — listado completo (sin permisos de creación ni cierre).

`[captura: header de mantenimiento/programación]`

No vas a ver Magazines ni Defectuosas — esas las maneja producción.

## Cómo te enterás de las paradas

Cuando un operador finaliza una parada y te elige como intervinente, la parada queda en tu cola de pendientes.

**Cómo encontrar tus paradas pendientes**:

1. Andá a **Paradas**.
2. En **Filtros**, poné **Estado: Pendiente**.
3. Mirá la columna **Resolvió** — ahí vas a ver tu nombre en las paradas que te tocan.

`[captura: listado de paradas con filtro Pendiente]`

> No hay notificación push hoy — tenés que entrar a ver. Conviene revisar la pestaña al menos una vez por turno.

## Aparecer como intervinente

Hay dos caminos:

### A — El operador te elige al finalizar

Lo normal: el operador termina la parada, abre el diálogo "Finalizar parada", elige tu rol y te selecciona del desplegable. Vos ves la parada en pendientes y la validás o rechazás.

### B — Vos finalizás la parada

Si estuviste resolviendo la falla y la línea ya volvió a producir, podés cerrarla vos mismo:

1. En **Paradas**, ubicá la parada en curso (filtro **Solo en curso**).
2. Apretá **Finalizar parada**.
3. En el diálogo, elegí tu rol (Mantenimiento o Programación) y a vos mismo como intervinente.
4. Confirmá.

`[captura: diálogo de finalizar parada con vos como intervinente]`

A partir de ahí, la parada queda pendiente de tu validación.

> Esto es útil cuando el operador está ocupado o ya se fue del turno y la línea volvió a producir hace rato. Mejor cerrarla bien que dejarla abierta.

## Validar o rechazar paradas

Solo podés validar/rechazar paradas en las que sos el intervinente designado. Si te equivocaron y aparece otra persona, no vas a ver los botones.

### Validar

Si la información cargada está bien (estación correcta, falla coherente, horarios razonables, comentario claro):

1. Apretá **Validar** en la fila.
2. La parada pasa a **Validada** con tu firma y la fecha.

### Rechazar

Si la carga tiene un problema:

1. Apretá **Rechazar**.
2. Escribí el motivo (obligatorio): qué está mal y qué se debería corregir.
3. Confirmá.

La parada queda en **Rechazada**. El operador la ve, la corrige, y vuelve a estar **Pendiente** para que vos la revisés de nuevo.

### Cuándo rechazar

- Estación incorrecta (no fue donde dijo el operador).
- Falla común mal seleccionada para esa estación (ej. "Stencil sucio" cargado contra el horno).
- Duración inverosímil (5 segundos para un cambio de stencil, 4 horas para un sensor).
- Comentario contradictorio con lo que pasó.

### Cuándo NO rechazar

- El operador se olvidó del comentario pero el resto está bien — pediselo y validá cuando lo agregue.
- Diferencias de pocos minutos en horarios — pueden editarse o ignorarse.
- Falla que ya se resolvió aunque la documentación sea pobre — agregá vos el comentario faltante y validá.

## Lo que NO podés hacer

| Acción | Quién la hace |
|---|---|
| Iniciar paradas en nombre de un operador | El operador o un admin |
| Validar paradas en las que no sos intervinente | El intervinente o un Admin |
| Crear o cerrar Work Orders | Supervisor o Admin |
| Cargar magazines o defectivos | Operador, Supervisor o Admin |
| Borrar paradas | Admin |
| Modificar el catálogo de fallas comunes | Admin |
| Ver el dashboard de producción | Admin |

## Errores frecuentes

**"Solo el usuario intervinente o un ADMIN pueden validar/rechazar esta parada"**
No te designaron al cerrarla. Si tendrías que ser vos (la falla la resolviste vos), pedile a un admin que cambie el intervinente.

**"No se puede validar una parada en curso. Finalizala primero."**
La parada todavía no se cerró. Andá a finalizarla vos mismo si la línea ya está produciendo.

**"La falla común no pertenece a esa estación"**
Pasa al editar una parada y cambiar la estación: la falla común que estaba seleccionada quedó incompatible. Elegí una falla del nuevo catálogo o usá texto libre.

**El operador me eligió pero no recuerdo haber estado**
Pedile al admin que cambie el intervinente. No validés algo que no hiciste — queda mal en auditoría.

**Estoy viendo paradas de varios turnos mezcladas**
Aplicá el filtro **Turno** o **Desde / Hasta** en los filtros para acotar.
