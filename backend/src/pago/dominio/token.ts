// Clase de diseño Token (Plan_Pruebas_ComproYa.docx, Caso de Uso 2). RN-06:
// ComproYa nunca almacena ni procesa datos de tarjeta — este valor es
// siempre el identificador que entrega la pasarela (`Payment.gatewayToken`),
// jamás un número de tarjeta.
export class Token {
  constructor(public readonly gatewayToken: string) {}
}
