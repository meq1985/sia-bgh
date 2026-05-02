# Guía del Administrador

El admin es el dueño del sistema. Puede hacer todo lo que hacen los demás roles **más** gestionar usuarios, catálogos, dashboard y operaciones de "tira y afloja" cuando algo se rompe.

> Esta guía cubre lo específico del rol admin. Para operaciones técnicas (deploy, backup, restore) andá a [deploy/operacion.md](../deploy/operacion.md).

## Tabla de contenidos

- [Qué ves al entrar](#qué-ves-al-entrar)
- [Gestión de usuarios](#gestión-de-usuarios)
- [Gestión de estaciones](#gestión-de-estaciones)
- [Gestión de fallas comunes](#gestión-de-fallas-comunes)
- [Dashboard](#dashboard)
- [Acciones de override que solo vos podés hacer](#acciones-de-override-que-solo-vos-podés-hacer)
- [Buenas prácticas](#buenas-prácticas)
- [Errores frecuentes](#errores-frecuentes)

## Qué ves al entrar

El header te muestra:

- **Magazines** — listado y carga.
- **Work Orders** — listado completo, creación, cierre, borrado.
- **Defectuosas** — listado y carga.
- **Paradas** — listado completo, validación de cualquier parada (override).
- **Dashboard** — métricas de producción y FPY por línea/WO.
- **Usuarios** — `/admin/users`.
- **Estaciones** — `/admin/stations`.
- **Fallas** — `/admin/failures`.

`[captura: header del administrador]`

## Gestión de usuarios

### Crear un usuario

1. Andá a **Usuarios** → **Nuevo usuario**.
2. Completá:
   - **Usuario**: 3–32 caracteres alfanuméricos, punto, guion o guion bajo.
   - **Nombre completo**: lo que aparece en el header del usuario y en columnas de auditoría.
   - **Contraseña inicial**: mínimo 6 caracteres. El usuario debería cambiarla en el primer login (no hay flujo automático para forzarlo todavía — pedíselo a mano).
   - **Rol**: ver [Glosario → Roles](../glosario.md#roles-y-permisos).
3. **Crear usuario**.

`[captura: form de nuevo usuario]`

### Cambiar el rol de un usuario

En la fila del usuario, el desplegable de rol está siempre disponible. Cambiala y queda guardado al toque.

> No podés degradar tu propio rol. Si sos el único admin y querés bajar de admin, primero promové a otro a admin.

### Activar / desactivar un usuario

Desactivar es la forma "soft" de quitar acceso sin perder el historial. El usuario no se borra, solo no puede loguearse y desaparece de los desplegables (intervinentes, etc.).

> No podés desactivar tu propio usuario.

### Resetear la contraseña

Click en **Reset pass** en la fila → te pide la nueva contraseña.

> Mínimo 6 caracteres. La contraseña anterior se pierde, no hay forma de recuperarla.

### Recuperar acceso si te quedaste afuera

Si **vos** sos el admin que perdió acceso, ya no podés hacerlo desde la UI. Mirá [deploy/operacion.md → Recuperar acceso](../deploy/operacion.md#recuperar-acceso-si-te-quedaste-afuera).

## Gestión de estaciones

Las estaciones son los puestos físicos dentro de una línea. SIA viene con las 16 típicas seedeadas, pero la planta puede agregar/quitar según necesidad.

### Agregar estación

1. **Estaciones** → form **"Nueva estación"** arriba.
2. Escribí el nombre (ej. `cm602-4`, `npm-2`). Tiene que ser único en todo el sistema.
3. **Agregar**.

### Renombrar / desactivar / borrar

En la fila:

- **Renombrar**: prompt simple. Cuidado, el nombre es lo que se ve en formularios.
- **Desactivar / Activar**: una estación desactivada no aparece en los desplegables al cargar paradas. El histórico se mantiene.
- **Borrar**: solo si tiene **0 paradas** asociadas. Si fue usada alguna vez, no se puede borrar — desactivala.

`[captura: tabla de estaciones con conteos]`

> **Recomendación**: nunca borres. Desactivá y listo. Te cubre si alguien hizo histórico contra esa estación y querés re-habilitarla más adelante.

## Gestión de fallas comunes

Cada estación tiene su propio listado de fallas catalogadas. Esa es la lista que ven los operadores en el desplegable cuando inician una parada.

### Agregar falla

1. **Fallas** → form arriba.
2. **Estación**: a qué estación corresponde la falla.
3. **Falla**: descripción (ej. `Squeegee desgastado`). Tiene que ser única para esa estación (la misma falla puede repetirse en distintas estaciones).
4. **Agregar**.

### Filtrar / renombrar / desactivar / borrar

- **Filtro por estación**: si tenés muchas fallas, filtrá por estación.
- **Renombrar / desactivar / borrar**: misma lógica que estaciones — borrar solo si nunca se usó.

`[captura: tabla de fallas filtrada por estación]`

### Estrategia de catálogo

- **Empezá con pocas**: las que la planta ya conoce. SIA viene con 3-5 por estación.
- **Agregá nuevas cuando aparezcan**: si los operadores empiezan a usar mucho la "otra falla" texto libre con la misma frase, agregala al catálogo.
- **Desactivá las obsoletas**: cuando un equipo deja de existir o una falla se elimina por upgrade, desactivala. No la borres si tiene historial.

## Dashboard

`/admin/dashboard` te da las métricas de producción en tiempo real.

Charts disponibles:

1. **Avance de orden por línea** — % producido vs total objetivo, sumando WOs abiertas de cada línea.
2. **Producción de hoy por línea** — placas registradas y defectuosas reportadas en el día.
3. **FPY por WO activa, agrupado por línea** — calidad por WO con código de color (verde ≥90%, azul ≥60%, naranja ≥30%, rojo <30%).
4. **Cumplimiento del objetivo diario por línea** — target diario vs producido + % de cumplimiento.

Al final, una tabla **"WOs abiertas — detalle"** con FPY individual, target diario, defectivos y avance %.

`[captura: dashboard completo]`

Los charts no se actualizan en tiempo real — tenés que refrescar la página para ver datos nuevos. Tenelo en cuenta si lo proyectás en una pantalla.

## Acciones de override que solo vos podés hacer

### Borrar magazines, defectivos o paradas

Cualquiera de los tres se borra desde su listado, columna acciones, botón **Borrar**. Pedí confirmación al usuario antes de hacerlo — el dato se pierde para siempre.

### Validar o rechazar cualquier parada

Como ADMIN tenés override sobre la regla "solo el intervinente puede validar". Útil cuando:

- El intervinente designado se fue del turno y no validó.
- El intervinente designado está mal y nadie lo corrigió.
- Hay paradas legacy sin intervinente (de antes del feature de intervinentes).

Usá esta capacidad con criterio — auditoría va a ver tu firma como validador.

### Cerrar y reabrir WOs

- **Cerrar**: lo puede hacer un supervisor también.
- **Reabrir**: hoy no hay UI. Si necesitás reabrir, hacelo desde Postgres directo:
  ```sql
  UPDATE work_orders SET status = 'OPEN', "closedAt" = NULL, "closedById" = NULL WHERE "woNumber" = 'WO-2026-XXXX';
  ```

### Cambiar el intervinente de una parada

Hoy no hay UI. Vía Postgres directo:

```sql
UPDATE line_stops
SET "interventionUserId" = '<id-del-usuario>', "interventionRole" = 'MANTENIMIENTO'
WHERE id = '<id-de-la-parada>';
```

Si vas a hacer esto seguido, decímelo y agregamos un endpoint.

## Buenas prácticas

- **Backups antes de operaciones grandes**: cualquier cambio que toque > 1 fila, hacé backup primero. Ver [Operación → backups](../deploy/operacion.md#backups).
- **No abuses del override de validación**: si validás todas las paradas vos, perdés la información de quién intervino. Solo cuando es realmente necesario.
- **Mantené el catálogo limpio**: estaciones y fallas duplicadas o tipeadas distinto ensucian el dashboard. Si ves una falla "Stensil sucio" y otra "Stencil sucio", desactivá la mal escrita y reasigná a mano.
- **Documentá decisiones raras**: si reabriste una WO o cambiaste un intervinente vía SQL, anotalo en algún lado (changelog interno, ticket, etc.).
- **Roteá la contraseña del admin**: cada N meses. Especialmente si la conoce mucha gente.

## Errores frecuentes

**"No podés desactivar tu propio usuario"**
Por seguridad, no permitido. Si necesitás cerrar tu cuenta admin, primero creá otro admin y pedile que te desactive.

**"No podés degradar tu propio rol"**
Mismo principio. Si sos el único admin y querés dejar de serlo, primero promové a otro.

**"No se puede borrar: hay X paradas que la usan"**
La estación o falla tiene historial. Desactivala — los registros viejos se mantienen pero no aparece más en formularios.

**"Esa falla ya existe para esa estación"**
El par `(stationId, label)` es único. Buscá en el listado, probablemente está duplicado por una variación de mayúsculas/espacios.

**El dashboard muestra datos viejos**
Los datos se cargan en cada navegación, no hay polling automático. Refrescá la página (F5) para ver lo más nuevo.

**Las fallas que agregué no aparecen en el desplegable del operador**
Verificá que están **activas** y asociadas a la estación correcta. Si están bien, pediles a los operadores que recarguen la pestaña Paradas (los datos se traen al cargar la página).
