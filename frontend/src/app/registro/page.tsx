"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getCartToken, iniciarSesionLocal, setCartToken } from "@/lib/api";
import { avisarCambioDeCarrito } from "@/lib/eventos";
import type { SesionCliente } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import AccesoLayout, { destinoDeRegreso } from "@/components/AccesoLayout";
import { Button, Checkbox, Enlace, Field, Notice } from "@/components/ui";

// P-4 Registro de cuenta (CU-04, paso previo a la compra). Al terminar, la persona vuelve a donde estaba (?volver=)
// con su carrito. Casilla de consentimiento (CU-05): al marcarla se registra el consentimiento activo. Los errores
// dicen cómo corregir y no borran lo escrito. Estados de design/rediseno/pantallas/Acceso.dc.html: crear cuenta y
// crear cuenta con errores.
interface Datos {
  nombre: string;
  documento: string;
  correo: string;
  clave: string;
}
type Errores = Partial<Record<keyof Datos | "consentimiento", string>>;

function validar(d: Datos, acepta: boolean): Errores {
  const e: Errores = {};
  if (d.nombre.trim().length < 2) e.nombre = "Escribe tu nombre completo.";
  const doc = d.documento.trim();
  if (!doc) e.documento = "Escribe tu documento de identidad.";
  else if (!/^\d+$/.test(doc)) e.documento = "Escribe solo números, sin puntos ni espacios.";
  else if (doc.length < 5) e.documento = "El documento debe tener al menos 5 números.";
  if (!/^\S+@\S+\.\S+$/.test(d.correo.trim())) e.correo = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (d.clave.length < 8) {
    const faltan = 8 - d.clave.length;
    e.clave = `Te ${faltan === 1 ? "falta 1 caracter" : `faltan ${faltan} caracteres`}: usa mínimo 8, con al menos un número.`;
  } else if (!/\d/.test(d.clave)) e.clave = "Agrega al menos un número a tu contraseña.";
  if (!acepta) e.consentimiento = "Acepta el tratamiento de datos para crear tu cuenta.";
  return e;
}

export default function RegistroPage() {
  const router = useRouter();
  const [d, setD] = useState<Datos>({ nombre: "", documento: "", correo: "", clave: "" });
  const [acepta, setAcepta] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<string, boolean>>>({});
  const [errorServidor, setErrorServidor] = useState<{ campo: "documento" | "correo" | null; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [destino, setDestino] = useState("/");

  useEffect(() => setDestino(destinoDeRegreso()), []);

  const errores = validar(d, acepta);
  const visibles: Errores = {};
  for (const k of Object.keys(errores) as Array<keyof Errores>) if (intentado || tocados[k]) visibles[k] = errores[k];
  if (errorServidor?.campo) visibles[errorServidor.campo] = errorServidor.texto;
  const cantidad = Object.keys(visibles).length;

  const cambiar = (k: keyof Datos, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    if (errorServidor?.campo === k) setErrorServidor(null);
  };
  const campo = (k: keyof Datos) => ({
    id: `registro-${k}`,
    value: d[k],
    error: visibles[k],
    valid: !errores[k] && !!d[k] && !errorServidor?.campo,
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => cambiar(k, ev.target.value),
    onBlur: () => setTocados((t) => ({ ...t, [k]: true })),
  });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setIntentado(true);
    setErrorServidor(null);
    const primero = (Object.keys(errores) as Array<keyof Errores>)[0];
    if (primero) {
      document.getElementById(primero === "consentimiento" ? "registro-consentimiento" : `registro-${primero}`)?.focus();
      return;
    }
    setEnviando(true);
    try {
      const sesion = await api<SesionCliente>("/cuenta/registro", {
        method: "POST",
        auth: false,
        cartToken: false,
        body: { name: d.nombre.trim(), document: d.documento.trim(), email: d.correo.trim(), password: d.clave },
      });
      iniciarSesionLocal(sesion.accessToken, sesion.customer);
      // CU-05: la casilla marcada es el consentimiento; sin él la cuenta quedaría con el consentimiento pendiente.
      await api("/cuenta/consentimiento", { method: "POST", body: { activo: true } }).catch(() => undefined);
      if (getCartToken()) {
        await api("/carrito/fusionar", { method: "POST" }).catch(() => undefined);
        setCartToken(null);
      }
      avisarCambioDeCarrito();
      router.push(destino);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const esCorreo = /correo/.test(err.message);
        setErrorServidor({
          campo: esCorreo ? "correo" : "documento",
          texto: esCorreo ? "Ya hay una cuenta con ese correo. Si es tuya, inicia sesión." : "Ya hay una cuenta con ese documento. Si es tuya, inicia sesión.",
        });
        document.getElementById(esCorreo ? "registro-correo" : "registro-documento")?.focus();
      } else {
        setErrorServidor({ campo: null, texto: "No pudimos crear tu cuenta. Revisa tu conexión e inténtalo de nuevo; lo que escribiste se conserva." });
      }
      setEnviando(false);
    }
  }

  return (
    <Pantalla active="cuenta">
      <AccesoLayout>
        <h1 className="h-title">Crear cuenta</h1>
        <p className="muted" style={{ marginBottom: 8 }}>Toma un minuto. Al terminar vuelves a donde estabas.</p>
        {(cantidad > 0 || errorServidor) && (
          <Notice
            tone="danger"
            title={errorServidor && !errorServidor.campo ? "No pudimos crear tu cuenta." : `Revisa ${cantidad} ${cantidad === 1 ? "dato" : "datos"} para crear tu cuenta.`}
            className="acceso-aviso"
            action={errorServidor?.campo ? <Button variant="secondary" size="sm" href={`/ingresar${destino !== "/" ? `?volver=${destino}` : ""}`}>Iniciar sesión</Button> : undefined}
          >
            <p>{errorServidor && !errorServidor.campo ? errorServidor.texto : "Los marcamos abajo. Lo que escribiste se conserva."}</p>
          </Notice>
        )}
        <form onSubmit={enviar} noValidate style={{ display: "contents" }}>
          <Field label="Nombre completo" autoComplete="name" {...campo("nombre")} />
          <Field label="Documento de identidad" inputMode="numeric" autoComplete="off" hint="Solo números, sin puntos ni espacios." {...campo("documento")} />
          <Field label="Correo electrónico" type="email" autoComplete="email" {...campo("correo")} />
          <Field label="Contraseña" type="password" autoComplete="new-password" hint="Mínimo 8 caracteres, con al menos un número." {...campo("clave")} />
          <Checkbox
            id="registro-consentimiento"
            label={
              <>
                Acepto el tratamiento de mis datos personales. Podré administrar mi consentimiento después de registrarme (
                <Enlace href="/privacidad" className="cy-link">Privacidad y consentimiento</Enlace>).
              </>
            }
            checked={acepta}
            onChange={(ev) => setAcepta(ev.target.checked)}
            error={visibles.consentimiento}
          />
          <div style={{ height: 16 }} />
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          <Button size="lg" full iconRight="arrow-right" loading={enviando} onClick={enviar}>
            {enviando ? "Creando tu cuenta…" : "Crear cuenta"}
          </Button>
        </form>
        <p className="small muted" style={{ textAlign: "center", marginTop: 12 }}>
          ¿Ya tienes cuenta?{" "}
          <Enlace className="cy-link" href={`/ingresar${destino !== "/" ? `?volver=${destino}` : ""}`}>Iniciar sesión</Enlace>
        </p>
      </AccesoLayout>
    </Pantalla>
  );
}
