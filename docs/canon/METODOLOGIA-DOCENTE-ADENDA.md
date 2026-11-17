# ADENDA a METODOLOGIA-DOCENTE.md — para el canon versión 2.0

**Cómo usar este archivo.** No tengo el `METODOLOGIA-DOCENTE.md` actual del proyecto de Claude (no está en el repositorio), así que **no pude actualizarlo**. Esto es una **adenda** para pegar al final de ese archivo, o para cargar como archivo aparte en el proyecto. Recoge solo lo que consta en el repositorio (las dos plantillas del docente y los documentos de pruebas y de usabilidad) y lo que el equipo dijo que el docente pidió. Cada regla trae su fuente; las que son una interpretación nuestra están marcadas para confirmarlas con el docente. Revísala contra tu archivo real y borra lo que ya esté.

## 1. Reglas de la EDT

Fuente: indicación del docente comunicada por el equipo el 2026-10-19 («máximo con 5 EDT o sin capítulos», en vertical) y feedback anterior recogido en el canon (sección 13).

- La EDT tiene **como máximo 5 entregables**. Interpretación del equipo: son los nodos de primer nivel bajo el proyecto. *Confirmar con el docente si «sin capítulos» significa otra cosa.*
- **Sin capítulos** se interpretó como **sin nivel intermedio de sprint**: el sprint es una etiqueta de cada hoja (S1 a S6), no un nodo.
- Se dibuja **en vertical**: el proyecto arriba, los entregables en una fila y las hojas apiladas debajo de cada uno. No en horizontal.
- Estructura: proyecto → entregable → hoja (caso de uso o paquete de trabajo). La hoja **no lleva descripción** en el diagrama; el detalle va en el **diccionario de la EDT** (una fila por hoja: trabajo incluido, fuera de límites, estimación o supuestos, verificación y aceptación).
- Debe contener sprints y casos de uso (la Parte 1 de la planificación se rechazó por «EDT sin sprints ni casos de uso»): por eso el sprint sigue visible como etiqueta y cada hoja lleva su caso de uso o paquete.
- Si cambian los códigos de la EDT, la tabla de equivalencias con los códigos anteriores va en el diccionario o en el canon.

## 2. Plantilla 4 — Plan de gestión del alcance

Fuente: «4. PLANTILLA DE GESTION DE ALCANCE.docx» (marco PMBOK, SWEBOK y Scrum).

- Se llenan **todas** las celdas de las tablas; no puede quedar ningún texto entre corchetes, y las casillas se marcan (☒).
- Secciones, con la numeración exacta de la plantilla (saltan el 9, el 12 y el 14): Identificación del proyecto; 2 Datos generales y gobernanza; 3 Visión y objetivos de alcance; 4 Alcance del producto y del proyecto, 4.1 Exclusiones explícitas, 4.2 Supuestos y restricciones; 5 Interesados; 6 Elicitación, 6.1 Catálogo de requisitos, 6.2 Requisitos no funcionales; 7 EDT y su diccionario; 8 Product Backlog, 8.1 estructura, 8.2 criterios de aceptación; 10 Validación y aceptación, 10.1 Matriz de trazabilidad; 11 Control del alcance, 11.1 Registro de cambios; 13 Documentos, herramientas y registros; 15 Lista de comprobación.
- Identificadores que la plantilla prescribe: REQ-nnn, RNF-nnn, PB-nnn, CA-nn, CHG-nnn, OBJ-nn y los de prueba. Se usan solo en este documento y en el de la plantilla 5 (canon, sección 12).
- El patrocinador y quien acepta formalmente es la Dirección de ComproYa, no el docente.

## 3. Plantilla 5 — Declaración de alcance

Fuente: «5. PLANTILLA DE DECLARACION DE ALCANCE.docx».

- Secciones: Control del documento; 1 Resumen ejecutivo; 2 Necesidad, justificación y objetivos (un problema, una justificación, un objetivo general y cuatro específicos); 3 Visión y objetivo del producto; 4 Alcance del producto, 4.1 entregables (E-nn), 4.2 exclusiones, 4.3 supuestos, restricciones y dependencias, 4.4 interesados; 5 Requisitos iniciales; 6 Entregables y descomposición de alto nivel; 7 Gobernanza y gestión de cambios; Anexo 1 Product Backlog y criterios de aceptación; Anexo 2 Matriz de trazabilidad; Anexo 3 Métricas; Anexo 4 Registro de aceptación; Anexo 5 Lista de comprobación.
- **Los anexos 3 y 4 no se diligencian** («queda como referencia», lo dice la propia plantilla): se dejan tal cual.
- La sección 6 lleva el mismo diagrama de la EDT que el plan de la plantilla 4.
- Se agrega una **definición de terminado** del Incremento en la sección 7, porque el Anexo 5 la pregunta.

## 4. Reglas de contenido comunes a los dos documentos

- Lo construido se dice construido y lo pendiente se dice pendiente. Nada de cifras inventadas: toda cifra de pruebas o de mediciones sale de una ejecución real, y lo que no se ha medido se escribe «sin medir».
- El ERP es una interfaz simulada y el POS no se conecta al canal; los dos se dicen así en cada sección donde aparecen.
- Los cambios de alcance se registran como CHG-nnn en la sección de cambios, con su impacto y su estado.
- Los roles de Scrum (Product Owner y Scrum Master) son una propuesta mientras no se confirmen (canon, D-03).

## 5. Pruebas de software

Fuente: `Plan_Pruebas_ComproYa` y `Resultados_Pruebas_ComproYa` (basados en «6. PRUEBAS DE SOFTWARE.pdf» del docente).

- Distribución pedida en clase el 2026-09-22: **10 pruebas de ruta** (diagrama de actividad), **10 basadas en estado** (diagrama de estados, por entidad), **mínimo 3 de integración** (diagrama de clases) y **3 de sistema** (caso de uso). El equipo entregó 10 / 10 / 5 / 3 = 28.
- El caso de prueba sigue el formato del Anexo 1 del PDF del docente: información global, tabla de datos de entrada (campo, valor, tipo de escenario, respuesta esperada, coincide, respuesta del sistema) y probador con firma.
- Las pruebas del servidor corren contra una base de datos real y separada, nunca contra la de desarrollo ni con simulaciones en memoria.

## 6. Evaluación de usabilidad

Fuente: «7. Métricas externas de usabilidad» (ISO/IEC 9126-2) y `docs/usabilidad`.

- El material pide aplicar los casos de prueba 1 a 12 (tres tareas por caso), con video, medición de tiempos y clics, y pensamiento en voz alta (Think Aloud), y reportar **media y error estándar**.
- Decisión del equipo (pendiente de confirmar con el docente): 5 participantes; se aplican **8 casos** (1, 3, 5, 7, 8, 9, 10 y 12) y no se aplican el 2 (íconos y textos), el 4 (mensajes de error), el 6 (navegación) ni el 11 (retención, día 2).
- Un caso se cumple si al menos el 80 % de los participantes lo cumple; el tiempo objetivo es 3 veces el tiempo medido por el equipo; la dificultad se pregunta con una escala de 1 a 7.

## 7. Puntos para agregar a la lista de verificación

- [ ] La EDT tiene como máximo 5 entregables, está en vertical, no tiene nivel de sprint y la hoja no lleva descripción.
- [ ] Cada hoja de la EDT aparece en el diccionario y en la matriz de trazabilidad; los códigos nuevos traen su equivalencia con los anteriores.
- [ ] El patrocinador es la Dirección de ComproYa; el docente no figura como patrocinador, aprobador ni interesado.
- [ ] El ERP aparece como interfaz simulada y el POS como no conectado, sin excepción.
- [ ] Ninguna celda de las plantillas 4 y 5 queda entre corchetes; los anexos 3 y 4 de la plantilla 5 quedan sin diligenciar.
- [ ] Todo requisito, historia y criterio tiene una evidencia real o dice «pendiente» o «sin medir».
- [ ] Los identificadores OBJ, REQ, RNF, PB, CA, CHG y E aparecen solo en los dos documentos de alcance.
- [ ] Cada cambio de alcance está registrado como CHG con fecha, impacto y estado.
