"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, setCartToken } from "./api";
import { alCambiarLaSesion, avisarCambioDeCarrito } from "./eventos";
import type { Carrito } from "./types";

export type EstadoCarrito = "cargando" | "listo" | "error";

/**
 * Carrito del cliente (o del invitado) tal como lo devuelve el servidor, con sus totales. Cada cambio
 * avisa a la cabecera para que muestre la cantidad y el subtotal nuevos.
 */
export function useCarrito() {
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [estado, setEstado] = useState<EstadoCarrito>("cargando");
  const [errorLinea, setErrorLinea] = useState<{ productId: number; texto: string } | null>(null);

  const recargar = useCallback(async () => {
    setEstado("cargando");
    try {
      const actual = await api<Carrito>("/carrito");
      if (actual.guestToken) setCartToken(actual.guestToken);
      setCarrito(actual);
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    recargar();
    return alCambiarLaSesion(recargar);
  }, [recargar]);

  /** Cambia la cantidad de un producto (0 lo quita). */
  const cambiarCantidad = useCallback(
    async (productId: number, quantity: number) => {
      if (!carrito) return;
      setErrorLinea(null);
      try {
        setCarrito(await api<Carrito>(`/carrito/${carrito.id}/items/${productId}`, { method: "PATCH", body: { quantity } }));
        avisarCambioDeCarrito();
      } catch (e) {
        setErrorLinea({
          productId,
          texto: e instanceof ApiError && e.status === 400 ? e.message : "No pudimos cambiar la cantidad. Inténtalo de nuevo.",
        });
      }
    },
    [carrito],
  );

  return { carrito, estado, recargar, cambiarCantidad, errorLinea };
}

/** Agrega unidades de un producto al carrito. Lanza ApiError si el servidor lo rechaza (por ejemplo, por el tope). */
export async function agregarAlCarrito(productId: number, quantity: number): Promise<Carrito> {
  const carrito = await api<Carrito>("/carrito/items", { method: "POST", body: { productId, quantity } });
  if (carrito.guestToken) setCartToken(carrito.guestToken);
  avisarCambioDeCarrito();
  return carrito;
}
