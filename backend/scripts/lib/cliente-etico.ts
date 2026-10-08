// Cliente HTTP "educado" para el scraper de imágenes (Tarea B del handoff de
// diseño). Reglas: respeta robots.txt, máximo 1 solicitud por segundo por
// sitio, User-Agent identificable, caché en disco y — ante CAPTCHA, 403 o 429 —
// marca el sitio como no disponible y NO reintenta ni intenta evadirlo.
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export const USER_AGENT =
  "ComproYaEnLinea-AcademicBot/1.0 (proyecto academico Ing. Software II, Universidad Central; sin fines comerciales)";
const INTERVALO_MS = 1100;

export class SitioNoDisponible extends Error {
  constructor(public host: string, public motivo: string) {
    super(`${host} no disponible: ${motivo}`);
  }
}

interface ReglaRobots {
  permitir: boolean;
  patron: RegExp;
  largo: number;
}

/** Convierte un patrón de robots.txt (con * y $) en expresión regular. */
function patronARegex(p: string): RegExp {
  const esc = p.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + esc.replace(/\\\$$/, "$"));
}

/** Reglas del grupo `User-agent: *` (el nuestro no tiene grupo propio). */
export function parsearRobots(texto: string): ReglaRobots[] {
  const reglas: ReglaRobots[] = [];
  let enGrupoComodin = false;
  let previaEraAgente = false;
  for (const bruta of texto.split(/\r?\n/)) {
    const linea = bruta.replace(/#.*/, "").trim();
    if (!linea) continue;
    const i = linea.indexOf(":");
    if (i < 0) continue;
    const clave = linea.slice(0, i).trim().toLowerCase();
    const valor = linea.slice(i + 1).trim();
    if (clave === "user-agent") {
      enGrupoComodin = previaEraAgente ? enGrupoComodin || valor === "*" : valor === "*";
      previaEraAgente = true;
      continue;
    }
    previaEraAgente = false;
    if (!enGrupoComodin || !valor) continue;
    if (clave === "disallow" || clave === "allow") {
      reglas.push({ permitir: clave === "allow", patron: patronARegex(valor), largo: valor.length });
    }
  }
  return reglas;
}

/** Gana la regla más específica (más larga); si empatan, gana Allow. */
export function rutaPermitida(reglas: ReglaRobots[], rutaConQuery: string): boolean {
  let mejor: ReglaRobots | null = null;
  for (const r of reglas) {
    if (!r.patron.test(rutaConQuery)) continue;
    if (!mejor || r.largo > mejor.largo || (r.largo === mejor.largo && r.permitir)) mejor = r;
  }
  return mejor ? mejor.permitir : true;
}

export class ClienteEtico {
  private ultimo = new Map<string, number>();
  private robots = new Map<string, ReglaRobots[] | null>();
  readonly bloqueados = new Map<string, string>();
  readonly conteo = { red: 0, cache: 0 };

  constructor(private dirCache: string) {
    mkdirSync(dirCache, { recursive: true });
  }

  private rutaCache(url: string): string {
    return join(this.dirCache, createHash("sha1").update(url).digest("hex"));
  }

  private async esperar(host: string) {
    const falta = (this.ultimo.get(host) ?? 0) + INTERVALO_MS - Date.now();
    if (falta > 0) await new Promise((r) => setTimeout(r, falta));
    this.ultimo.set(host, Date.now());
  }

  private marcarBloqueo(host: string, motivo: string): never {
    this.bloqueados.set(host, motivo);
    throw new SitioNoDisponible(host, motivo);
  }

  private async pedir(url: string): Promise<Response> {
    const host = new URL(url).host;
    if (this.bloqueados.has(host)) throw new SitioNoDisponible(host, this.bloqueados.get(host)!);
    await this.esperar(host);
    this.conteo.red++;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
    if (res.status === 403 || res.status === 429 || res.status === 503) {
      this.marcarBloqueo(host, `HTTP ${res.status}`);
    }
    return res;
  }

  private async reglasDe(origen: string): Promise<ReglaRobots[] | null> {
    if (this.robots.has(origen)) return this.robots.get(origen)!;
    let reglas: ReglaRobots[] | null = [];
    try {
      const res = await this.pedir(`${origen}/robots.txt`);
      const tipo = res.headers.get("content-type") ?? "";
      // Un CDN sin robots.txt suele responder 404 o una imagen de reemplazo:
      // sin archivo de texto no hay reglas que aplicar.
      reglas = res.ok && /text|plain/.test(tipo) ? parsearRobots(await res.text()) : [];
    } catch (e) {
      if (e instanceof SitioNoDisponible) throw e;
      reglas = [];
    }
    this.robots.set(origen, reglas);
    return reglas;
  }

  /** Descarga (o lee de caché) respetando robots.txt. Devuelve bytes. */
  async obtener(url: string): Promise<Buffer> {
    const archivo = this.rutaCache(url);
    if (existsSync(archivo)) {
      this.conteo.cache++;
      return readFileSync(archivo);
    }
    const u = new URL(url);
    const reglas = await this.reglasDe(u.origin);
    if (reglas && !rutaPermitida(reglas, u.pathname + u.search)) {
      throw new Error(`robots.txt de ${u.host} no permite ${u.pathname}`);
    }
    const res = await this.pedir(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    const tipo = res.headers.get("content-type") ?? "";
    const cuerpo = Buffer.from(await res.arrayBuffer());
    if (/text\/html/.test(tipo) && /captcha|are you a robot|access denied/i.test(cuerpo.toString("utf8", 0, 4000))) {
      this.marcarBloqueo(u.host, "CAPTCHA o bloqueo en la respuesta");
    }
    writeFileSync(archivo, cuerpo);
    return cuerpo;
  }
}
