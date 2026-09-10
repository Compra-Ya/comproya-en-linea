// PuertoErp: interfaz que el módulo catalogo (y, a través de su servicio de
// aplicación, el módulo pedido) usa para hablar con el ERP centralizado y el
// maestro de códigos homologados (canon, sección 3 — sistemas fuera pero
// condicionantes). AdaptadorErpSimulado es la única implementación hoy;
// conectar el ERP real es reemplazar esa clase, no este contrato ni la
// lógica de negocio que depende de él (docs/arquitectura.md sección 6).
export interface DisponibilidadCalculada {
  productId: number;
  branchId: number;
  availabilityId: number;
  erpUnits: number;
  safetyThreshold: number;
  reservedUnits: number;
  // RN-03: erpUnits - safetyThreshold - reservedUnits, nunca negativo.
  unidadesDisponibles: number;
  syncedAt: Date;
  // RN-04: false si syncedAt tiene más de 15 minutos.
  puedeRetirar: boolean;
}

export interface PuertoErp {
  // RN-01: un producto solo es vendible si su código existe en el maestro de
  // códigos homologados. Simulado con un formato determinístico en vez de
  // una tabla propia — ver AdaptadorErpSimulado.
  esCodigoHomologado(homologatedCode: string): boolean;
  calcularDisponibilidad(productId: number, branchId: number): Promise<DisponibilidadCalculada>;
  listarDisponibilidadPorProducto(productId: number): Promise<DisponibilidadCalculada[]>;
  // RN-05: reserva atómica sobre `Availability.reservedUnits`; lanza error de
  // negocio si no hay unidades suficientes. Devuelve el id de la fila de
  // disponibilidad afectada para que el módulo pedido cree su propia
  // `UnitsReservation` (con el pedido al que pertenece) sin importar
  // `Availability` directamente — solo a través de este puerto.
  reservarUnidades(productId: number, branchId: number, quantity: number): Promise<number>;
  liberarReserva(availabilityId: number, quantity: number): Promise<void>;
}
