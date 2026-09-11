"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, getCartToken, setStoredCustomer, setToken } from "@/lib/api";
import type { SesionCliente } from "@/lib/types";

// Sostiene CU-04 (no tiene mockup propio — P-4 es el registro; el modal de
// login del canvas usa "Continuar con Google", que no se implementa: el
// canon exige JWT propio, sin delegar en un proveedor externo, arquitectura.md §7).
export default function IngresarPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await api<SesionCliente>("/cuenta/login", { method: "POST", auth: false, body: form });
      setToken(sesion.accessToken);
      setStoredCustomer({ id: sesion.customer.id, name: sesion.customer.name });
      // C-04: fusiona el carrito de invitado, si había uno, con el de la cuenta.
      if (getCartToken()) {
        await api("/carrito/fusionar", { method: "POST" }).catch(() => undefined);
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-shell">
      <Link href="/" className="auth-brand"><span className="brand-mark">CY</span>ComproYa</Link>

      <div className="card card-pad auth-wrap">
        <h2 style={{ textAlign: "center", marginBottom: 6 }}>Ingresar a ComproYa</h2>
        <p className="muted" style={{ textAlign: "center", marginBottom: 20 }}>Accede a tu cuenta para ver tus pedidos.</p>

        {error && <div className="notice notice-danger" style={{ marginBottom: 14 }}>{error}</div>}
        <form onSubmit={enviar}>
          <div className="field">
            <label>Correo electrónico</label>
            <input required type="email" placeholder="tucorreo@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input required type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={enviando}>Iniciar sesión</button>
        </form>

        <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>
          ¿No tienes cuenta? <Link href="/registro">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
