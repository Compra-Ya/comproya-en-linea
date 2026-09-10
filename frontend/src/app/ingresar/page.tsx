"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getCartToken, setToken } from "@/lib/api";
import type { SesionCliente } from "@/lib/types";

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
      // C-04: fusiona el carrito de invitado, si había uno, con el de la cuenta.
      const cartToken = getCartToken();
      if (cartToken) {
        await api("/carrito/fusionar", { method: "POST" });
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tarjeta" style={{ maxWidth: 420 }}>
      <h1>Ingresar</h1>
      {error && <div className="alerta-error">{error}</div>}
      <form onSubmit={enviar}>
        <div className="campo">
          <label>Correo</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="campo">
          <label>Contraseña</label>
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" disabled={enviando}>Ingresar</button>
      </form>
    </div>
  );
}
