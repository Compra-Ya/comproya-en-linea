// Genera docs/usabilidad/Guia_Evaluador_CU2_ComproYa.docx: guía corta (para imprimir) de cómo aplicar una sesión de usabilidad:
// qué llevar, cómo recibir a la persona, qué mostrarle y entregarle, cómo cronometrar y cómo anotar.
// El contenido de los bloques y de los estados iniciales sale de tareas.mjs; los tiempos y clics, de linea-base.json.
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AlignmentType, Document, Packer } from "docx";
import { COLOR, ESTILOS, H1, H2, H3, NUMERACIONES, P, PC, SALTO, VACIO, VERTICAL, VINETAS, NUMEROS, pie, tabla, ficha } from "./lib/doc.mjs";
import { BLOQUES, EQUIPO, PARTICIPANTES, TAREAS } from "./tareas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../docs/usabilidad");
mkdirSync(SALIDA, { recursive: true });
const LB = JSON.parse(readFileSync(path.join(AQUI, "linea-base.json"), "utf8"));
const tarea = (id) => TAREAS.find((t) => t.id === id);
const L = { alinear: AlignmentType.LEFT };
const minTotal = BLOQUES.filter((b) => b.n < 9).reduce((a, b) => a + b.min, 0);
const minDia2 = BLOQUES.find((b) => b.n === 9).min;

// Qué se le entrega y qué se anota en cada bloque (el estado inicial sale de tareas.mjs).
const ENTREGA = {
  1: ["Solo la tarjeta T01. Nadie toca el mouse hasta que responda.", "Si entendió (1 o 0) y una cita textual. Sin cronómetro."],
  2: ["Las tarjetas T19, T20 y T21, **una a la vez**.", "Tiempo (límite 180 s), clics, errores, ayudas y si lo logró. El carrito queda con lo que agregó y sirve para T02."],
  3: ["La tarjeta T02.", "Si entendió (1 o 0) y una cita. Al terminar, vacía el carrito."],
  4: ["La tarjeta T07 y la hoja «Datos de prueba».", "Tiempo, clics, errores, ayudas y consultas externas. Dentro de la compra haces dos preguntas (T03 al llegar a «Datos y envío»; T16 al pulsar «Pagar con tarjeta») y **pausas el cronómetro** mientras responde."],
  5: ["Las tarjetas T08 y T09, una a la vez.", "Igual que T07. Preguntas dentro: T17 al volver de la pasarela (en T08) y T18 al pulsar «Continuar al pago» (en T09)."],
  6: ["Las tarjetas T25, T26 y T27. Tú dejas el estado inicial de cada una antes de entregarla.", "Tiempo, clics, errores y ayudas."],
  7: ["Las tarjetas T13, T14 y T15.", "Si llegó al inicio sin desvíos (sí o no) y los clics."],
  8: ["Las tarjetas T10, T11 y T12. Los errores los provocas tú; la persona no los comete.", "Si interpretó el mensaje y propuso la acción correcta (1 o 0) y la cita."],
  9: ["Las tarjetas T22, T23 y T24, sin recordatorios.", "Igual que las compras. Solo cuentan los tiempos y las ayudas del día 2."],
};

const estados = (b) => b.tareas.map((id) => `**${id}:** ${tarea(id).estado}`);

const doc = new Document({
  creator: EQUIPO.integrantes.join(" y "),
  title: "Guía rápida del evaluador — Prueba de usabilidad ComproYa en Línea",
  styles: ESTILOS,
  numbering: { config: NUMERACIONES },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: VERTICAL.margin } },
    footers: { default: pie("Guía rápida del evaluador · ComproYa en Línea") },
    children: [
      PC("Prueba de usabilidad · ComproYa en Línea", { tam: 22, color: "555555", despues: 40 }),
      PC("Guía rápida del evaluador", { tam: 44, negrita: true, color: COLOR.azul, despues: 60 }),
      PC("Cómo llegar a la sesión, qué mostrar y cómo anotar. Imprímela y llévala a cada persona.", { tam: 22, despues: 240 }),

      H1("1. La idea en treinta segundos"),
      ...VINETAS([
        "**Tú no enseñas nada.** Entregas una tarea a la vez y miras cómo la resuelve. Lo que dude, lo que se equivoque y lo que diga en voz alta es justamente el dato.",
        "**Se graba la pantalla y la voz.** La persona piensa en voz alta; el video es tu evidencia y tu respaldo.",
        "**Por tarea anotas cinco cosas:** cuándo empezó y terminó, cuántos clics, qué errores, qué ayudas pidió y si lo logró.",
        "**Dos roles:** quien **dirige** habla con la persona y lee las tarjetas; quien **observa** cronometra y anota. Si vas solo(a), la grabación es tu observador: los tiempos y los clics los sacas del video después.",
      ]),

      H1("2. Qué llevar"),
      tabla([600, 9240], ["", "Material"], [
        ["☐", "Computador con el portal que se va a probar, y la sesión de la persona anterior cerrada."],
        ["☐", "Programa de grabación (Camtasia, OBS o similar) con micrófono probado y un efecto de clic visible en el cursor."],
        ["☐", "**Guía del participante** impresa, una por persona: consentimiento, perfil, datos de prueba y las tarjetas de las tareas."],
        ["☐", "**Hoja de campo** impresa (anexo C del documento), una por persona, con su código P01 a P05."],
        ["☐", "Cronómetro de respaldo (el del celular), lapicero y esta guía."],
        ["☐", "El archivo `Registro_Medicion_CU2_ComproYa.xlsx` para pasar los datos después."],
      ], { centrar: [0] }),

      H1("3. Antes de que llegue (15 minutos)"),
      ...NUMEROS([
        "Abre el portal en una **ventana privada**, zoom al 100 %, sin sesión, con el carrito vacío y en la pantalla de inicio.",
        "Haz tú una compra de ensayo hasta «Pedido confirmado». Si falla, no empieces la sesión.",
        "Confirma que existen la licuadora, el televisor, la lavadora y el refrigerador, y que el cupón LEALTAD10 se aplica en «Datos y envío».",
        "Graba diez segundos y escúchalos: se ve la pantalla y se oye tu voz.",
        "Silencia las notificaciones y cierra lo que no sea el navegador y el grabador.",
        "Pon el código de la persona (P01 a P05) en su hoja de campo y en el nombre de la carpeta de videos.",
      ], "lista10"),

      H1("4. Cuando llega la persona (unos 10 minutos)"),
      tabla([2300, 7540], ["Paso", "Qué haces y qué dices"], [
        ["Recibirla", "Siéntala frente al computador con el portal abierto en el inicio. **No le muestres ni le expliques el sistema.**"],
        ["Bienvenida", "«Gracias por venir. Estamos evaluando el sistema, no a ti: si algo te confunde, es información para mejorarlo. Voy a grabar tu pantalla y tu voz solo para el curso. Puedes parar cuando quieras. No te voy a poder ayudar durante las tareas, porque necesitamos ver cómo lo usarías tú solo(a).»"],
        ["Consentimiento", "Entrégale la hoja de consentimiento, deja que la lea y que la firme. Sin firma no se graba."],
        ["Perfil", "Que llene «Cuéntanos de ti» (edad, ocupación, si compra en línea). Sirve para describir quién es el participante."],
        ["Pensar en voz alta", "«Mientras uses el sistema, di en voz alta lo que piensas, aunque parezca obvio. Si te quedas callado(a), te preguntaré: ¿qué estás pensando? Practiquemos: cuéntame en voz alta cómo abrirías tu correo.»"],
        ["Datos de prueba", "Entrégale la hoja «Datos de prueba» y señálale **su fila** en la tabla de datos únicos. Dile que son datos ficticios que puede escribir tal cual."],
        ["Empezar", "Inicia la grabación. Di el código de la persona y la fecha en voz alta, para que quede en el video."],
      ], { primeraNegrita: true }),
      P("**Qué no haces nunca:** demostrar el portal, nombrar un botón, decir «es arriba a la derecha», decir «bien» o «mal», ni terminar la tarea por ella.", { antes: 100, ...L }),

      SALTO(),
      H1("5. Qué le muestras y qué anotas, bloque por bloque"),
      P(`La sesión 1 dura unos ${minTotal} minutos y la sesión 2, unos ${minDia2}. «Tú dejas listo» es el estado en que debe estar el portal **antes** de entregar la tarjeta.`, L),
      tabla(
        [900, 2700, 2400, 3840],
        ["Bloque", "Tú dejas listo", "Le entregas", "Qué anotas"],
        BLOQUES.map((b) => [{ t: [`**${b.n === 9 ? "Sesión 2" : b.n}**`, `${b.min} min`, b.nombre], fondo: COLOR.azulClaro }, estados(b), ENTREGA[b.n][0], ENTREGA[b.n][1]]),
        { tam: 16, tamCab: 17 },
      ),
      P("**Cierre de la sesión 1 (unos 4 minutos):** pregunta el SEQ de cada tarea justo al terminarla (1 a 7); al final entrégale el SUS y las tres preguntas finales de la guía.", { antes: 100, ...L }),

      H1("6. Cómo cronometrar"),
      ...VINETAS([
        "**Empieza** cuando terminas de leer la tarea, la persona la repite con sus palabras y dices «puedes comenzar».",
        "**Termina** cuando se cumple la condición de término de la tarea (por ejemplo, ve la pantalla «Pedido confirmado» y dice el número). Está en la columna «Condición de término» de las tablas del capítulo 6 del documento de evaluación.",
        "**Pausa** el cronómetro mientras la persona responde preguntas tuyas (T03, T16, T17, T18, SEQ).",
        "**Corta** a los 5 minutos (10 en las compras) o si la persona lo pide: anota «no completó» y sigue con la siguiente.",
        "Anota el minuto del video donde empieza y termina; el tiempo final lo calculas después con el video, y el cronómetro es el respaldo.",
      ]),

      H1("7. Cómo anotar"),
      H2("7.1 En vivo: la hoja de campo"),
      P("Una fila por tarea. Lo que la persona hace se anota con marcas, sin escribir de más; después se completa con el video.", L),
      tabla(
        [800, 1100, 1100, 1500, 1700, 1100, 700, 1840],
        ["Tarea", "Inicio", "Fin", "Clics (marcas)", "Errores N / S / D", "Ayudas (nivel)", "C", "Notas"],
        [[{ t: "**T19**", fondo: COLOR.azulClaro }, "03:10", "03:41", "||| (3)", "1 / 0 / 0", "0", "0", "Buscó «licuadoras»; no encontró; corrigió a «licuadora»."]],
        { centrar: [0, 1, 2, 3, 4, 5, 6], tam: 17 },
      ),
      P("_Ejemplo ilustrativo de cómo se llena una fila; no son datos de una persona real._ Tiempo = 03:41 − 03:10 = 31 s.", { tam: 18, ...L }),
      H2("7.2 Qué cuenta como cada cosa"),
      tabla(
        [1800, 4300, 3740],
        ["Marca", "Qué es", "Ejemplo"],
        [
          ["Clic", "Cada pulsación del mouse o toque, incluidos los clics para entrar en un campo. Las teclas no cuentan como clic.", "Pulsar el buscador, escribir, Enter, pulsar «Agregar al carrito» = 2 clics."],
          ["Error N (navegación)", "Llegar a una pantalla que no es la esperada, volver atrás o abrir un menú equivocado.", "Entra a «Mi cuenta» buscando el carrito."],
          ["Error S (selección)", "Pulsar un botón o control que no hace avanzar la tarea.", "Pulsa «Seguir comprando» en vez de «Continuar con tus datos de envío»."],
          ["Error D (datos)", "Escribir un dato mal, en el campo equivocado, o que el sistema marque como inválido.", "Escribe letras en el teléfono."],
          ["Ayuda (A)", "La persona pide ayuda o tú intervienes. Cuenta 1 cada vez. Anota el nivel: 1 pista general, 2 pista de zona, 3 señalas el control.", "«¿Cómo hago esto?» y tú le respondes."],
          ["Consulta externa (C)", "Leer documentación, preguntar a otra persona o buscar fuera de la pantalla.", "Busca en Google cómo pagar."],
          ["Completó", "Alcanzó la condición de término sin ayuda.", "Llegó a «Pedido confirmado» solo(a)."],
        ],
        { primeraNegrita: true, tam: 17 },
      ),
      H2("7.3 En las tareas de comprensión"),
      P("En T01, T02, T03, T10 a T12 y T16 a T18 no hay tiempo ni clics: marcas **1** si la respuesta cumple la rúbrica de la tarea y **0** si no, y copias una cita textual con su minuto del video. La rúbrica de cada una está en el documento de evaluación (capítulo 6).", L),

      H2("7.4 Después de la sesión (unos 20 minutos)"),
      ...NUMEROS([
        "Respalda los videos y la hoja de campo con el nombre `CU2_P0n_S1_B4_T07.mp4` (persona, sesión, bloque, tarea).",
        "Revisa el video con el anillo de clic: confirma el tiempo (fin − inicio − pausas) y cuenta los clics.",
        "Pasa los datos a la hoja de la persona en el Excel (`P01` a `P05`) según la tabla siguiente.",
        "Copia dos o tres citas del Think Aloud con su minuto a la tabla de citas del caso en el documento.",
      ], "lista11"),
      tabla(
        [3000, 2000, 4840],
        ["Dato en la hoja de campo", "Columna del Excel", "Nota"],
        [
          ["Tiempo (fin − inicio − pausas)", "I · T usuario (s)", "En segundos. El Excel calcula la diferencia y la razón con tu tiempo."],
          ["Clics", "M · Clics usuario", "El Excel calcula la eficiencia de clics."],
          ["Errores N, S, D", "O, P y Q", "El Excel suma el total en la columna R."],
          ["Ayudas", "S", "Número de veces."],
          ["Consultas externas", "T", "Número de veces."],
          ["Completó o acertó", "U", "«Sí» o «No» (en las de comprensión, «Sí» si cumplió la rúbrica)."],
          ["SEQ", "V", "Número de 1 a 7."],
          ["Observaciones y citas", "W", "Texto libre; incluye «falla técnica» si la hubo."],
        ],
        { primeraNegrita: true, tam: 17 },
      ),

      SALTO(),
      H1("8. Si pasa esto, haz esto"),
      tabla([3300, 6540], ["Situación", "Qué haces"], [
        ["Se queda mirando y no hace nada", "Espera hasta 60 s. Luego pregunta «¿qué estás pensando?». Si pide ayuda, anota una ayuda de nivel 1."],
        ["Pregunta «¿cómo se hace esto?»", "Responde «¿qué intentarías?». Si insiste, dale una pista general y anota la ayuda."],
        ["Se equivoca de camino", "No lo corrijas. Anota el error y deja que se recupere solo(a)."],
        ["El portal falla (pantalla en blanco, error técnico, el pago no avanza)", "Anota «falla técnica» con el minuto. **No es un error de la persona.** Repite la tarea; si vuelve a fallar, pasa a la siguiente."],
        ["Se queda callado(a)", "«¿Qué estás pensando?» y nada más."],
        ["Se frustra", "«Estamos probando el sistema, no a ti.» Ofrécele una pausa."],
        ["Se corta la grabación", "Anota la hora, vuelve a iniciarla y sigue. La hoja de campo es tu respaldo."],
        ["Pregunta por el código de descuento", "Dile que está en su hoja «Datos de prueba»."],
        ["Pasan 5 minutos (10 en las compras)", "Corta, anota «no completó» y continúa."],
      ], { primeraNegrita: true, tam: 17 }),

      H1("9. Al terminar"),
      ...NUMEROS([
        "Agradece y recuérdale la hora de la sesión 2 (al día siguiente) y que traiga la hoja «Datos de prueba».",
        "Detén la grabación y guarda el video con su nombre; haz una copia de respaldo.",
        "Cierra la sesión de la persona, vacía el carrito y cancela desde «Mis pedidos» los pedidos que quedaron sin pagar.",
        "Revisa que la hoja de campo tenga el código de la persona y la fecha.",
      ], "lista12"),
      P(`Con ${PARTICIPANTES.length} personas serán ${PARTICIPANTES.length} sesiones 1 de unos ${minTotal} minutos y ${PARTICIPANTES.length} sesiones 2 de unos ${minDia2}. Hagan primero un ensayo completo entre ustedes con el cronómetro para confirmar el orden y la duración.`, { antes: 120, ...L }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(path.join(SALIDA, "Guia_Evaluador_CU2_ComproYa.docx"), buffer);
console.log(`Escrito docs/usabilidad/Guia_Evaluador_CU2_ComproYa.docx (${(buffer.length / 1024).toFixed(0)} KB)`);
