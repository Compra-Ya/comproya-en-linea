"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, cerrarSesion, getStoredCustomer } from "@/lib/api";
import { alCambiarElCarrito, alCambiarLaSesion, avisarCambioDeCarrito, avisarCambioDeSesion } from "@/lib/eventos";
import type { Carrito } from "@/lib/types";
import { ShopHeader } from "@/components/ui";
import type { ShopHeaderProps } from "@/components/ui";

// ShopHeader del sistema de diseño con los datos reales: nombre de la sesión y cantidad y subtotal del
// carrito, tal como los devuelve el servidor. Se actualiza solo cuando cambia el carrito o la sesión.
export default function ShopHeaderConectado({ variant, active }: Pick<ShopHeaderProps, "variant" | "active">) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [nombre, setNombre] = useState<string | undefined>(undefined);
  const [carrito, setCarrito] = useState<Carrito | null>(null);

  const cargarCarrito = useCallback(() => {
    api<Carrito>("/carrito").then(setCarrito).catch(() => undefined);
  }, []);

  useEffect(() => {
    // La búsqueda en curso se lee del navegador (useSearchParams exigiría un Suspense en cada pantalla).
    setBusqueda(new URLSearchParams(window.location.search).get("q") ?? "");
    const leerSesion = () => setNombre(getStoredCustomer()?.name.split(" ")[0]);
    leerSesion();
    cargarCarrito();
    const quitarCarrito = alCambiarElCarrito(cargarCarrito);
    const quitarSesion = alCambiarLaSesion(() => {
      leerSesion();
      cargarCarrito();
    });
    return () => {
      quitarCarrito();
      quitarSesion();
    };
  }, [cargarCarrito]);

  return (
    <ShopHeader
      variant={variant}
      active={active}
      customerName={nombre}
      cartCount={carrito?.unidades ?? 0}
      cartTotal={carrito?.subtotal ?? 0}
      query={busqueda}
      onSearch={(q) => router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/")}
      onLogout={() => {
        cerrarSesion();
        avisarCambioDeSesion();
        avisarCambioDeCarrito();
        router.push("/");
      }}
    />
  );
}
