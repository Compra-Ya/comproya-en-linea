import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

/** Enlace interno con next/link (sin recargar la página) o externo/ancla con <a>. */
export function Enlace({ href, children, ...resto }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...resto}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...resto}>
      {children}
    </a>
  );
}
