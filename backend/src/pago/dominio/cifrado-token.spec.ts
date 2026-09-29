import { cifrarToken, descifrarToken } from "./cifrado-token";

// Corrección CU-2 #6: cifrado en reposo de Payment.gatewayToken.
describe("cifrado-token (AES-256-GCM)", () => {
  it("descifrarToken(cifrarToken(x)) recupera exactamente el valor original", () => {
    const original = "cs_test_falso_123";
    const cifrado = cifrarToken(original);
    expect(cifrado).not.toBe(original);
    expect(descifrarToken(cifrado)).toBe(original);
  });

  it("cifrar el mismo texto dos veces produce resultados distintos (IV aleatorio por llamada)", () => {
    const original = "pi_test_falso";
    const primerCifrado = cifrarToken(original);
    const segundoCifrado = cifrarToken(original);
    expect(primerCifrado).not.toBe(segundoCifrado);
    expect(descifrarToken(primerCifrado)).toBe(original);
    expect(descifrarToken(segundoCifrado)).toBe(original);
  });

  it("el valor cifrado nunca contiene el texto original en claro", () => {
    const original = "DEBITO-ABCDEFGHIJ";
    const cifrado = cifrarToken(original);
    expect(cifrado).not.toContain(original);
  });
});
