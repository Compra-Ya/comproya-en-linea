# Evaluación de usabilidad del Caso de Uso 2 (ISO/IEC 9126-2, sección 8.3)

Material para aplicar y documentar los doce casos de prueba de usabilidad del material de clase («7. Métricas externas de usabilidad»), con un participante, tres tareas por caso, video, medición de la interacción y Think Aloud.

| Archivo | Para qué sirve | Quién lo usa |
|---|---|---|
| `Evaluacion_Usabilidad_CU2_ComproYa.docx` | **El documento que se entrega.** Método, línea base del equipo, 12 casos con sus tablas (tarea, tiempo del equipo, tiempo objetivo, tiempo del usuario, clics, errores, ayudas), métricas, comparación equipo–usuario, otras pruebas de usabilidad viables y anexos (consentimiento, guion, hoja de campo, protocolo de grabación). Las celdas amarillas se llenan. | El equipo |
| `Guia_Participante_CU2_ComproYa.docx` | **Lo que se imprime y se le da a la persona:** bienvenida, cómo pensar en voz alta, consentimiento, datos de prueba y una tarjeta por tarea (T01 a T27), más SEQ y SUS. No trae pistas ni estados iniciales. | El participante |
| `Registro_Medicion_CU2_ComproYa.xlsx` | Registro de la sesión que **calcula solo** el tiempo objetivo, la razón con el equipo, la eficiencia de clics, las métricas de los 12 casos, la media, el error estándar y el puntaje SUS. | El observador |

## Orden de trabajo

1. Leer la sección 4 y el anexo G (lista de verificación previa) del documento. **Antes de la sesión** el portal que se pruebe debe tener backend y frontend desplegados juntos, el catálogo con fotos y precios en pesos, el cupón `LEALTAD10` y el pago de prueba funcionando (`design/plan-ejecucion-bd-desplegada.md`); si no, se prueba en el entorno local.
2. Sesión 1 (unos 60 minutos): entregar la guía, grabar pantalla y voz, y seguir los bloques 1 a 8 de la sección 5. Llenar la hoja de campo (anexo C) o directamente el `.xlsx`.
3. Sesión 2 (al día siguiente, unos 15 minutos): bloque 9, retención.
4. Pasar los datos a las tablas del capítulo 6 del documento, tomar de la hoja de cálculo las métricas y la media con su error estándar, y escribir hallazgos y conclusiones (secciones 11 y 12).

## De dónde salen los tiempos y los clics del equipo

Los genera `e2e/usabilidad/medir-linea-base.mjs`: ejecuta la ruta ideal de cada tarea en el portal real (pasarela de Stripe en modo de prueba, con el webhook real), cuenta clics y teclas, y cronometra la espera del sistema. El tiempo de referencia usa el modelo de nivel de pulsación (Card et al., 1980) y el tiempo objetivo es esa referencia multiplicada por 3 (supuesto del equipo, editable en la hoja de cálculo). El resultado queda en `e2e/usabilidad/linea-base.json`.

## Regenerar los archivos

```bash
cd e2e
# 1) En otra terminal, con el backend y el frontend en marcha:
#    stripe listen --api-key <clave de prueba> --forward-to http://localhost:3001/api/pagos/webhook/stripe
npm run usabilidad:medir        # reescribe usabilidad/linea-base.json (crea cuentas y pedidos de prueba en la base local)
npm run usabilidad:documentos   # reescribe los tres archivos de docs/usabilidad/
npm run usabilidad:probar       # prueba las fórmulas del .xlsx con datos de ejemplo (requiere: npm install --no-save hyperformula)
```

`e2e/usabilidad/tareas.mjs` es la fuente única del contenido (casos, tareas, rúbricas, referencias). `inventario-controles.mjs` lista los controles reales de cada pantalla que se usan en el caso 2.

## Límites que conviene decir en la entrega

- Participa **un solo usuario**: el estándar recomienda al menos ocho. La media y el error estándar se calculan sobre las tres tareas de cada caso y no permiten generalizar.
- Los tiempos de referencia se midieron en el entorno local; en el portal desplegado la espera del sistema puede ser mayor.
- Los estados «Reservando tus unidades» y «Estamos confirmando tu pago» duran menos de un segundo en local; para observarlos hay que usar la red lenta del anexo E.
