# Documentación SIA

Acá vive todo lo que necesitás para usar, operar y mantener SIA. Está organizada por audiencia. Si llegaste sin saber qué leer, mirá la tabla de abajo.

## Por dónde empezar según tu rol

| Sos... | Andá a |
|---|---|
| Operador en línea | [usuario/operador.md](usuario/operador.md) *(próximamente)* |
| Supervisor de turno | [usuario/supervisor.md](usuario/supervisor.md) *(próximamente)* |
| Mantenimiento o Programación | [usuario/mantenimiento-programacion.md](usuario/mantenimiento-programacion.md) *(próximamente)* |
| Administrador del sistema | [usuario/administrador.md](usuario/administrador.md) *(próximamente)* |
| IT de planta (deploy/operación) | [deploy/instalacion.md](deploy/instalacion.md) → [deploy/operacion.md](deploy/operacion.md) |
| Desarrollador | [desarrollo/setup-local.md](desarrollo/setup-local.md) *(próximamente)* |

## Mapa completo

### Conceptos

- [glosario.md](glosario.md) — términos del dominio (WO, magazine, parada, FPY, etc.). Lectura obligatoria si recién entrás al proyecto.

### Despliegue y operación

- [deploy/instalacion.md](deploy/instalacion.md) — primer arranque desde cero, configuración del `.env`, cambio de puerto, primer login.
- [deploy/operacion.md](deploy/operacion.md) — backup, restore, logs, reinicios, recuperación si te quedaste afuera, gestión del entrypoint.
- [deploy/troubleshooting.md](deploy/troubleshooting.md) — errores conocidos del build de Docker, Prisma, NextAuth y CI con su fix.

### Usuario final *(próximamente)*

- usuario/operador.md
- usuario/supervisor.md
- usuario/mantenimiento-programacion.md
- usuario/administrador.md

### Desarrollo *(próximamente)*

- desarrollo/setup-local.md
- desarrollo/arquitectura.md
- desarrollo/modelo-datos.md
- desarrollo/testing.md
- desarrollo/contribuir.md

### Cambios

- [changelog.md](changelog.md) — historial de versiones.

## Convenciones de la documentación

- **Voseo argentino**: "iniciá", "cargá", "vos hacés".
- **Comandos**: copiables tal cual, asumen que estás parado en la raíz del repo.
- **Capturas**: marcadas como `[captura: ...]`. Cuando levantes la app, reemplazalas por imágenes reales.
- **Diagramas**: en Mermaid (texto), GitHub los renderiza automáticamente.
- **Versionado**: cada doc se actualiza en el mismo commit que cambia el código que documenta. Si encontrás un doc desactualizado, es un bug — abrí PR.
