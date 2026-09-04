# ComproYa en Línea — contexto para Claude Code

Este archivo es lo primero que hay que leer antes de escribir código en este repositorio. Léelo completo antes de generar la primera línea, y vuelve a `docs/canon/CANON-ComproYa.md` cada vez que un caso de uso, actor, regla de negocio o cifra no esté claro — nunca lo inventes.

## Qué es este proyecto

ComproYa en Línea es el canal de comercio electrónico B2C de Tiendas ComproYa (cadena de retail ficticia), proyecto de curso de Ingeniería de Software II. Este repositorio es la implementación real del sistema descrito en el canon — no es el entregable académico en sí (ese vive aparte, en Word/PDF), pero el canon es la misma fuente de verdad para ambos.

## El canon manda — regla número uno

`docs/canon/CANON-ComproYa.md` es la fuente única de verdad. Antes de implementar cualquier caso de uso:

1. Usa los nombres de actores exactos del canon (sección 4). No inventes roles ni variantes.
2. Usa los identificadores tal como existen: `RN-01`..`RN-11` (reglas de negocio), `SP-01`..`SP-08` (sub-problemas), `C-01`..`C-16` (características), `CU-01`..`CU-17` (casos de uso), y los códigos de EDT (`1.1.1.1`, etc.).
3. Usa las cifras oficiales de la sección 10 tal cual — no las redondees ni inventes nuevas.
4. **Nunca** uses los identificadores retirados listados en la sección 12 del canon (HU-XX, CA-XX, RNF-XX, EP-XX, OBJ-XX, RD-XX, P-XX salvo el uso de `P-n` para mockups que sí está vigente, F-XX, S-XX, puntos de historia).
5. Evita el vocabulario prohibido de la sección 11 del canon (SKU, PSE, API, SaaS, checkout, cross-sell, stock, y adjetivos sin umbral como "rápido" o "escalable") tanto en comentarios de código como en nombres de variables cuando sea razonable, y siempre en documentación.
6. Si algo que se te pide contradice el canon o no existe en él (una pantalla, un actor, un caso de uso), dilo antes de escribir código — no lo resuelvas en silencio inventando algo plausible.

## Documentos de este repositorio, en el orden en que hay que leerlos

1. `docs/canon/CANON-ComproYa.md` — fuente de verdad del alcance, actores, reglas de negocio y casos de uso.
2. `docs/arquitectura.md` — decisiones de arquitectura: monolito modular, stack, módulos por sub-problema, sistemas externos simulados, procesamiento asíncrono.
3. `docs/plan-de-trabajo.md` — el plan de ejecución sprint por sprint (coincide con el calendario del canon, sección 9), con las tareas de backend y frontend de cada caso de uso.
4. `docs/mockups-plan.md` — qué mockup (`P-n`) corresponde a cada caso de uso, para usar con `/design` antes de implementar pantallas.
5. `docs/despliegue-gcp.md` — cómo está o debería estar desplegada la infraestructura en Google Cloud.

## Convenciones técnicas

- **Todo en TypeScript**, backend y frontend, modo `strict`.
- **Backend:** NestJS. Un módulo de Nest por sub-problema del canon (`catalogo`, `cuenta`, `carrito`, `pedido`, `pago`, `operacion` — ver `docs/arquitectura.md` sección 3). Un módulo no importa entidades de otro directamente, solo a través de un servicio de aplicación expuesto.
- **Persistencia:** Prisma sobre PostgreSQL. El esquema vive en `backend/prisma/schema.prisma`; cada cambio de esquema es una migración de Prisma, nunca un `ALTER TABLE` manual.
- **Sistemas externos** (ERP, programa de lealtad, operador logístico): se implementan como adaptadores detrás de una interfaz (`Puerto...`), nunca acoplados directamente a la lógica de negocio — así el día de mañana un adaptador real los reemplaza sin tocar el dominio. Ver `docs/arquitectura.md` sección 6.
- **Frontend:** Next.js (App Router). Las pantallas del Cliente digital y las de los roles internos (Coordinador de Canal Digital, Gerente de Tienda, Analista de Marketing) viven en el mismo proyecto, separadas por ruta y por rol autenticado.
- **Trazabilidad en el código:** cuando una función implementa una regla de negocio del canon, cita su ID en un comentario (`// RN-03: unidades ofrecidas = existencias ERP - umbral - reservas`). Esto no es opcional — es lo que permite defender el código frente al mismo criterio con el que se revisan los documentos de la asignatura (ver `docs/canon/CANON-ComproYa.md` y el historial de entregas en su sección 13: el docente penaliza fuerte cualquier cosa que no se pueda trazar a su origen).
- **Pruebas:** cada caso de uso implementado necesita al menos una prueba que verifique la regla de negocio asociada, no solo el camino feliz — en particular RN-01 a RN-11 son candidatas directas a casos de prueba unitarios.

## Orden de trabajo esperado

Sigue `docs/plan-de-trabajo.md` en su orden: Fase 0 (mockups + bootstrap de GCP) antes que cualquier sprint de producto, y los sprints 1 a 6 en el orden del canon — no adelantes un caso de uso de un sprint posterior solo porque parece más fácil o más interesante. El sprint 1 explícitamente no lleva autenticación (decisión D-01 del canon); no la introduzcas antes del sprint 2.

## Qué no construir

Todo lo que el canon declara fuera de alcance (sección 3): logística propia, campañas de mercadeo, tableros analíticos, catálogo de terceros, recomendación automática, devoluciones, facturación fiscal, y la aplicación de sala para asesores en tienda. Si una tarea parece requerir alguna de estas, es una señal de que se está desviando del canon — pregunta antes de construirla.

## Estado actual

`backend/prisma/` ya trae un script de siembra de catálogo funcional y probado (`seed.ts` + `lib/`), construido antes que el resto del repositorio — ver su propio `README.md`. El resto del backend y el frontend están por construir siguiendo `docs/plan-de-trabajo.md` desde la Fase 0.
