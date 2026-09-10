"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, setToken } from "@/lib/api";
import type { SesionCliente } from "@/lib/types";

// P-4 Registro de cuenta (CU-04). Actor: Cliente digital.
export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ document: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await api<SesionCliente>("/cuenta/registro", { method: "POST", auth: false, body: form });
      setToken(sesion.accessToken);
      router.push("/privacidad");
    } catch (e) {
      // E-1: documento duplicado.
      setError(e instanceof ApiError ? e.message : "No se pudo completar el registro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tarjeta" style={{ maxWidth: 420 }}>
      <h1>Crear cuenta</h1>
      <p className="muted">Cliente digital — CU-04</p>
      {error && <div className="alerta-error">{error}</div>}
      <form onSubmit={enviar}>
        <div className="campo">
          <label>Documento</label>
          <input required value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
        </div>
        <div className="campo">
          <label>Nombre</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="campo">
          <label>Correo</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="campo">
          <label>Contraseña (mínimo 8 caracteres)</label>
          <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" disabled={enviando}>Registrarme</button>
      </form>
    </div>
  );
}
