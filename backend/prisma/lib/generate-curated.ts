import type { ProductSeed } from "./types";

/**
 * Catálogo curado: 4 productos reales de línea blanca/electrónica con imagen
 * real (no generados por DummyJSON/Faker), para que el catálogo se vea como
 * un producto terminado en las capturas de evidencia. Se suman al resto del
 * catálogo sintético sin reemplazarlo (ver seed.ts). Las imágenes están en
 * backend/public/productos-curados/ y se sirven en /media/productos-curados/
 * (backend/src/main.ts). Origen de cada imagen, en docs/imagenes-catalogo.md.
 */
export const CURATED_PRODUCTS: ProductSeed[] = [
  {
    homologatedCode: "CURA-000001",
    name: "Refrigerador French Door 508L Acero Inoxidable",
    category: "Electrodomésticos",
    brand: "Samsung",
    cost: 2150000,
    digitalPrice: 3299900,
    published: true,
    source: "SYNTHETIC",
    imageUrl: "/media/productos-curados/refrigerador.jpg",
  },
  {
    homologatedCode: "CURA-000002",
    name: "Lavadora Carga Frontal 18kg Inverter",
    category: "Electrodomésticos",
    brand: "Whirlpool",
    cost: 1620000,
    digitalPrice: 2459900,
    published: true,
    source: "SYNTHETIC",
    imageUrl: "/media/productos-curados/lavadora.jpg",
  },
  {
    homologatedCode: "CURA-000003",
    name: "Televisor LED 55'' 4K UHD Smart TV",
    category: "Electrodomésticos",
    brand: "LG",
    cost: 1280000,
    digitalPrice: 1899900,
    published: true,
    source: "SYNTHETIC",
    imageUrl: "/media/productos-curados/televisor.jpg",
  },
  {
    homologatedCode: "CURA-000004",
    name: "Licuadora de Vaso 1.5L 700W",
    category: "Electrodomésticos",
    brand: "Oster",
    cost: 118000,
    digitalPrice: 184900,
    published: true,
    source: "SYNTHETIC",
    imageUrl: "/media/productos-curados/licuadora.jpg",
  },
];
