// Contenido de la sesión de usabilidad reducida del Caso de Uso 2 (una sola sesión, ~40 minutos).
// Fuente única de la guía del participante y del Excel de registro. Los tiempos y clics de referencia salen de linea-base.json
// (medir-linea-base.mjs); `ref` es el identificador de la tarea en ese archivo.
export const PARTICIPANTES = [
  { codigo: "P01", nombre: "" },
  { codigo: "P02", nombre: "" },
  { codigo: "P03", nombre: "" },
  { codigo: "P04", nombre: "" },
  { codigo: "P05", nombre: "" },
];

// Cuenta de prueba de cada persona (ficticia). El portal rechaza un documento o correo repetido.
export const CUENTAS = PARTICIPANTES.map((p, i) => ({ codigo: p.codigo, documento: `10123456${String(i + 1).padStart(2, "0")}`, correo: `${p.codigo.toLowerCase()}.usabilidad@ejemplo.com` }));

export const DATOS = [
  ["Contraseña", "Prueba2026"],
  ["Teléfono", "3101234567"],
  ["Dirección", "Calle 45 # 13-20, apto 301"],
  ["Ciudad", "Bogotá"],
  ["Código de descuento (solo cuando una tarea lo pida)", "LEALTAD10"],
];

// Casos de prueba que se aplican (nombres del material de clase). Los casos 2, 4, 6 y 11 no se aplican.
export const CASOS = [
  { n: 1, nombre: "Comprensibilidad del propósito funcional de la GUI", tareas: ["T1", "T5", "T6a"], regla: "Entendió, al menos 80 % de las pantallas" },
  { n: 3, nombre: "Comprensión del flujo de una tarea simple", tareas: ["T6", "T7", "T8"], regla: "Las 3 compras completadas sin ayuda y a tiempo" },
  { n: 5, nombre: "Comprensibilidad sin documentación externa", tareas: ["T6", "T7", "T8"], regla: "Las 3 compras sin pedir ayuda ni buscar fuera" },
  { n: 7, nombre: "Comprensibilidad del estado del sistema", tareas: ["T6b", "T7a", "T8a"], regla: "Entendió, al menos 80 % de los estados" },
  { n: 8, nombre: "Tiempo para aprender una funcionalidad básica", tareas: ["T2", "T3", "T4"], regla: "Las 3 tareas en menos del tiempo objetivo y de 180 s" },
  { n: 9, nombre: "Número de errores cometidos durante el aprendizaje", tareas: ["T6", "T7", "T8"], regla: "Menos de 3 errores en cada compra" },
  { n: 10, nombre: "Necesidad de asistencia", tareas: ["T6", "T7", "T8"], regla: "0 o 1 ayuda en cada compra" },
  { n: 12, nombre: "Tiempo para aprender una funcionalidad avanzada", tareas: ["T9", "T10", "T11"], regla: "Las 3 tareas logradas, a tiempo, con menos de 3 errores y 0 o 1 ayuda" },
];
export const CASOS_NO_APLICADOS = [
  { n: 2, nombre: "Comprensión de iconografía y textos" },
  { n: 4, nombre: "Comprensibilidad de mensajes del sistema" },
  { n: 6, nombre: "Comprensibilidad de la navegación" },
  { n: 11, nombre: "Retención del aprendizaje" },
];

// Tareas en el orden de la sesión. `tipo`: "hacer" (tiene tiempo y clics) o "preguntar" (se responde de palabra).
// `seq`: lleva la escala de dificultad 1 a 7 en la guía. `en`: pregunta que se hace dentro de otra tarea.
export const TAREAS = [
  { n: "T1", ref: "T01", tipo: "preguntar", seq: true, titulo: "Para qué sirve la página de inicio",
    texto: "Esta es la página de una tienda en línea. Sin hacer clic todavía, cuéntanos con tus palabras para qué sirve y qué podrías hacer aquí.",
    estado: "Portal en el inicio, sin sesión y con el carrito vacío.", termina: "Cuando termina de explicar." },
  { n: "T2", ref: "T19", tipo: "hacer", seq: true, titulo: "Buscar y agregar una licuadora",
    texto: "Quieres comprar una licuadora. Encuéntrala y agrégala a tu carrito. Avísanos cuando creas que ya está en el carrito.",
    estado: "Inicio, sin sesión, carrito vacío.", termina: "La licuadora está en el carrito y lo dice." },
  { n: "T3", ref: "T20", tipo: "hacer", seq: true, titulo: "Agregar un televisor mirando las categorías",
    texto: "Ahora quieres un televisor. Encuéntralo mirando las categorías (sin usar el buscador) y agrégalo al carrito.",
    estado: "Inicio.", termina: "El televisor está en el carrito y lo dice." },
  { n: "T4", ref: "T21", tipo: "hacer", seq: true, titulo: "Agregar 2 refrigeradores",
    texto: "Ahora quieres un refrigerador. Búscalo, abre su página y agrega 2 unidades al carrito.",
    estado: "Inicio.", termina: "Hay 2 unidades en el carrito y lo dice." },
  { n: "T5", ref: "T02", tipo: "preguntar", seq: true, titulo: "Para qué sirve el carrito",
    texto: "Abre tu carrito. Cuéntanos para qué sirve esta pantalla.",
    estado: "Carrito con productos (los que agregó en las tareas 2 a 4).", termina: "Cuando termina de explicar." },
  { n: "T6", ref: "T07", tipo: "hacer", seq: true, titulo: "Primera compra: una licuadora",
    texto: "Quieres comprar una licuadora para tu casa. Haz el pedido completo con envío a tu dirección, paga con tarjeta y termina cuando veas que tu pedido quedó confirmado. Dinos el número de tu pedido. Usa los datos de la hoja «Datos para usar».",
    estado: "Inicio, sin sesión y con el carrito vacío (la persona crea su cuenta durante la compra).", termina: "Ve «Pedido confirmado» y dice el número.",
    durante: ["T6a", "T6b"] },
  { n: "T6a", ref: "T03", tipo: "preguntar", seq: false, titulo: "Qué pide la pantalla de datos", en: "T6",
    texto: "Cuando llegues a la pantalla donde te piden tus datos: cuéntanos qué te pide y para qué.",
    estado: "Se pregunta al llegar a «Datos y envío», dentro de la tarea 6.", termina: "Cuando termina de explicar." },
  { n: "T6b", ref: "T16", tipo: "preguntar", seq: false, titulo: "Qué hace el sistema al pagar", en: "T6",
    texto: "Cuando pulses el botón para pagar: cuéntanos qué crees que está haciendo el sistema en ese momento.",
    estado: "Se pregunta al pulsar «Pagar con tarjeta», dentro de la tarea 6.", termina: "Cuando termina de explicar." },
  { n: "T7", ref: "T08", tipo: "hacer", seq: true, titulo: "Segunda compra: 2 televisores",
    texto: "Ahora quieres comprar 2 televisores. Encuéntralos mirando las categorías (sin usar el buscador), haz el pedido con envío a tu dirección y paga con tarjeta. Termina cuando veas el pedido confirmado y dinos el número.",
    estado: "Inicio, con la sesión de la persona y el carrito vacío.", termina: "Ve «Pedido confirmado» y dice el número.",
    durante: ["T7a"] },
  { n: "T7a", ref: "T17", tipo: "preguntar", seq: false, titulo: "Qué hace el sistema al volver del pago", en: "T7",
    texto: "Cuando vuelvas de la página de pago al sitio: cuéntanos qué crees que está haciendo el sistema.",
    estado: "Se pregunta al volver de la pasarela, dentro de la tarea 7.", termina: "Cuando termina de explicar." },
  { n: "T8", ref: "T09", tipo: "hacer", seq: true, titulo: "Tercera compra: lavadora y licuadora",
    texto: "Quieres comprar una lavadora y también una licuadora. Haz el pedido con envío a tu dirección y paga con tarjeta. Termina cuando veas el pedido confirmado y dinos el número.",
    estado: "Inicio, con la sesión de la persona y el carrito vacío.", termina: "Ve «Pedido confirmado» y dice el número.",
    durante: ["T8a"] },
  { n: "T8a", ref: "T18", tipo: "preguntar", seq: false, titulo: "Qué hace el sistema al continuar al pago", en: "T8",
    texto: "Cuando pulses «Continuar al pago»: cuéntanos qué crees que está haciendo el sistema mientras espera.",
    estado: "Se pregunta al pulsar «Continuar al pago», dentro de la tarea 8.", termina: "Cuando termina de explicar." },
  { n: "T9", ref: "T25", tipo: "hacer", seq: true, titulo: "Usar el código de descuento",
    texto: "Tienes un código de descuento: LEALTAD10. Úsalo en esta compra y dinos cuánto pagarías con el descuento. No hace falta pagar.",
    estado: "«Datos y envío», con sesión iniciada y 2 licuadoras en el carrito.", termina: "El descuento está aplicado y dice el nuevo total." },
  { n: "T10", ref: "T26", tipo: "hacer", seq: true, titulo: "Quitar el descuento y ponerlo otra vez",
    texto: "Cambiaste de opinión: quita el descuento. Luego vuelve a aplicarlo.",
    estado: "«Datos y envío» con el código LEALTAD10 ya aplicado (lo aplicas tú).", termina: "El descuento vuelve a estar aplicado." },
  { n: "T11", ref: "T27", tipo: "hacer", seq: true, titulo: "Descuento en otra compra, hasta la pantalla de pago",
    texto: "El televisor ya está en tu carrito. Aplica el código LEALTAD10, completa tus datos de envío y llega hasta la pantalla de pago. Dinos el total que te cobrarían. No pagues.",
    estado: "«Datos y envío», con sesión iniciada y un televisor en el carrito.", termina: "Está en la pantalla de pago y dice el total." },
];

export const PREGUNTA_FINAL = "¿Qué fue lo más difícil o confuso de la tienda?";
