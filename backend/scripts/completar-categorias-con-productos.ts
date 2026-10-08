// Completa las categorías que no lograron foto de Unsplash con la foto de un producto
// representativo de esa categoría (ya descargada y con su origen en imagenes-manifest.json).
// Idempotente: solo toca categorías sin entrada. Cuando scrape-category-images.ts logre la foto
// de Unsplash, la reemplaza.
//   npx ts-node scripts/completar-categorias-con-productos.ts
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const RAIZ = resolve(__dirname, "../..");
const MANIFIESTO_CAT = join(RAIZ, "backend/prisma/data/imagenes-categorias-manifest.json");
const MANIFIESTO_PROD = join(RAIZ, "backend/prisma/data/imagenes-manifest.json");
const CSV = join(RAIZ, "design/imagenes-categorias-origen.csv");

// categoría -> título del producto de DummyJSON (o código de producto curado) que la representa.
const REPRESENTANTES: Record<string, { dummy?: string; curado?: string }> = {
  "sports-accessories": { dummy: "Basketball" },
  sunglasses: { dummy: "Classic Sun Glasses" },
  tablets: { dummy: "iPad Mini 2021 Starlight" },
  tops: { dummy: "Gray Dress" },
  vehicle: { dummy: "Dodge Hornet GT Plus" },
  "womens-bags": { dummy: "Prada Women Bag" },
  "womens-dresses": { dummy: "Black Women's Gown" },
  "womens-jewellery": { dummy: "Green Crystal Earring" },
  "womens-shoes": { dummy: "Red Shoes" },
  "womens-watches": { dummy: "Rolex Datejust Women" },
  Electrodomésticos: { curado: "CURA-000001" },
};

type Fuente = { imageUrl: string; tienda: string; paginaUrl: string; imagenUrl: string; descargadoEn: string };
const cat: Record<string, Fuente> = existsSync(MANIFIESTO_CAT) ? JSON.parse(readFileSync(MANIFIESTO_CAT, "utf8")) : {};
const prod = JSON.parse(readFileSync(MANIFIESTO_PROD, "utf8")) as { dummyjson: Record<string, Fuente>; curados: Record<string, Fuente> };
const csv = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

for (const [slug, rep] of Object.entries(REPRESENTANTES)) {
  if (cat[slug]) continue;
  const f = rep.dummy ? prod.dummyjson[rep.dummy] : prod.curados[rep.curado!];
  if (!f) {
    console.warn(`${slug}: no hay foto del producto representante`);
    continue;
  }
  const archivo = `${slug.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}.webp`;
  copyFileSync(join(RAIZ, "frontend/public", f.imageUrl), join(RAIZ, "frontend/public/categorias", archivo));
  cat[slug] = { ...f, imageUrl: `/categorias/${archivo}` };
  console.log(`${slug}: foto del producto representante (${f.tienda})`);
}
writeFileSync(MANIFIESTO_CAT, JSON.stringify(cat, null, 2) + "\n");
const filas = Object.entries(cat).map(([slug, f]) => [slug, f.tienda, f.paginaUrl, f.imagenUrl, f.descargadoEn, f.imageUrl].map(csv).join(","));
writeFileSync(CSV, ["categoria,tiendaOrigen,urlPagina,urlImagenOriginal,fechaDescarga,imagenLocal", ...filas].join("\n") + "\n");
console.log(`${Object.keys(cat).length} categorías con foto`);
