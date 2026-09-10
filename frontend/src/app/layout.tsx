import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComproYa en Línea",
  description: "Canal de venta digital B2C de Tiendas ComproYa",
};

// Cliente digital y roles internos comparten este mismo proyecto, separados
// por ruta (docs/arquitectura.md sección 4) — no son dos aplicaciones.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <nav className="barra-nav">
          <div className="barra-nav-interior">
            <Link href="/" className="marca">ComproYa en Línea</Link>
            <Link href="/">Catálogo</Link>
            <Link href="/carrito">Carrito</Link>
            <Link href="/pedidos">Mis pedidos</Link>
            <Link href="/registro">Registrarme</Link>
            <Link href="/ingresar">Ingresar</Link>
            <Link href="/privacidad">Privacidad</Link>
            <span className="muted" style={{ marginLeft: "auto" }}>
              Panel interno: <Link href="/interno/publicar">Publicar producto</Link>
            </span>
          </div>
        </nav>
        <main className="contenedor">{children}</main>
      </body>
    </html>
  );
}
