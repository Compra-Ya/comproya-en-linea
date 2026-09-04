import { faker } from "@faker-js/faker";
import { scryptSync, randomBytes } from "node:crypto";
import type { CustomerSeed } from "./types";

/**
 * Hash de contraseña solo para datos de siembra (scrypt + sal aleatoria).
 * El módulo `cuenta` real hashea con bcrypt vía NestJS (arquitectura.md
 * sección 7) — esto es exclusivamente para no dejar contraseñas en texto
 * plano en la base de datos de prueba.
 */
export function hashSeedPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

const SEED_PASSWORD = "Comprador123!";

/**
 * Genera clientes de prueba. C-14: cuenta vinculada al identificador de
 * lealtad — se deja sin vincular entre 8% y 12% de las veces a propósito,
 * la misma discrepancia que documenta el canon en la sección 10 (no una
 * cifra nueva). El consentimiento (RN-10) queda activo ~70% de las veces.
 */
export function generateCustomers(count: number): CustomerSeed[] {
  const documents = new Set<string>();
  const customers: CustomerSeed[] = [];
  const passwordHash = hashSeedPassword(SEED_PASSWORD);

  while (customers.length < count) {
    const document = faker.string.numeric(10);
    if (documents.has(document)) continue;
    documents.add(document);

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const missingLoyaltyLink = Math.random() < 0.1; // ~10%, dentro del 8-12% del canon

    customers.push({
      document,
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      passwordHash,
      loyaltyId: missingLoyaltyLink ? null : `LEALTAD-${faker.string.alphanumeric(8).toUpperCase()}`,
      consentActive: Math.random() < 0.7,
    });
  }

  return customers;
}
