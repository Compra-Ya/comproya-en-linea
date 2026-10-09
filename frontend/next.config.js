/** @type {import('next').NextConfig} */
const nextConfig = {
  // Salida ligera para Cloud Run (ver Dockerfile).
  output: "standalone",
  reactStrictMode: true,
  // "Mi cuenta" de la cabecera y del pie: por ahora es la pantalla de privacidad y consentimiento.
  async redirects() {
    return [{ source: "/cuenta", destination: "/privacidad", permanent: false }];
  },
  // Proyecto académico: bloquear la indexación del sitio desplegado.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

module.exports = nextConfig;
