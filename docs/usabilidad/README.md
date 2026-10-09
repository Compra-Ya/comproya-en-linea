# Evaluación de usabilidad del Caso de Uso 2 (ISO/IEC 9126-2, sección 8.3)

Material para aplicar y documentar los casos de prueba de usabilidad del material de clase («7. Métricas externas de usabilidad»): **once de los doce casos**, porque el equipo decidió no aplicar el caso 2 (comprensión de iconografía y textos), y con **cinco participantes** (P01 a P05), tres tareas por caso, video, medición de la interacción y Think Aloud. El docente indicó un solo usuario para este primer sprint; el equipo decidió ampliar a cinco para calcular la media y el error estándar entre personas.

| Archivo | Para qué sirve | Quién lo usa |
|---|---|---|
| `Evaluacion_Usabilidad_CU2_ComproYa.docx` | **El documento que se entrega.** Método, línea base del equipo, los 11 casos aplicados con sus tablas (tarea, tiempo del equipo, tiempo objetivo, tiempo de cada persona, media y error estándar, clics, errores, ayudas), métricas del grupo, otras pruebas de usabilidad viables y anexos (consentimiento, guion, hoja de campo, protocolo de grabación, datos únicos por persona). Las celdas amarillas se llenan. | El equipo |
| `Guia_Participante_CU2_ComproYa.docx` | **Lo que se imprime y se le da a cada persona** (cinco copias): bienvenida, cómo pensar en voz alta, consentimiento, datos de prueba, una tarjeta por tarea (T01 a T27), SEQ y SUS. No trae pistas ni estados iniciales. | Los participantes |
| `Guia_Evaluador_CU2_ComproYa.docx` | **Guía rápida para quien aplica la sesión** (para imprimir): qué llevar, cómo recibir a la persona, qué mostrarle y entregarle en cada bloque, cómo cronometrar y cómo anotar (con un ejemplo), y qué hacer si algo sale mal. | El evaluador y el observador |
| `Registro_Medicion_CU2_ComproYa.xlsx` | Registro de las sesiones que **calcula solo**. Una hoja por persona (`P01` a `P05`) con las 24 tareas; `SUS` con una columna por persona; `Metricas` con el valor de cada caso por persona y del grupo; `Grupo` con la media y el error estándar por tarea y el resumen. | El observador |

## Cómo se decide si el grupo cumple un caso

Cada persona cumple o no el criterio del caso (proporción de sus tareas que cumplen). **El grupo cumple el caso si al menos el 80 % de las personas lo cumple**; es una decisión del equipo, editable en la hoja `Parametros`. Además se reportan la media y el error estándar del valor entre personas (n = 5), y para cada tarea operativa el tiempo medio con su error estándar y la razón con el tiempo del equipo.

## Orden de trabajo

1. Leer la sección 4 y el anexo G (lista de verificación previa) del documento. **Antes de las sesiones** el portal que se pruebe debe tener backend y frontend desplegados juntos, el catálogo con fotos y precios en pesos, el cupón `LEALTAD10` y el pago de prueba funcionando (`design/plan-ejecucion-bd-desplegada.md`); si no, se prueba en el entorno local.
2. Sesión 1 de cada persona (unos 49 minutos): entregar la guía, grabar pantalla y voz, y seguir los bloques 1 a 8 de la sección 5. Llenar la hoja de campo (anexo C, una por persona) o directamente su hoja del `.xlsx`.
3. Sesión 2 (al día siguiente, unos 12 minutos): bloque 9, retención.
4. Pasar los datos al `.xlsx`, copiar al documento los resultados por caso, y escribir hallazgos y conclusiones (secciones 11 y 12).

Cada persona usa su propio documento y correo (anexo F). Entre personas hay que cerrar la sesión, abrir una ventana nueva y cancelar los pedidos sin pagar.

## De dónde salen los tiempos y los clics del equipo

Los genera `e2e/usabilidad/medir-linea-base.mjs`: ejecuta la ruta ideal de cada tarea en el portal real (pasarela de Stripe en modo de prueba, con el webhook real), cuenta clics y teclas, y cronometra la espera del sistema. El tiempo de referencia usa el modelo de nivel de pulsación (Card et al., 1980) y el tiempo objetivo es esa referencia multiplicada por 3 (supuesto del equipo, editable en la hoja de cálculo). El resultado queda en `e2e/usabilidad/linea-base.json`.

## Regenerar los archivos

```bash
cd e2e
# 1) En otra terminal, con el backend y el frontend en marcha:
#    stripe listen --api-key <clave de prueba> --forward-to http://localhost:3001/api/pagos/webhook/stripe
npm run usabilidad:medir        # reescribe usabilidad/linea-base.json (crea cuentas y pedidos de prueba en la base local)
npm run usabilidad:documentos   # reescribe los tres archivos de docs/usabilidad/
npm run usabilidad:probar       # prueba las fórmulas del .xlsx con datos de ejemplo de 5 personas (requiere: npm install --no-save hyperformula)
```

`e2e/usabilidad/tareas.mjs` es la fuente única del contenido (casos, tareas, rúbricas, participantes, referencias). Las tareas T04 a T06 (caso 2) se retiraron y sus números no se reutilizan, para conservar la trazabilidad con la línea base y con el material de clase.

## Límites que conviene decir en la entrega

- Participan **cinco personas**: el estándar recomienda al menos ocho. Los resultados son indicativos y no permiten generalizar.
- Los tiempos de referencia se midieron en el entorno local; en el portal desplegado la espera del sistema puede ser mayor.
- Los estados «Reservando tus unidades» y «Estamos confirmando tu pago» duran menos de un segundo en local; para observarlos hay que usar la red lenta del anexo E.
- Los datos de las personas los registra el equipo en cada sesión; ningún resultado de este paquete proviene de una simulación.
