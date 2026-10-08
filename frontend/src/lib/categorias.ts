// Nombre, descripción y foto de cada categoría para mostrar al Cliente digital.
// La base guarda el identificador de la fuente en inglés ("mens-shirts"); aquí se traduce a la
// pantalla sin tocar los datos. Las fotos están en public/categorias/ y su origen en
// design/imagenes-categorias-origen.csv.

export interface InfoCategoria {
  nombre: string;
  descripcion: string;
  /** Ruta pública de la foto, o null si la categoría no tiene. */
  imagen: string | null;
}

const CATEGORIAS: Record<string, InfoCategoria> = {
  beauty: { nombre: "Belleza", descripcion: "Maquillaje y accesorios para tu rutina de belleza.", imagen: "/categorias/beauty.webp" },
  fragrances: { nombre: "Fragancias", descripcion: "Perfumes y aguas de colonia para hombre y mujer.", imagen: "/categorias/fragrances.webp" },
  furniture: { nombre: "Muebles", descripcion: "Camas, sofás, mesas y sillas para cada espacio.", imagen: "/categorias/furniture.webp" },
  groceries: { nombre: "Alimentos y bebidas", descripcion: "Frutas, verduras, carnes, lácteos, despensa y bebidas.", imagen: "/categorias/groceries.webp" },
  "home-decoration": { nombre: "Decoración del hogar", descripcion: "Lámparas, marcos, plantas, toallas y detalles para tu casa.", imagen: "/categorias/home-decoration.webp" },
  "kitchen-accessories": { nombre: "Utensilios de cocina", descripcion: "Ollas, sartenes, cuchillos, licuadoras y todo para cocinar.", imagen: "/categorias/kitchen-accessories.webp" },
  laptops: { nombre: "Portátiles", descripcion: "Portátiles, computadores, teclados y mouse para estudiar y trabajar.", imagen: "/categorias/laptops.webp" },
  "mens-shirts": { nombre: "Ropa de hombre", descripcion: "Camisas, camisetas, gorras y pantalones de hombre.", imagen: "/categorias/mens-shirts.webp" },
  "mens-shoes": { nombre: "Calzado de hombre", descripcion: "Tenis deportivos y zapatos de hombre.", imagen: "/categorias/mens-shoes.webp" },
  "mens-watches": { nombre: "Relojes de hombre", descripcion: "Relojes clásicos y deportivos para hombre.", imagen: "/categorias/mens-watches.webp" },
  "mobile-accessories": { nombre: "Accesorios para celular", descripcion: "Cargadores, audífonos, fundas y más para tu celular.", imagen: "/categorias/mobile-accessories.webp" },
  motorcycle: { nombre: "Motos", descripcion: "Motocicletas deportivas y de ciudad.", imagen: "/categorias/motorcycle.webp" },
  "skin-care": { nombre: "Cuidado de la piel", descripcion: "Jabones, lociones y cremas para el cuidado diario.", imagen: "/categorias/skin-care.webp" },
  smartphones: { nombre: "Celulares", descripcion: "Teléfonos inteligentes de las principales marcas.", imagen: "/categorias/smartphones.webp" },
  "sports-accessories": { nombre: "Artículos deportivos", descripcion: "Balones, bicicletas, guantes, raquetas y equipo para hacer deporte.", imagen: "/categorias/sports-accessories.webp" },
  sunglasses: { nombre: "Gafas de sol", descripcion: "Gafas de sol clásicas y de moda.", imagen: "/categorias/sunglasses.webp" },
  tablets: { nombre: "Tabletas", descripcion: "Tabletas para leer, ver contenido y trabajar.", imagen: "/categorias/tablets.webp" },
  tops: { nombre: "Moda casual de mujer", descripcion: "Vestidos y prendas ligeras para el día a día.", imagen: "/categorias/tops.webp" },
  vehicle: { nombre: "Carros", descripcion: "Carros de distintas marcas y modelos.", imagen: "/categorias/vehicle.webp" },
  "womens-bags": { nombre: "Bolsos de mujer", descripcion: "Bolsos, carteras y morrales para mujer.", imagen: "/categorias/womens-bags.webp" },
  "womens-dresses": { nombre: "Vestidos y trajes de mujer", descripcion: "Vestidos largos, corsés, faldas y trajes de ocasión.", imagen: "/categorias/womens-dresses.webp" },
  "womens-jewellery": { nombre: "Joyería de mujer", descripcion: "Aretes y accesorios para complementar tu estilo.", imagen: "/categorias/womens-jewellery.webp" },
  "womens-shoes": { nombre: "Calzado de mujer", descripcion: "Zapatos de tacón, sandalias y calzado casual de mujer.", imagen: "/categorias/womens-shoes.webp" },
  "womens-watches": { nombre: "Relojes de mujer", descripcion: "Relojes elegantes y de uso diario para mujer.", imagen: "/categorias/womens-watches.webp" },
  Electrodomésticos: { nombre: "Electrodomésticos", descripcion: "Línea blanca, televisores y pequeños electrodomésticos.", imagen: "/categorias/electrodomesticos.webp" },
};

/** Información de pantalla de una categoría; si no se conoce, usa el nombre tal cual y sin foto. */
export function infoCategoria(nombre: string | undefined): InfoCategoria {
  if (!nombre) return { nombre: "", descripcion: "", imagen: null };
  return CATEGORIAS[nombre] ?? { nombre, descripcion: "", imagen: null };
}
