"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, haySesionInterna, iniciarSesionInterna } from "@/lib/api";
import type { SesionInterna } from "@/lib/types";
import { AcademicFooter } from "@/components/ui";

// Ingreso de la cuenta interna del Coordinador de Canal Digital (REQ-017). Es una cuenta aparte de la del Cliente
// digital: no se crea desde la tienda, la siembra el equipo (npm run seed:staff). La tienda NO enlaza a esta pantalla:
// se entra solo escribiendo la dirección /admin.
function destinoDeRegreso(): string {
  const volver = new URLSearchParams(window.location.search).get("volver");
  return volver && volver.startsWith("/admin/") && !volver.startsWith("//") ? volver : "/admin/ventas";
}

export default function IngresarInternoPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Una sesión que ya existe no necesita volver a escribir la contraseña; si venció, el panel la limpia y regresa aquí.
  useEffect(() => {
    if (haySesionInterna()) router.replace(destinoDeRegreso());
  }, [router]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!correo.trim() || !clave) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    setEnviando(true);
    try {
      const sesion = await api<SesionInterna>("/cuenta/interno/login", {
        method: "POST",
        auth: false,
        cartToken: false,
        body: { email: correo.trim(), password: clave },
      });
      iniciarSesionInterna(sesion.accessToken, sesion.staff);
      router.replace(destinoDeRegreso());
    } catch (err) {
      setClave("");
      setError(
        err instanceof ApiError && err.status === 401
          ? "El correo o la contraseña no coinciden. Revisa los datos e inténtalo de nuevo."
          : "No pudimos iniciar tu sesión. Revisa tu conexión e inténtalo de nuevo.",
      );
      setEnviando(false);
    }
  }

  return (
    <>
      <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <form onSubmit={enviar} noValidate className="card card-pad" style={{ width: "100%", maxWidth: 400 }}>
          <div className="brand-row" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
            <span className="brand-mark" style={{ width: 28, height: 28, fontSize: 12 }}>CY</span>ComproYa
          </div>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>Administración</h1>
          <p className="muted" style={{ marginBottom: 16 }}>Ingresa con tu cuenta de Coordinador de Canal Digital.</p>

          {error && <div className="notice notice-danger" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="field">
            <label htmlFor="interno-correo">Correo electrónico</label>
            <input id="interno-correo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="interno-clave">Contraseña</label>
            <input id="interno-clave" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={enviando} style={{ width: "100%", marginTop: 8 }}>
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>
          <p className="faint" style={{ marginTop: 16 }}>¿Eres cliente? <a href="/ingresar">Ingresa a la tienda</a>.</p>
        </form>
      </main>
      <AcademicFooter />
    </>
  );
}
