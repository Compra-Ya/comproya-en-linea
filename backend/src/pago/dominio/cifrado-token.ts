import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Corrección CU-2 #6: Payment.gatewayToken (el identificador que emite la
// pasarela — Checkout Session, payment_intent, o la referencia simulada de
// débito) quedaba en texto plano en la base de datos. No es un número de
// tarjeta (RN-06 se cumple sin excepción, verificado en pago.service.spec.ts),
// pero es un dato de la transacción que vale la pena cifrar en reposo en vez
// de dejarlo legible directamente en la tabla `payments`.
const ALGORITMO = "aes-256-gcm";
// Sal fija: solo sirve para derivar una clave de 32 bytes a partir del
// secreto real (PAYMENT_TOKEN_ENCRYPTION_KEY); la seguridad depende de ese
// secreto, no de la sal.
const SAL_DERIVACION = "comproya-token-pasarela";

function obtenerClave(): Buffer {
  const secreto = process.env.PAYMENT_TOKEN_ENCRYPTION_KEY;
  if (!secreto) {
    throw new Error("Falta PAYMENT_TOKEN_ENCRYPTION_KEY");
  }
  return scryptSync(secreto, SAL_DERIVACION, 32);
}

// Formato almacenado: "iv:authTag:cifrado" (los tres en hexadecimal), en el
// mismo campo String que ya existía — no requiere migración de esquema.
export function cifrarToken(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITMO, obtenerClave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${cifrado.toString("hex")}`;
}

export function descifrarToken(valorCifrado: string): string {
  const [ivHex, authTagHex, cifradoHex] = valorCifrado.split(":");
  if (!ivHex || !authTagHex || !cifradoHex) {
    throw new Error("Formato de token cifrado inválido");
  }
  const decipher = createDecipheriv(ALGORITMO, obtenerClave(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const descifrado = Buffer.concat([decipher.update(Buffer.from(cifradoHex, "hex")), decipher.final()]);
  return descifrado.toString("utf8");
}
