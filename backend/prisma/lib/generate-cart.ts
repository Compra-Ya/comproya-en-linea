import { faker } from "@faker-js/faker";
import type { CartSeed } from "./types";

/**
 * Genera carritos de prueba (C-04 persistente, C-05 hasta 4 complementarios).
 * `guestRatio` controla qué proporción queda sin cliente (carrito de
 * invitado, antes de iniciar sesión).
 */
export function generateCarts(
  customerDocuments: string[],
  productCodes: string[],
  count: number,
  guestRatio = 0.3
): CartSeed[] {
  const carts: CartSeed[] = [];

  for (let i = 0; i < count; i++) {
    const isGuest = Math.random() < guestRatio || customerDocuments.length === 0;
    const itemCount = 1 + Math.floor(Math.random() * 4); // 1 a 4 líneas
    const chosenCodes = faker.helpers.arrayElements(productCodes, Math.min(itemCount, productCodes.length));

    carts.push({
      customerDocument: isGuest
        ? null
        : faker.helpers.arrayElement(customerDocuments),
      items: chosenCodes.map((code) => ({
        productHomologatedCode: code,
        quantity: 1 + Math.floor(Math.random() * 3),
      })),
    });
  }

  return carts;
}

/**
 * Sugerencias de producto complementario (C-05): hasta 4 por producto base,
 * tomadas de otros productos del catálogo, nunca del mismo producto.
 */
export function generateComplementaryLinks(
  productCodes: string[],
  maxPerProduct = 4
): { productCode: string; suggestedCode: string; position: number }[] {
  const links: { productCode: string; suggestedCode: string; position: number }[] = [];

  for (const code of productCodes) {
    const candidates = productCodes.filter((c) => c !== code);
    const suggestions = faker.helpers.arrayElements(
      candidates,
      Math.min(maxPerProduct, candidates.length)
    );
    suggestions.forEach((suggestedCode, position) => {
      links.push({ productCode: code, suggestedCode, position });
    });
  }

  return links;
}
