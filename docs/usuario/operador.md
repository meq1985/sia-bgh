# Guía del Operador

Lo que necesitás saber para trabajar con SIA durante tu turno.

## Tabla de contenidos

- [Qué ves al entrar](#qué-ves-al-entrar)
- [Cargar un magazine](#cargar-un-magazine)
- [Iniciar una parada de línea](#iniciar-una-parada-de-línea)
- [Finalizar una parada de línea](#finalizar-una-parada-de-línea)
- [Cargar defectivos al cierre de turno](#cargar-defectivos-al-cierre-de-turno)
- [Lo que NO podés hacer](#lo-que-no-podés-hacer)
- [Errores frecuentes](#errores-frecuentes)

## Qué ves al entrar

Al loguearte, el header te muestra tres pestañas:

- **Magazines** — donde cargás los magazines que terminaste.
- **Defectuosas** — donde reportás placas con defecto al cierre del turno.
- **Paradas** — donde iniciás y finalizás paradas de línea.

`[captura: header del operador con las tres pestañas]`

La sesión queda activa hasta que aprietes "Salir". No expira sola — pensado para cubrir un turno completo sin reloguearse.

## Cargar un magazine

Cada vez que cerrás un magazine en línea (lleno con placas), lo registrás acá.

### Pasos

1. Andá a **Magazines** → click en **Nuevo magazine**.
2. **Línea SMD**: elegí la línea donde estás trabajando. El sistema autocarga la primera, cambiala si es otra.
3. **Work Order**: el desplegable solo te muestra las WOs **abiertas** de esa línea. Si hay solo una, ya viene seleccionada. Si hay varias, elegí la que corresponde.
4. **Código de magazine**: el código físico del magazine (ej. `MG-001`).
5. **Turno**: viene precargado según la hora actual (Mañana 06:00–14:59, Tarde el resto). Cambialo si cargás algo del turno anterior.
6. **Placas**: cantidad real de placas en este magazine. No puede superar la capacidad de la WO (17, 25 o 50 según se configuró).
7. **Guardar magazine**.

`[captura: form de nuevo magazine]`

Volvés al listado y ves tu magazine en la primera fila. La columna **Acumulado WO** te muestra cuántas placas se llevan acumuladas en esa WO entre todos los magazines.

### Si no aparecen WOs

Si el desplegable está vacío o aparece "No hay WO abiertas para esta línea":

- O la WO ya se cerró → pedile al supervisor o admin que cree o reabra una.
- O elegiste la línea equivocada → cambiá la línea y volvé a mirar.

## Iniciar una parada de línea

Si la línea se detiene por cualquier motivo (falla, falta material, ajuste, etc.), registrá la parada **mientras está pasando**, no después.

### Pasos

1. Andá a **Paradas** → bajá hasta **Iniciar nueva parada**.
2. **Línea**: la tuya. Si la línea tiene una WO abierta, te avisa que se va a autovincular.
3. **Estación**: dónde ocurre la parada (ej. `printer`, `cm602-1`, `horno`).
4. **Falla común**: el desplegable te muestra solo las fallas catalogadas para esa estación. Elegí la que corresponda.
5. **Otra falla**: si la falla no está en el desplegable, escribila acá. Podés usar las dos: elegir una común y aclarar en el texto libre.
6. **Comentario**: opcional. Detalles, observaciones, lo que quieras dejar registrado.
7. **Iniciar parada**.

`[captura: form de iniciar parada]`

Apenas se crea, aparece en **Tus paradas activas** arriba de todo, con el horario de inicio. Mientras la línea esté detenida, la parada queda abierta.

### Si tenés varias paradas activas a la vez

Está permitido. Cada falla es una parada distinta. El sistema te muestra todas tus activas en una lista al inicio de la pestaña.

## Finalizar una parada de línea

Cuando la línea vuelve a producir, cerrá la parada.

### Pasos

1. En **Paradas**, ubicá la parada activa (en la lista de arriba o en la tabla con filtro **Solo en curso**).
2. Apretá **Finalizar parada**. Se abre un diálogo.
3. **Rol que intervino**: quién resolvió la falla. Las opciones son:
   - **Mantenimiento** — fallas técnicas de máquina, eléctricas, etc.
   - **Programación** — ajustes de programa, lanzamientos.
   - **Supervisor** — decisiones de turno, falta de material gestionada por supervisor.
   - **Administrador** — solo si lo resolvió un admin.
4. **Usuario intervinente**: el desplegable filtra los usuarios disponibles según el rol. Elegí el que efectivamente trabajó en la solución.
5. **Confirmar finalización**.

`[captura: dialog de finalizar parada con selectores de rol y usuario]`

Importante: **el usuario que elijas como intervinente es el único que puede después validar o rechazar la parada** (más cualquier admin como excepción). Si te equivocás de persona, pedile a un admin que la corrija.

### Por qué esto importa

Si elegís a alguien que no participó:

- Esa persona se va a encontrar con paradas que no recuerda.
- La trazabilidad de quién resolvió qué se ensucia.
- Puede que rechace la carga, te toque hacerla de nuevo y quedés mal con tu turno.

## Cargar defectivos al cierre de turno

Al final del turno, contás las placas con defecto y las registrás.

### Pasos

1. Andá a **Defectuosas**.
2. Completá el form:
   - **Fecha del reporte**: por default hoy.
   - **Turno**: precargado según la hora.
   - **Línea**: la tuya.
   - **Work Order**: la que estuvo activa en el turno.
   - **Cantidad defectuosa**: número total de placas defectuosas del turno (puede ser 0).
3. Confirmá.

`[captura: form de defectivos]`

> **Importante** sobre el modelo actual: hoy es un único contador. La planta distingue Validación / Reparación / Scrap como destinos distintos, pero **eso todavía no está implementado**. Cargá el total bruto en `defectiveQty` por ahora. Cuando se implemente el flujo nuevo te avisamos.

## Lo que NO podés hacer

| Acción | Quién la hace |
|---|---|
| Crear o cerrar Work Orders | Supervisor o Admin |
| Validar o rechazar paradas | El usuario marcado como intervinente al finalizarlas (Supervisor / Mantenimiento / Programación) o un Admin |
| Editar magazines de otros operadores | Supervisor o Admin |
| Borrar magazines, defectivos o paradas | Admin |
| Ver el dashboard de producción | Admin |
| Agregar/quitar estaciones o fallas comunes | Admin |

Si necesitás algo de esto, pedíselo a tu supervisor o al admin del sistema.

## Errores frecuentes

**"placasCount supera la capacidad del magazine"**
La WO tiene una capacidad fija (17, 25 o 50). No podés cargar más placas que eso en un solo magazine. Verificá la cantidad real o consultá con el supervisor.

**"La WO está cerrada"**
La WO se cerró y no se pueden cargar más magazines contra ella. Pedile al supervisor que reabra otra o cree una nueva.

**"La línea del magazine no coincide con la línea de la WO"**
Elegiste una línea distinta a la que tiene asignada la WO. Cambiá la línea o cambiá la WO.

**"No hay WO abiertas para esta línea"**
La línea no tiene ninguna WO abierta. El supervisor o admin tienen que crear una desde **Work Orders**.

**Te equivocaste y guardaste mal un magazine**
Pedile a tu supervisor que lo corrija (puede editarlo) o al admin que lo borre. Vos no tenés permisos de edición/borrado.

**Iniciaste una parada por error**
Si todavía no la finalizaste, lo más limpio es finalizarla con duración mínima y aclarar en el comentario que fue un error. Después un admin puede borrarla.
