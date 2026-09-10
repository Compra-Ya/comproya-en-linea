// PuertoLealtad: interfaz hacia el programa de lealtad (canon, sección 3 —
// sistema externo fuera de alcance, el canal solo lo consume). Sostiene C-14
// (cuenta vinculada al programa de lealtad) en CU-04.
export interface PuertoLealtad {
  // Simula la resolución del identificador de lealtad contra el programa
  // real. El canon documenta 8-12% de registros sin correspondencia
  // (sección 10) — por eso puede devolver false para un identificador con
  // formato correcto pero no encontrado, tal como pasaría contra el sistema real.
  resolverIdentificador(loyaltyId: string): boolean;
}
