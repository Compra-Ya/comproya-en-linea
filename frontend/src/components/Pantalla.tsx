"use client";

import type { ReactNode } from "react";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { AcademicFooter } from "@/components/ui";
import type { ShopHeaderProps } from "@/components/ui";

// Marco común de todas las pantallas del flujo: la misma cabecera (compacta desde "Datos y envío"),
// el contenido y el pie con el aviso académico. Cada pantalla pone sus propias secciones dentro de <main>.
export default function Pantalla({
  children,
  active,
  variant,
}: {
  children: ReactNode;
  active: ShopHeaderProps["active"];
  variant?: ShopHeaderProps["variant"];
}) {
  return (
    <div className="pg">
      <ShopHeaderConectado variant={variant} active={active} />
      <main>{children}</main>
      <AcademicFooter />
    </div>
  );
}
