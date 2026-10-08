import type { MetadataRoute } from "next";

// Proyecto académico: se bloquea todo el sitio desplegado.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
