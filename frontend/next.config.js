/** @type {import('next').NextConfig} */
const nextConfig = {
  // Salida ligera para Cloud Run (ver Dockerfile).
  output: "standalone",
  reactStrictMode: true,
  // Proyecto académico: bloquear la indexación del sitio desplegado.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

module.exports = nextConfig;
