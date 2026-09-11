import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComproYa en Línea",
  description: "Canal de venta digital B2C de Tiendas ComproYa",
};

// Cada pantalla trae su propio cromo (ShopHeader para el catálogo/carrito/
// cuenta, o el encabezado centrado de auth/pago/comprobante) porque así lo
// definen los mockups (docs/mockups-plan.md) — no hay una barra global fija.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
