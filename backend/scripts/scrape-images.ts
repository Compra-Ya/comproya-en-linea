// Descarga fotos reales de producto (Alkosto y Ktronix vía sus sitemaps de
// producto públicos, DummyJSON vía su API, y los 4 curados ya existentes),
// las optimiza a WebP (ancho máx. 800 px) y escribe el manifiesto de origen.
//
// Uso:  npx ts-node scripts/scrape-images.ts [--por-grupo=6]
//
// Reglas (ver scripts/lib/cliente-etico.ts): robots.txt, 1 req/s por sitio,
// User-Agent identificable, caché local, y parada sin evasión ante 403/429/CAPTCHA.
// Éxito (VTEX) prohíbe /api/ en su robots.txt y respondió 429, así que no se usa.
import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { createHash } from "crypto";
import sharp from "sharp";
import { ClienteEtico, SitioNoDisponible } from "./lib/cliente-etico";
import type { FuenteImagen, ManifiestoImagenes } from "../prisma/lib/product-images";

const RAIZ = resolve(__dirname, "../..");
const SALIDA = join(RAIZ, "frontend/public/productos");
const MANIFIESTO = join(RAIZ, "backend/prisma/data/imagenes-manifest.json");
const POR_GRUPO = Number(process.argv.find((a) => a.startsWith("--por-grupo="))?.split("=")[1] ?? 6);

// Imagen de reemplazo "IMAGEN NO DISPONIBLE" del CDN de Alkosto (sha1 de los bytes descargados).
const HASHES_PLACEHOLDER = new Set<string>(["765345afcfc490bb56bd1277d78f2b0a1fa5c9d4"]);

interface Regla {
  incluir: RegExp;
  excluir?: RegExp;
}
// Reglas sobre el slug (nombre en la URL) del producto en las tiendas.
const REGLAS: Record<string, Regla> = {
  silla: { incluir: /^silla/, excluir: /(bebe|carro|ruedas-repuesto|cargador|auto)/ },
  computador: { incluir: /^(portatil|computador)/, excluir: /(bolso|funda|base|cargador|maletin|mochila|escritorio)/ },
  mesa: { incluir: /^mesa-(de-)?(comedor|centro|auxiliar|noche|plegable|escritorio|cafe|redonda)/, excluir: /(picnic|infantil|tv|televisor|billar|ping|dj|mezcl|futbol|juguete|bebe)/ },
  guantes: { incluir: /^guantes?/, excluir: /(nitrilo|latex|desechable)/ },
  gorra: { incluir: /(^|-)(gorra|sombrero)(-|$)/ },
  tenis: { incluir: /^(tenis|zapato)/, excluir: /(mesa|raqueta|pelota)/ },
  camiseta: { incluir: /^(camiseta|camisa)/ },
  toallas: { incluir: /^toalla/, excluir: /(humed|papel|cocina)/ },
  mouse: { incluir: /^mouse/, excluir: /(pad)/ },
  bicicleta: { incluir: /^bicicleta/, excluir: /(estatica|spinning|elipt|bebe|ni(n|ñ)o|triciclo|casco|llanta|electric|scooter|moto|recumb|reclin|ergometr|horizontal)/ },
  balon: { incluir: /^balon-(de-)?(futbol|baloncesto|basquet|voleibol|microfutbol|rugby|golty|fut)/, excluir: /(bomba|inflador|malla)/ },
  teclado: { incluir: /^teclado/, excluir: /(piano|musical|yamaha|casio|psr|arranger|organo|tablet|ipad|funda|case|estuche|magic)/ },
};

const TIENDAS = [
  { nombre: "Alkosto", origen: "https://www.alkosto.com", cacheSitemap: "alkosto-sitemap.xml" },
  { nombre: "Ktronix", origen: "https://www.ktronix.com", cacheSitemap: "ktronix-sitemap.xml" },
] as const;

interface EntradaSitemap {
  tienda: string;
  slug: string;
  pagina: string;
  imagen: string;
}

function leerSitemap(tienda: (typeof TIENDAS)[number], cliente: ClienteEtico): Promise<EntradaSitemap[]> {
  return cliente.obtener(`${tienda.origen}/sitemap-productos.xml`).then((buf) => {
    const xml = buf.toString("utf8");
    const out: EntradaSitemap[] = [];
    for (const bloque of xml.split("<url>").slice(1)) {
      const pagina = /<loc>(.*?)<\/loc>/.exec(bloque)?.[1];
      const imagen = /<image:loc>(.*?)<\/image:loc>/.exec(bloque)?.[1];
      const slug = pagina ? new URL(pagina).pathname.split("/")[1] : undefined;
      if (pagina && imagen && slug) out.push({ tienda: tienda.nombre, slug, pagina, imagen });
    }
    return out;
  });
}

/** Reparte la elección a lo largo de la lista para no tomar solo una marca. */
function espaciar<T>(lista: T[], n: number): T[] {
  if (lista.length <= n) return lista;
  return Array.from({ length: n }, (_, i) => lista[Math.floor((i * lista.length) / n)]);
}

async function aWebp(bytes: Buffer, destino: string) {
  mkdirSync(join(destino, ".."), { recursive: true });
  await sharp(bytes).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80 }).toFile(destino);
}

async function main() {
  const cliente = new ClienteEtico(join(__dirname, ".cache/http"));
  const ahora = new Date().toISOString();
  const manifiesto: ManifiestoImagenes = { generadoEn: ahora, grupos: {}, dummyjson: {}, curados: {} };
  const nota: string[] = [];

  // 1) Retail colombiano (sitemaps de producto: permitidos por robots.txt).
  const entradas: EntradaSitemap[] = [];
  for (const t of TIENDAS) {
    try {
      entradas.push(...(await leerSitemap(t, cliente)));
    } catch (e) {
      if (e instanceof SitioNoDisponible) nota.push(`${t.nombre}: ${e.motivo}`);
      else throw e;
    }
  }
  const vistos = new Set<string>();
  for (const [grupo, regla] of Object.entries(REGLAS)) {
    const candidatos = entradas.filter((e) => regla.incluir.test(e.slug) && !(regla.excluir?.test(e.slug) ?? false));
    // Mitad y mitad entre tiendas cuando ambas tienen candidatos.
    const porTienda = TIENDAS.map((t) => candidatos.filter((c) => c.tienda === t.nombre));
    const elegidos = porTienda.flatMap((l) => espaciar(l, Math.ceil(POR_GRUPO / porTienda.filter((x) => x.length).length || 1))).slice(0, POR_GRUPO);
    manifiesto.grupos[grupo] = [];
    let n = 0;
    for (const c of elegidos) {
      const urlImg = c.imagen.replace(/\?w=\d+/, "?w=800");
      try {
        const bytes = await cliente.obtener(urlImg);
        const huella = createHash("sha1").update(bytes).digest("hex");
        if (HASHES_PLACEHOLDER.has(huella) || vistos.has(huella)) {
          console.warn(`omitida (imagen de reemplazo o repetida): ${c.pagina}`);
          continue;
        }
        vistos.add(huella);
        n++;
        const nombre = `${grupo}-${String(n).padStart(2, "0")}.webp`;
        await aWebp(bytes, join(SALIDA, "retail", nombre));
        manifiesto.grupos[grupo].push({
          imageUrl: `/productos/retail/${nombre}`,
          tienda: c.tienda,
          paginaUrl: c.pagina,
          imagenUrl: c.imagen,
          descargadoEn: ahora,
        });
      } catch (e) {
        if (e instanceof SitioNoDisponible) nota.push(`${c.tienda}: ${e.motivo}`);
        console.warn(`omitida ${c.pagina}: ${(e as Error).message}`);
      }
    }
    console.log(`${grupo}: ${manifiesto.grupos[grupo].length} fotos (${candidatos.length} candidatos)`);
  }

  // 2) DummyJSON: la foto oficial de cada producto, guardada en local.
  const lista = JSON.parse(
    (await cliente.obtener("https://dummyjson.com/products?limit=0&select=id,title,thumbnail")).toString("utf8")
  ).products as Array<{ id: number; title: string; thumbnail: string }>;
  for (const d of lista) {
    try {
      const bytes = await cliente.obtener(d.thumbnail);
      await aWebp(bytes, join(SALIDA, "dummyjson", `${d.id}.webp`));
      manifiesto.dummyjson[d.title] = {
        imageUrl: `/productos/dummyjson/${d.id}.webp`,
        tienda: "DummyJSON",
        paginaUrl: `https://dummyjson.com/products/${d.id}`,
        imagenUrl: d.thumbnail,
        descargadoEn: ahora,
      };
    } catch (e) {
      console.warn(`dummyjson ${d.id}: ${(e as Error).message}`);
    }
  }
  console.log(`dummyjson: ${Object.keys(manifiesto.dummyjson).length} de ${lista.length}`);

  // 3) Curados (Unsplash, ya descargados antes; se pasan a WebP).
  const curados: Array<[string, string, string]> = [
    ["CURA-000001", "refrigerador", "https://unsplash.com/photos/1588854337115-1c67d9247e4d"],
    ["CURA-000002", "lavadora", "https://unsplash.com/photos/1626806787461-102c1bfaaea1"],
    ["CURA-000003", "televisor", "https://unsplash.com/photos/1595935736128-db1f0a261263"],
    ["CURA-000004", "licuadora", "https://unsplash.com/photos/1585237672814-8f85a8118bf6"],
  ];
  for (const [codigo, archivo, url] of curados) {
    const origen = join(RAIZ, `backend/public/productos-curados/${archivo}.jpg`);
    if (!existsSync(origen)) continue;
    const fecha = execSync(`git log --diff-filter=A --format=%aI -1 -- "backend/public/productos-curados/${archivo}.jpg"`, { cwd: RAIZ })
      .toString()
      .trim();
    await aWebp(readFileSync(origen), join(SALIDA, "curados", `${archivo}.webp`));
    manifiesto.curados[codigo] = {
      imageUrl: `/productos/curados/${archivo}.webp`,
      tienda: "Unsplash",
      paginaUrl: url,
      imagenUrl: url,
      descargadoEn: fecha || ahora,
    };
  }

  mkdirSync(join(MANIFIESTO, ".."), { recursive: true });
  writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2) + "\n");
  console.log(`Solicitudes de red: ${cliente.conteo.red}, desde caché: ${cliente.conteo.cache}`);
  const bloqueos = [...cliente.bloqueados.entries()].map(([h, m]) => `${h}: ${m}`);
  console.log("Sitios bloqueados:", bloqueos.length ? bloqueos.join("; ") : "ninguno");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
