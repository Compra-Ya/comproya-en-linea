// Traducción al español de los nombres de producto de la siembra (Cliente digital: "todo en
// español"). Dos fuentes:
//  - DummyJSON: títulos reales en inglés -> mapa explícito (las marcas y modelos se conservan).
//  - Sintéticos (Faker): "{Adjetivo} {Material} {Sustantivo}" -> "{Sustantivo} de {material} {adjetivo}"
//    con concordancia de género y número (lista cerrada de 27 adjetivos, 15 materiales, 25 sustantivos).
// Idempotente: un nombre ya traducido (o que no se reconoce) se devuelve igual.

type Genero = "m" | "f";

const SUSTANTIVOS: Record<string, { nombre: string; genero: Genero; plural?: boolean }> = {
  Chair: { nombre: "Silla", genero: "f" },
  Computer: { nombre: "Computador", genero: "m" },
  Table: { nombre: "Mesa", genero: "f" },
  Gloves: { nombre: "Guantes", genero: "m", plural: true },
  Pants: { nombre: "Pantalón", genero: "m" },
  Hat: { nombre: "Gorra", genero: "f" },
  Shoes: { nombre: "Zapatos", genero: "m", plural: true },
  Shirt: { nombre: "Camisa", genero: "f" },
  Towels: { nombre: "Toallas", genero: "f", plural: true },
  Mouse: { nombre: "Mouse", genero: "m" },
  Bike: { nombre: "Bicicleta", genero: "f" },
  Ball: { nombre: "Balón", genero: "m" },
  Keyboard: { nombre: "Teclado", genero: "m" },
  Soap: { nombre: "Jabón", genero: "m" },
  Car: { nombre: "Carro", genero: "m" },
  Sausages: { nombre: "Salchichas", genero: "f", plural: true },
  Salad: { nombre: "Ensalada", genero: "f" },
  Tuna: { nombre: "Atún", genero: "m" },
  Fish: { nombre: "Pescado", genero: "m" },
  Pizza: { nombre: "Pizza", genero: "f" },
  Bacon: { nombre: "Tocino", genero: "m" },
  Chicken: { nombre: "Pollo", genero: "m" },
  Chips: { nombre: "Papas fritas", genero: "f", plural: true },
  Cheese: { nombre: "Queso", genero: "m" },
};

// [masculino, femenino]
const ADJETIVOS: Record<string, [string, string]> = {
  Handmade: ["hecho a mano", "hecha a mano"],
  Modern: ["moderno", "moderna"],
  Oriental: ["oriental", "oriental"],
  Electronic: ["electrónico", "electrónica"],
  Refined: ["refinado", "refinada"],
  Bespoke: ["a la medida", "a la medida"],
  Rustic: ["rústico", "rústica"],
  Fresh: ["fresco", "fresca"],
  Soft: ["suave", "suave"],
  Ergonomic: ["ergonómico", "ergonómica"],
  Incredible: ["increíble", "increíble"],
  Intelligent: ["inteligente", "inteligente"],
  Licensed: ["licenciado", "licenciada"],
  Unbranded: ["sin marca", "sin marca"],
  Frozen: ["congelado", "congelada"],
  Recycled: ["reciclado", "reciclada"],
  Luxurious: ["de lujo", "de lujo"],
  Fantastic: ["fantástico", "fantástica"],
  Sleek: ["elegante", "elegante"],
  Small: ["pequeño", "pequeña"],
  Awesome: ["genial", "genial"],
  Tasty: ["delicioso", "deliciosa"],
  Gorgeous: ["precioso", "preciosa"],
  Practical: ["práctico", "práctica"],
  Elegant: ["elegante", "elegante"],
  Handcrafted: ["artesanal", "artesanal"],
  Generic: ["genérico", "genérica"],
};

const MATERIALES: Record<string, string> = {
  Gold: "oro",
  Marble: "mármol",
  Plastic: "plástico",
  Ceramic: "cerámica",
  Bamboo: "bambú",
  Wooden: "madera",
  Silk: "seda",
  Metal: "metal",
  Concrete: "concreto",
  Rubber: "caucho",
  Aluminum: "aluminio",
  Granite: "granito",
  Bronze: "bronce",
  Steel: "acero",
  Cotton: "algodón",
};

/** Plural del adjetivo: "hecho a mano" -> "hechos a mano"; frases invariables se dejan igual. */
function pluralizar(adjetivo: string): string {
  const [primera, ...resto] = adjetivo.split(" ");
  if (resto.length > 0) return /^hech[oa]$/.test(primera) ? [`${primera}s`, ...resto].join(" ") : adjetivo;
  return /[aeiouáéíóú]$/.test(adjetivo) ? `${adjetivo}s` : `${adjetivo}es`;
}

function traducirSintetico(nombre: string): string | null {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length !== 3) return null;
  const [adj, mat, sus] = partes;
  const sustantivo = SUSTANTIVOS[sus];
  const adjetivo = ADJETIVOS[adj];
  const material = MATERIALES[mat];
  if (!sustantivo || !adjetivo || !material) return null;
  const concordado = adjetivo[sustantivo.genero === "m" ? 0 : 1];
  return `${sustantivo.nombre} de ${material} ${sustantivo.plural ? pluralizar(concordado) : concordado}`;
}

// Títulos de DummyJSON. Las marcas y los modelos se conservan ("Apple AirPods Max", "Rolex Datejust").
const DUMMYJSON: Record<string, string> = {
  "Essence Mascara Lash Princess": "Máscara de pestañas Essence Lash Princess",
  "Eyeshadow Palette with Mirror": "Paleta de sombras con espejo",
  "Powder Canister": "Polvo compacto en frasco",
  "Red Lipstick": "Labial rojo",
  "Red Nail Polish": "Esmalte de uñas rojo",
  "Chanel Coco Noir Eau De": "Chanel Coco Noir Eau de Parfum",
  "Dolce Shine Eau de": "Dolce Shine Eau de Parfum",
  "Gucci Bloom Eau de": "Gucci Bloom Eau de Parfum",
  "Annibale Colombo Bed": "Cama Annibale Colombo",
  "Annibale Colombo Sofa": "Sofá Annibale Colombo",
  "Bedside Table African Cherry": "Mesa de noche en cerezo africano",
  "Knoll Saarinen Executive Conference Chair": "Silla ejecutiva de conferencias Knoll Saarinen",
  "Wooden Bathroom Sink With Mirror": "Lavamanos de madera con espejo",
  Apple: "Manzana",
  "Beef Steak": "Bistec de res",
  "Cat Food": "Alimento para gatos",
  "Chicken Meat": "Carne de pollo",
  "Cooking Oil": "Aceite de cocina",
  Cucumber: "Pepino",
  "Dog Food": "Alimento para perros",
  Eggs: "Huevos",
  "Fish Steak": "Filete de pescado",
  "Green Bell Pepper": "Pimentón verde",
  "Green Chili Pepper": "Ají verde",
  "Honey Jar": "Frasco de miel",
  "Ice Cream": "Helado",
  Juice: "Jugo",
  Lemon: "Limón",
  Milk: "Leche",
  Mulberry: "Mora",
  "Nescafe Coffee": "Café Nescafé",
  Potatoes: "Papas",
  "Protein Powder": "Proteína en polvo",
  "Red Onions": "Cebolla roja",
  Rice: "Arroz",
  "Soft Drinks": "Gaseosas",
  Strawberry: "Fresa",
  "Tissue Paper Box": "Caja de pañuelos",
  Water: "Agua",
  "Decoration Swing": "Columpio decorativo",
  "Family Tree Photo Frame": "Marco de fotos árbol genealógico",
  "House Showpiece Plant": "Planta decorativa",
  "Plant Pot": "Matera",
  "Table Lamp": "Lámpara de mesa",
  "Bamboo Spatula": "Espátula de bambú",
  "Black Aluminium Cup": "Taza de aluminio negra",
  "Black Whisk": "Batidor negro",
  "Boxed Blender": "Licuadora en caja",
  "Carbon Steel Wok": "Wok de acero al carbono",
  "Chopping Board": "Tabla de picar",
  "Citrus Squeezer Yellow": "Exprimidor de cítricos amarillo",
  "Egg Slicer": "Cortador de huevo",
  "Electric Stove": "Estufa eléctrica",
  "Fine Mesh Strainer": "Colador de malla fina",
  Fork: "Tenedor",
  Glass: "Vaso",
  "Grater Black": "Rallador negro",
  "Hand Blender": "Licuadora de mano",
  "Ice Cube Tray": "Bandeja para hielo",
  "Kitchen Sieve": "Cernidor de cocina",
  Knife: "Cuchillo",
  "Lunch Box": "Lonchera",
  "Microwave Oven": "Horno microondas",
  "Mug Tree Stand": "Soporte para tazas",
  Pan: "Sartén",
  Plate: "Plato",
  "Red Tongs": "Pinzas rojas",
  "Silver Pot With Glass Cap": "Olla plateada con tapa de vidrio",
  "Slotted Turner": "Espátula perforada",
  "Spice Rack": "Especiero",
  Spoon: "Cuchara",
  Tray: "Bandeja",
  "Wooden Rolling Pin": "Rodillo de madera",
  "Yellow Peeler": "Pelador amarillo",
  "Apple MacBook Pro 14 Inch Space Grey": "Apple MacBook Pro 14 pulgadas gris espacial",
  "Asus Zenbook Pro Dual Screen Laptop": "Portátil Asus Zenbook Pro de doble pantalla",
  "New DELL XPS 13 9300 Laptop": "Portátil Dell XPS 13 9300 nuevo",
  "Blue & Black Check Shirt": "Camisa de cuadros azul y negra",
  "Gigabyte Aorus Men Tshirt": "Camiseta Gigabyte Aorus para hombre",
  "Man Plaid Shirt": "Camisa escocesa de hombre",
  "Man Short Sleeve Shirt": "Camisa de manga corta de hombre",
  "Men Check Shirt": "Camisa de cuadros de hombre",
  "Nike Air Jordan 1 Red And Black": "Nike Air Jordan 1 rojo y negro",
  "Nike Baseball Cleats": "Guayos de béisbol Nike",
  "Puma Future Rider Trainers": "Tenis Puma Future Rider",
  "Sports Sneakers Off White & Red": "Tenis deportivos blanco hueso y rojo",
  "Sports Sneakers Off White Red": "Tenis deportivos blanco hueso con rojo",
  "Brown Leather Belt Watch": "Reloj con correa de cuero café",
  "Rolex Cellini Date Black Dial": "Rolex Cellini Date esfera negra",
  "Rolex Submariner Watch": "Reloj Rolex Submariner",
  "Apple AirPods Max Silver": "Apple AirPods Max plata",
  "Apple Airpower Wireless Charger": "Cargador inalámbrico Apple AirPower",
  "Apple HomePod Mini Cosmic Grey": "Apple HomePod Mini gris cósmico",
  "Apple iPhone Charger": "Cargador de iPhone Apple",
  "Apple MagSafe Battery Pack": "Batería externa Apple MagSafe",
  "Apple Watch Series 4 Gold": "Apple Watch Series 4 dorado",
  "Beats Flex Wireless Earphones": "Audífonos inalámbricos Beats Flex",
  "iPhone 12 Silicone Case with MagSafe Plum": "Funda de silicona con MagSafe para iPhone 12, color ciruela",
  Monopod: "Monopié",
  "Selfie Lamp with iPhone": "Lámpara para selfis con iPhone",
  "Selfie Stick Monopod": "Palo de selfi monopié",
  "TV Studio Camera Pedestal": "Pedestal de cámara de estudio de TV",
  "Generic Motorcycle": "Motocicleta genérica",
  "Scooter Motorcycle": "Moto scooter",
  "Sportbike Motorcycle": "Moto deportiva",
  "Attitude Super Leaves Hand Soap": "Jabón de manos Attitude Super Leaves",
  "Olay Ultra Moisture Shea Butter Body Wash": "Jabón líquido corporal Olay Ultra Moisture con manteca de karité",
  "Vaseline Men Body and Face Lotion": "Loción corporal y facial Vaseline Men",
  "American Football": "Balón de fútbol americano",
  "Baseball Ball": "Pelota de béisbol",
  "Baseball Glove": "Guante de béisbol",
  Basketball: "Balón de baloncesto",
  "Basketball Rim": "Aro de baloncesto",
  "Cricket Ball": "Pelota de críquet",
  "Cricket Bat": "Bate de críquet",
  "Cricket Helmet": "Casco de críquet",
  "Cricket Wicket": "Palos de críquet",
  "Feather Shuttlecock": "Gallito de bádminton de plumas",
  Football: "Balón de fútbol",
  "Golf Ball": "Pelota de golf",
  "Iron Golf": "Palo de golf (hierro)",
  "Metal Baseball Bat": "Bate de béisbol de metal",
  "Tennis Ball": "Pelota de tenis",
  "Tennis Racket": "Raqueta de tenis",
  Volleyball: "Balón de voleibol",
  "Black Sun Glasses": "Gafas de sol negras",
  "Classic Sun Glasses": "Gafas de sol clásicas",
  "Green and Black Glasses": "Gafas verdes y negras",
  "Party Glasses": "Gafas de fiesta",
  Sunglasses: "Gafas de sol",
  "iPad Mini 2021 Starlight": "iPad Mini 2021 luz estelar",
  "Samsung Galaxy Tab S8 Plus Grey": "Samsung Galaxy Tab S8 Plus gris",
  "Samsung Galaxy Tab White": "Samsung Galaxy Tab blanca",
  "Blue Frock": "Vestido azul",
  "Girl Summer Dress": "Vestido de verano para niña",
  "Gray Dress": "Vestido gris",
  "Short Frock": "Vestido corto",
  "Tartan Dress": "Vestido escocés",
  "Blue Women's Handbag": "Bolso azul de mujer",
  "Heshe Women's Leather Bag": "Bolso de cuero Heshe para mujer",
  "Prada Women Bag": "Bolso Prada para mujer",
  "White Faux Leather Backpack": "Morral de cuero sintético blanco",
  "Women Handbag Black": "Bolso negro de mujer",
  "Black Women's Gown": "Vestido largo negro de mujer",
  "Corset Leather With Skirt": "Corsé de cuero con falda",
  "Corset With Black Skirt": "Corsé con falda negra",
  "Dress Pea": "Vestido verde guisante",
  "Marni Red & Black Suit": "Traje Marni rojo y negro",
  "Green Crystal Earring": "Aretes de cristal verde",
  "Green Oval Earring": "Aretes ovalados verdes",
  "Tropical Earring": "Aretes tropicales",
  "Black & Brown Slipper": "Pantuflas negras y cafés",
  "Calvin Klein Heel Shoes": "Zapatos de tacón Calvin Klein",
  "Golden Shoes Woman": "Zapatos dorados de mujer",
  "Pampi Shoes": "Zapatos Pampi",
  "Red Shoes": "Zapatos rojos",
  "IWC Ingenieur Automatic Steel": "IWC Ingenieur Automatic de acero",
  "Rolex Datejust Women": "Rolex Datejust para mujer",
  "Watch Gold for Women": "Reloj dorado para mujer",
  "Women's Wrist Watch": "Reloj de pulsera para mujer",
};

/** Nombre de producto en español; si ya está en español o no se reconoce, se devuelve igual. */
export function traducirNombre(nombre: string): string {
  return DUMMYJSON[nombre] ?? traducirSintetico(nombre) ?? nombre;
}

export interface ResultadoTraduccion {
  evaluados: number;
  cambiados: number;
  sinCambio: number;
}

/**
 * Traduce products.name. Agrupa por nombre para hacer una actualización por nombre distinto.
 * Debe correr DESPUÉS de aplicar las imágenes en una base recién sembrada (aplicarImagenes
 * entiende nombres en español, pero el orden evita depender de eso).
 */
export async function traducirNombresDeProductos(
  prisma: {
    product: {
      findMany: (a: { select: { name: true }; distinct: ["name"] }) => Promise<Array<{ name: string }>>;
      updateMany: (a: { where: { name: string }; data: { name: string } }) => Promise<{ count: number }>;
    };
  },
  dryRun = false
): Promise<ResultadoTraduccion> {
  const nombres = await prisma.product.findMany({ select: { name: true }, distinct: ["name"] });
  const res: ResultadoTraduccion = { evaluados: nombres.length, cambiados: 0, sinCambio: 0 };
  for (const { name } of nombres) {
    const nuevo = traducirNombre(name);
    if (nuevo === name) {
      res.sinCambio++;
      continue;
    }
    if (!dryRun) await prisma.product.updateMany({ where: { name }, data: { name: nuevo } });
    res.cambiados++;
  }
  return res;
}
