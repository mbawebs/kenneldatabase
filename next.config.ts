import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite probar el servidor de desarrollo desde otros dispositivos
  // en la misma red (celular, otra compu) usando la IP local en vez
  // de localhost. Sin esto, Next.js bloquea la conexion HMR desde ese
  // origen y la pagina queda "muerta" (se ve pero no reacciona a clics).
  allowedDevOrigins: ["192.168.100.6"],
};

export default nextConfig;
