// Clase de diseño Cuenta (Plan_Pruebas_ComproYa.docx, Caso de Uso 1, PI-01:
// "Cuenta sola — activar() cambia el estado correctamente sin depender de
// otras clases"). No tiene una tabla propia: `Customer` no distingue estados
// de cuenta, así que esto es una regla de negocio pura, sin persistencia —
// una cuenta recién creada por GestorDeRegistro siempre queda activa.
export type EstadoCuenta = "pendiente" | "activa";

export class Cuenta {
  private _estado: EstadoCuenta = "pendiente";

  get estado(): EstadoCuenta {
    return this._estado;
  }

  activar(): void {
    this._estado = "activa";
  }
}
