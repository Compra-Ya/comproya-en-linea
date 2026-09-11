"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, getCartToken, setStoredCustomer, setToken } from "@/lib/api";
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
      setStoredCustomer({ id: sesion.customer.id, name: sesion.customer.name });
      // C-04: si venía navegando como invitado con un carrito, no se pierde al crear la cuenta.
      if (getCartToken()) {
        await api("/carrito/fusionar", { method: "POST" }).catch(() => undefined);
      }
      router.push("/privacidad");
    } catch (e) {
      // E-1: documento duplicado.
      setError(e instanceof ApiError ? e.message : "No se pudo completar el registro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-shell">
      <Link href="/" className="auth-brand"><span className="brand-mark">CY</span>ComproYa</Link>
      <p className="muted" style={{ marginBottom: 24 }}>Crea tu cuenta para hacer seguimiento a tus pedidos</p>

      <div className="card card-pad auth-wrap">
        {error && <div className="notice notice-danger" style={{ marginBottom: 14 }}>{error}</div>}
        <form onSubmit={enviar}>
          <div className="field">
            <label>Nombre completo</label>
            <input required placeholder="Nombre y apellido" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Documento de identidad</label>
            <input required placeholder="Número de documento" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input required type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input required type="password" minLength={8} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <div className="check-row">
            <input type="checkbox" required defaultChecked style={{ width: "auto" }} />
            <span>Acepto el tratamiento de mis datos personales y podré administrar mi consentimiento después de registrarme.</span>
          </div>

          <div className="notice notice-ok" style={{ marginTop: 12 }}>
            Tu cuenta quedará vinculada a tu identificador de lealtad si ya tienes uno registrado en el programa de lealtad.
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={enviando}>Crear cuenta</button>
        </form>
      </div>
    </div>
  );
}
