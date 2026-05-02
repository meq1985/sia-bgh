# Documentación SIA

Acá vive todo lo que necesitás para usar, operar y mantener SIA. Está organizada por audiencia. Si llegaste sin saber qué leer, mirá la tabla de abajo.

## Por dónde empezar según tu rol

| Sos... | Andá a |
|---|---|
| Operador en línea | [usuario/operador.md](usuario/operador.md) |
| Supervisor de turno | [usuario/supervisor.md](usuario/supervisor.md) |
| Mantenimiento o Programación | [usuario/mantenimiento-programacion.md](usuario/mantenimiento-programacion.md) |
| Administrador del sistema | [usuario/administrador.md](usuario/administrador.md) |
| IT de planta (deploy/operación) | [deploy/instalacion.md](deploy/instalacion.md) → [deploy/operacion.md](deploy/operacion.md) |
| Desarrollador | [desarrollo/setup-local.md](desarrollo/setup-local.md) |

## Mapa completo

### Conceptos

- [glosario.md](glosario.md) — términos del dominio (WO, magazine, parada, FPY, etc.). Lectura obligatoria si recién entrás al proyecto.

### Despliegue y operación

- [deploy/instalacion.md](deploy/instalacion.md) — primer arranque desde cero, configuración del `.env`, cambio de puerto, primer login.
- [deploy/operacion.md](deploy/operacion.md) — backup, restore, logs, reinicios, recuperación si te quedaste afuera, gestión del entrypoint.
- [deploy/troubleshooting.md](deploy/troubleshooting.md) — errores conocidos del build de Docker, Prisma, NextAuth y CI con su fix.

### Usuario final

- [usuario/operador.md](usuario/operador.md) — cargar magazines, iniciar y finalizar paradas, cargar defectivos.
- [usuario/supervisor.md](usuario/supervisor.md) — crear y cerrar Work Orders, validar paradas, auditar producción.
- [usuario/mantenimiento-programacion.md](usuario/mantenimiento-programacion.md) — intervenir y validar paradas técnicas / de programa.
- [usuario/administrador.md](usuario/administrador.md) — usuarios, catálogos (estaciones, fallas), dashboard, overrides.

### Desarrollo

- [desarrollo/setup-local.md](desarrollo/setup-local.md) — clonar, instalar, levantar Postgres local, dev server, comandos útiles.
- [desarrollo/arquitectura.md](desarrollo/arquitectura.md) — stack, capas, flujos de auth y RBAC, decisiones de diseño.
- [desarrollo/modelo-datos.md](desarrollo/modelo-datos.md) — cada modelo Prisma con su propósito de negocio, índices, reglas de borrado.
- [desarrollo/testing.md](desarrollo/testing.md) — capas de testing, qué se testea hoy, qué viene, cómo agregar tests.
- [desarrollo/contribuir.md](desarrollo/contribuir.md) — branches, commits convencionales, PRs, code review, merge.

### Cambios

- [changelog.md](changelog.md) — historial de versiones.

## Convenciones de la documentación

- **Voseo argentino**: "iniciá", "cargá", "vos hacés".
- **Comandos**: copiables tal cual, asumen que estás parado en la raíz del repo.
- **Capturas**: marcadas como `[captura: ...]`. Cuando levantes la app, reemplazalas por imágenes reales.
- **Diagramas**: en Mermaid (texto), GitHub los renderiza automáticamente.
- **Versionado**: cada doc se actualiza en el mismo commit que cambia el código que documenta. Si encontrás un doc desactualizado, es un bug — abrí PR.
