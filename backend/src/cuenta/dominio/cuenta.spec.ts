import { Cuenta } from "./cuenta";

describe("Cuenta (dominio)", () => {
  it("PI-01: activar() cambia el estado correctamente sin depender de otras clases", () => {
    const cuenta = new Cuenta();
    expect(cuenta.estado).toBe("pendiente");

    cuenta.activar();

    expect(cuenta.estado).toBe("activa");
  });
});
