"use client";

import ShopHeaderConectado from "@/components/ShopHeaderConectado";

// Compatibilidad: las pantallas que aún importan este componente reciben la cabecera del sistema de
// diseño (design/design-system). Migrar una pantalla es cambiar el import a ShopHeaderConectado.
export default function ShopHeader({ activeLink = "catalogo" }: { activeLink?: "catalogo" | "carrito" | "cuenta" | "pedidos" }) {
  return <ShopHeaderConectado active={activeLink} />;
}
