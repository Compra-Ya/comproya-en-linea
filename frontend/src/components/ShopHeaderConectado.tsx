"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, cerrarSesion, getStoredCustomer, type CustomerResumen } from "@/lib/api";
import type { Carrito } from "@/lib/types";
import { ShopHeader } from "@/components/ui";
import type { ShopHeaderProps } from "@/components/ui";

// ShopHeader del sistema de diseño con los datos de la sesión y del carrito. Las pantallas
// que ya migraron lo usan; el ShopHeader anterior sigue en las demás hasta migrarlas.
export default function ShopHeaderConectado({ variant, active }: Pick<ShopHeaderProps, "variant" | "active">) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerResumen | null>(null);
  const [cart, setCart] = useState<Carrito | null>(null);

  useEffect(() => {
    setCustomer(getStoredCustomer());
    api<Carrito>("/carrito").then(setCart).catch(() => undefined);
  }, []);

  const subtotal = cart?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;
  const cantidad = cart?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  return (
    <ShopHeader
      variant={variant}
      active={active}
      customerName={customer?.name.split(" ")[0]}
      cartCount={cantidad}
      cartTotal={subtotal}
      onSearch={(q) => router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/")}
      onLogout={() => {
        cerrarSesion();
        router.push("/");
        router.refresh();
      }}
    />
  );
}
