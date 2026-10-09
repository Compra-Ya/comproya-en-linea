"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getCartToken, iniciarSesionLocal, setCartToken } from "@/lib/api";
import { avisarCambioDeCarrito } from "@/lib/eventos";
import type { SesionCliente } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import AccesoLayout, { destinoDeRegreso, nombreDelDestino } from "@/components/AccesoLayout";
import { Button, Field, Notice } from "@/components/ui";

// Ingresar (paso previo a la compra). Al entrar, la persona vuelve a la pantalla donde estaba (?volver=) con su
// carrito intacto: el de invitado se fusiona con el de su cuenta. Un error de credenciales dice qué revisar y no
// borra el correo. Estados de design/rediseno/pantallas/Acceso.dc.html: ingresar e ingresar con error.
export default function IngresarPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>(undefined);
  const [errorClave, setErrorClave] = useState<string | undefined>(undefined);
  const [fallo, setFallo] = useState<"credenciales" | "red" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [destino, setDestino] = useState("/");

  useEffect(() => setDestino(destinoDeRegreso()), []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setFallo(null);
    const eCorreo = !correo.trim() ? "Escribe tu correo electrónico." : !/^\S+@\S+\.\S+$/.test(correo.trim()) ? "Escribe un correo válido, por ejemplo nombre@correo.com." : undefined;
    const eClave = !clave ? "Escribe tu contraseña." : undefined;
    setErrorCorreo(eCorreo);
    setErrorClave(eClave);
    if (eCorreo || eClave) {
      document.getElementById(eCorreo ? "ingresar-correo" : "ingresar-clave")?.focus();
      return;
    }
    setEnviando(true);
    try {
      const sesion = await api<SesionCliente>("/cuenta/login", { method: "POST", auth: false, cartToken: false, body: { email: correo.trim(), password: clave } });
      iniciarSesionLocal(sesion.accessToken, sesion.customer);
      // C-04: el carrito de invitado se suma al de la cuenta y deja de existir como invitado.
      if (getCartToken()) {
        await api("/carrito/fusionar", { method: "POST" }).catch(() => undefined);
        setCartToken(null);
      }
      avisarCambioDeCarrito();
      router.push(destino);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFallo("credenciales");
        setClave("");
        setErrorClave("Vuelve a escribir tu contraseña.");
        document.getElementById("ingresar-clave")?.focus();
      } else {
        setFallo("red");
      }
      setEnviando(false);
    }
  }

  return (
    <Pantalla active="cuenta">
      <AccesoLayout>
        <h1 className="h-title">Ingresar a ComproYa</h1>
        <p className="muted" style={{ marginBottom: 8 }}>
          Al entrar vuelves a <strong style={{ color: "var(--ink)" }}>{nombreDelDestino(destino)}</strong>, con tu carrito intacto.
        </p>
        {fallo === "credenciales" && (
          <Notice tone="danger" title="El correo o la contraseña no coinciden." className="acceso-aviso">
            <p>Revisa los datos e inténtalo de nuevo. Tu correo sigue escrito; solo vuelve a escribir la contraseña.</p>
          </Notice>
        )}
        {fallo === "red" && (
          <Notice tone="danger" title="No pudimos iniciar tu sesión." className="acceso-aviso">
            <p>Revisa tu conexión e inténtalo de nuevo. Lo que escribiste se conserva.</p>
          </Notice>
        )}
        <form onSubmit={enviar} noValidate style={{ display: "contents" }}>
          <Field
            id="ingresar-correo"
            label="Correo electrónico"
            type="email"
            icon="user"
            autoComplete="email"
            hint="El mismo con el que creaste tu cuenta."
            value={correo}
            error={errorCorreo}
            onChange={(ev) => setCorreo(ev.target.value)}
          />
          <Field
            id="ingresar-clave"
            label="Contraseña"
            type="password"
            icon="lock"
            autoComplete="current-password"
            value={clave}
            error={errorClave}
            onChange={(ev) => setClave(ev.target.value)}
          />
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          <Button size="lg" full iconRight="arrow-right" loading={enviando} onClick={enviar}>
            {enviando ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </form>
        <p className="divider" style={{ margin: "12px 0" }}>¿No tienes cuenta?</p>
        <Button variant="secondary" size="lg" full href={`/registro${destino !== "/" ? `?volver=${destino}` : ""}`}>Crear cuenta</Button>
      </AccesoLayout>
    </Pantalla>
  );
}
