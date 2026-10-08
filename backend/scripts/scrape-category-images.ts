// Descarga una foto por categoría (Unsplash License) para las tarjetas de categoría del
// catálogo. Mismas reglas que scrape-images.ts: robots.txt, 1 solicitud por segundo, User-Agent
// identificable, caché local y sin evasión ante 403/429.
//
//   npx ts-node scripts/scrape-category-images.ts [--elegir=slug:n,slug:n]
//
// Por defecto toma la primera foto de la búsqueda; --elegir cambia cuál (1 a 6) para una categoría
// después de revisar las candidatas. Escribe frontend/public/categorias/{slug}.webp, el manifiesto
// backend/prisma/data/imagenes-categorias-manifest.json y design/imagenes-categorias-origen.csv.
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import sharp from "sharp";
import { ClienteEtico, SitioNoDisponible } from "./lib/cliente-etico";

const RAIZ = resolve(__dirname, "../..");
const SALIDA = join(RAIZ, "frontend/public/categorias");
const MANIFIESTO = join(RAIZ, "backend/prisma/data/imagenes-categorias-manifest.json");
const CSV = join(RAIZ, "design/imagenes-categorias-origen.csv");

// slug de la categoría en la base -> búsqueda en inglés (Unsplash indexa mejor en inglés).
const BUSQUEDAS: Record<string, string> = {
  beauty: "makeup cosmetics",
  fragrances: "perfume bottles",
  furniture: "living room furniture",
  groceries: "fresh groceries",
  "home-decoration": "home decor",
  "kitchen-accessories": "kitchen utensils",
  laptops: "laptop",
  "mens-shirts": "men shirts",
  "mens-shoes": "men shoes",
  "mens-watches": "men wristwatch",
  "mobile-accessories": "phone accessories",
  motorcycle: "motorcycle",
  "skin-care": "skincare",
  smartphones: "smartphone",
  "sports-accessories": "sports equipment",
  sunglasses: "sunglasses",
  tablets: "tablet",
  tops: "women blouse",
  vehicle: "car",
  "womens-bags": "women handbag",
  "womens-dresses": "dress",
  "womens-jewellery": "jewelry earrings",
  "womens-shoes": "women high heels",
  "womens-watches": "women wristwatch",
  Electrodomésticos: "home appliances",
};
const CANDIDATAS = 6;

const elegir: Record<string, number> = {};
for (const par of (process.argv.find((a) => a.startsWith("--elegir="))?.split("=")[1] ?? "").split(",").filter(Boolean)) {
  const [slug, n] = par.split(":");
  elegir[slug] = Number(n);
}

function csv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

async function main() {
  const cliente = new ClienteEtico(join(__dirname, ".cache/http"));
  const ahora = new Date().toISOString();
  mkdirSync(SALIDA, { recursive: true });
  mkdirSync(join(__dirname, ".cache/categorias"), { recursive: true });
  // Se parte del manifiesto existente: las categorías que ya tienen foto (incluidas las que se
  // completaron con la foto de un producto) solo se reemplazan si esta corrida logra la de Unsplash.
  const manifiesto: Record<string, { imageUrl: string; tienda: string; paginaUrl: string; imagenUrl: string; descargadoEn: string }> = existsSync(MANIFIESTO)
    ? JSON.parse(readFileSync(MANIFIESTO, "utf8"))
    : {};
  const vistas = new Set<string>();

  for (const [slug, consulta] of Object.entries(BUSQUEDAS)) {
    let ids: string[] = [];
    try {
      const html = (await cliente.obtener(`https://unsplash.com/s/photos/${encodeURIComponent(consulta.replace(/ /g, "-"))}`)).toString("utf8");
      ids = [...new Set([...html.matchAll(/https:\/\/images\.unsplash\.com\/photo-([a-zA-Z0-9_-]+)/g)].map((m) => m[1]))].slice(0, CANDIDATAS);
    } catch (e) {
      console.warn(`${slug}: ${(e as Error).message}`);
      if (e instanceof SitioNoDisponible) break;
      continue;
    }
    const candidatas: Array<{ id: string; bytes: Buffer }> = [];
    for (const id of ids) {
      try {
        const bytes = await cliente.obtener(`https://images.unsplash.com/photo-${id}?w=800&q=80`);
        const huella = createHash("sha1").update(bytes).digest("hex");
        if (vistas.has(huella)) continue;
        candidatas.push({ id, bytes });
        // Candidatas a revisar a ojo (no se versionan: scripts/.cache está ignorado).
        await sharp(bytes).resize({ width: 400 }).webp({ quality: 70 }).toFile(join(__dirname, `.cache/categorias/${slug}-${candidatas.length}.webp`));
      } catch (e) {
        console.warn(`omitida ${slug} ${id}: ${(e as Error).message}`);
      }
    }
    const idx = Math.min(Math.max((elegir[slug] ?? 1) - 1, 0), candidatas.length - 1);
    const elegida = candidatas[idx];
    if (!elegida) {
      console.warn(`${slug}: sin fotos`);
      continue;
    }
    vistas.add(createHash("sha1").update(elegida.bytes).digest("hex"));
    const archivo = `${slug.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}.webp`;
    await sharp(elegida.bytes).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(SALIDA, archivo));
    manifiesto[slug] = {
      imageUrl: `/categorias/${archivo}`,
      tienda: "Unsplash",
      paginaUrl: `https://unsplash.com/photos/${elegida.id}`,
      imagenUrl: `https://images.unsplash.com/photo-${elegida.id}?w=800&q=80`,
      descargadoEn: ahora,
    };
    console.log(`${slug}: ${archivo} (candidata ${idx + 1} de ${candidatas.length})`);
  }

  writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2) + "\n");
  const filas = Object.entries(manifiesto).map(([slug, f]) => [slug, f.tienda, f.paginaUrl, f.imagenUrl, f.descargadoEn, f.imageUrl].map(csv).join(","));
  writeFileSync(CSV, ["categoria,tiendaOrigen,urlPagina,urlImagenOriginal,fechaDescarga,imagenLocal", ...filas].join("\n") + "\n");
  console.log(`${Object.keys(manifiesto).length} categorías; solicitudes de red ${cliente.conteo.red}, caché ${cliente.conteo.cache}`);
  console.log("Sitios bloqueados:", [...cliente.bloqueados.entries()].map(([h, m]) => `${h}: ${m}`).join("; ") || "ninguno");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
