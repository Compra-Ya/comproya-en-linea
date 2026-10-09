"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui";

// Marco de "Ingresar" y "Crear cuenta" (design/rediseno/pantallas/Acceso.dc.html): panel azul con las ventajas de tener
// cuenta y el formulario a la derecha (solo el formulario en celular).
export default function AccesoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wrap" style={{ paddingTop: 32 }}>
      <div className="auth">
        <div className="auth-side">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/logo-horizontal-blanco.svg" alt="ComproYa" style={{ height: 40, width: "auto", alignSelf: "flex-start" }} />
          <h2 style={{ fontSize: 26, lineHeight: "32px", fontWeight: 800, color: "#ffffff" }}>Tu cuenta hace tu compra más fácil</h2>
          <p>Inicias sesión una vez y sigues donde ibas.</p>
          <ul>
            <li><span className="a-ic"><Icon name="cart" size={20} /></span>Tu carrito te espera en cualquier dispositivo</li>
            <li><span className="a-ic"><Icon name="receipt" size={20} /></span>Sigues el estado de cada pedido</li>
            <li><span className="a-ic"><Icon name="ticket" size={20} /></span>Usas tus cupones de lealtad</li>
          </ul>
        </div>
        <div className="auth-form">{children}</div>
      </div>
    </div>
  );
}

/** A dónde vuelve la persona al terminar (solo rutas propias). Sin `volver`, al catálogo. */
export function destinoDeRegreso(): string {
  if (typeof window === "undefined") return "/";
  const volver = new URLSearchParams(window.location.search).get("volver");
  return volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : "/";
}

/** Nombre del destino en palabras, para decirle a la persona dónde va a quedar. */
export function nombreDelDestino(ruta: string): string {
  if (ruta.startsWith("/pedido/confirmar")) return "Datos y envío";
  if (ruta.startsWith("/carrito")) return "tu carrito";
  if (ruta.startsWith("/pedidos")) return "Mis pedidos";
  if (ruta.startsWith("/pago/")) return "el pago de tu pedido";
  if (ruta.startsWith("/comprobante/")) return "tu pedido";
  return "el catálogo";
}
