import { headers } from "next/headers";

// Arma el origin real (protocolo + host) a partir de la request
// actual, para poder construir links absolutos (ej. el link publico
// de un kennel) sin hardcodear el dominio ni depender de
// window.location en el cliente.
export async function getPublicOrigin() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return host ? `${protocol}://${host}` : "";
}
