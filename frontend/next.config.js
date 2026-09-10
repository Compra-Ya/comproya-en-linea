/** @type {import('next').NextConfig} */
const nextConfig = {
  // Salida ligera para Cloud Run (ver Dockerfile).
  output: "standalone",
  reactStrictMode: true,
};

module.exports = nextConfig;
