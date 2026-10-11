# Prueba de usabilidad del Caso de Uso 2 (versión corta)

Dos archivos, una sesión de unos 40 minutos por persona, hasta 5 personas.

| Archivo | Para qué sirve |
|---|---|
| `Guia_Participante_CU2_ComproYa.docx` | Lo que se le entrega a cada persona: consentimiento, datos para usar y las tareas, con la escala de dificultad de 1 a 7 debajo de cada una. Unas 4 páginas, sin términos técnicos. |
| `Registro_Medicion_CU2_ComproYa.xlsx` | Donde se anota por persona y tarea: tiempo, clics, errores, ayudas, si lo logró o entendió, dificultad y lo que dijo. Calcula solo los resultados por caso y por tarea. La hoja «Cómo usar» explica cómo aplicar la sesión. |

## Alcance

Se aplican 8 casos del material de clase («7. Métricas externas de usabilidad»): 1, 3, 5, 7, 8, 9, 10 y 12. No se aplican el 2 (íconos y textos), el 4 (mensajes de error), el 6 (navegación) ni el 11 (retención, día 2). Es una decisión del equipo que conviene confirmar con el docente.

## Regenerar

```bash
cd e2e
npm run usabilidad:documentos   # guía y Excel (contenido en usabilidad/sesion.mjs; tiempos del equipo en usabilidad/linea-base.json)
npm run usabilidad:probar       # prueba las fórmulas del Excel con datos de ejemplo (requiere: npm install --no-save hyperformula)
npm run usabilidad:medir        # vuelve a medir los tiempos y clics del equipo en el portal local (necesita backend, frontend y stripe listen)
```

Los tiempos y clics del equipo se midieron ejecutando cada tarea en el portal real (modelo de nivel de pulsación de Card, Moran y Newell, 1980, más la espera medida del sistema); el tiempo objetivo es ese tiempo por 3 (factor editable en la hoja «Tareas»).
