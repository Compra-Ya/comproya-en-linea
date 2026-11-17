"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, cerrarSesionInterna, haySesionInterna, type CuentaInternaResumen } from "@/lib/api";
import { AcademicFooter } from "@/components/ui";

type Seccion = "publicar" | "ventas";

// Marco de las pantallas internas del Coordinador de Canal Digital (REQ-017): pide la sesión de la cuenta interna,
// la valida con el servidor y, si no hay una vigente, lleva a /admin/ingresar. Nada del contenido se muestra antes.
export default function PanelInterno({ titulo, activa, children }: { titulo: string; activa?: Seccion; children: ReactNode }) {
  const router = useRouter();
  const [cuenta, setCuenta] = useState<CuentaInternaResumen | null>(null);

  useEffect(() => {
    if (!haySesionInterna()) {
      router.replace(`/admin/ingresar?volver=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    // Si el servidor responde 401, api() cierra la sesión y redirige; cualquier otro error deja la pantalla en espera.
    api<CuentaInternaResumen>("/cuenta/interno/yo", { interno: true })
      .then(setCuenta)
      .catch(() => undefined);
  }, [router]);

  function salir() {
    cerrarSesionInterna();
    router.replace("/admin/ingresar");
  }

  if (!cuenta) {
    return (
      <main className="panel-main" aria-live="polite">
        <p className="muted">Verificando tu sesión…</p>
      </main>
    );
  }

  return (
    <>
      <div className="panel-shell">
        <div className="panel-sidebar">
          <div className="brand-row">
            <span className="brand-mark" style={{ width: 28, height: 28, fontSize: 12 }}>CY</span>ComproYa
          </div>
          <nav aria-label="Administración">
            <a href="/admin/publicar" className={activa === "publicar" ? "active" : undefined} aria-current={activa === "publicar" ? "page" : undefined}>
              Publicar producto
            </a>
            <a href="/admin/ventas" className={activa === "ventas" ? "active" : undefined} aria-current={activa === "ventas" ? "page" : undefined}>
              Ventas
            </a>
          </nav>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div className="panel-topbar">
            <h1 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-soft)" }}>{titulo}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="muted" data-testid="cuenta-interna">{cuenta.name} · {cuenta.email}</span>
              <button type="button" className="btn" onClick={salir}>Salir</button>
            </div>
          </div>
          <div className="panel-main">{children}</div>
        </div>
      </div>
      <AcademicFooter />
    </>
  );
}
