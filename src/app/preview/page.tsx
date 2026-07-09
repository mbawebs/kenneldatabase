"use client";

import { useEffect, useState } from "react";
import KennelLandingView from "@/components/kennel-landing/KennelLandingView";
import type { Breeding, Dog, Kennel } from "@/lib/supabase/types";

interface PreviewPayload {
  kennel: Kennel;
  dogs: Dog[];
  breedings: Breeding[];
}

// Receptor de la vista previa en vivo del dashboard: no hace fetch de
// nada, solo escucha postMessage desde la pestaña/iframe padre (mismo
// origen) y renderiza KennelLandingView con esos datos, incluyendo
// cambios todavia sin guardar. Vive en un iframe real para que los
// breakpoints responsivos (sm:/md:/lg:) se calculen contra el ancho
// real del panel de preview, no contra el del navegador completo.
export default function PreviewPage() {
  const [data, setData] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "kennel-dashboard-preview") return;
      setData(e.data.payload);
    }
    window.addEventListener("message", handleMessage);
    // Avisa al padre que ya puede mandar datos (por si el primer
    // mensaje se mando antes de que este listener existiera).
    window.parent.postMessage(
      { type: "kennel-dashboard-preview-ready" },
      window.location.origin
    );
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="text-sm text-ink-text-dim">Loading preview...</p>
      </div>
    );
  }

  return (
    <KennelLandingView
      kennel={data.kennel}
      dogs={data.dogs}
      breedings={data.breedings}
    />
  );
}
