// PuertoPasarelaDePagos: el Marco de la asignatura sugiere modelar CU-15
// (tarjeta) y CU-16 (débito bancario) como especialización de un caso
// abstracto "Pagar pedido" (docs/plan-de-trabajo.md, Fase 5) — esta interfaz
// es ese punto común a nivel de diseño, sin que eso invente un caso de uso
// nuevo fuera del canon. RN-06: en ningún método de esta interfaz entra ni
// sale un número de tarjeta — solo tokens/identificadores que emite la
// pasarela.
export interface SesionDeCobro {
  gatewayToken: string;
  redirectUrl: string;
}

export interface PuertoPasarelaDePagos {
  crearCobroConTarjeta(orderId: number, amount: number, correlationId: string): Promise<SesionDeCobro>;
}
