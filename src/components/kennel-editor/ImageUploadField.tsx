"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "kennel-media";

// Slot de foto unica (logo, portada): un cuadro grande con preview
// inmediato, no un input de archivo generico. "square" para logo,
// "wide" para portada (16:9). Controlado (value/onChange) para que el
// formulario padre sepa de cada cambio al instante (vista previa en
// vivo), no solo al guardar.
export default function ImageUploadField({
  name,
  label,
  kennelId,
  folder,
  value,
  onChange,
  aspect = "square",
  hint,
  position,
  onPositionChange,
}: {
  name: string;
  label: string;
  kennelId: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide" | "tall" | "banner";
  hint?: string;
  // Cuando se pasan ambos (solo tiene sentido para aspect="wide"), la
  // foto ya subida se puede arrastrar verticalmente para elegir que
  // parte se recorta, al estilo portada de Facebook. "position" es el
  // % Y de object-position (0 = se ve arriba, 100 = se ve abajo).
  position?: number;
  onPositionChange?: (position: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{ startY: number; startPosition: number } | null>(
    null
  );
  const canReposition =
    aspect === "wide" && Boolean(value) && onPositionChange !== undefined;

  // Se leen por ref (no por closure) dentro del listener nativo de abajo,
  // para no tener que desmontar/remontar los listeners de touch cada vez
  // que la posicion cambia a medio arrastre.
  const positionRef = useRef(position ?? 0);
  useEffect(() => {
    positionRef.current = position ?? 0;
  }, [position]);
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  // Mouse (desktop): un solo puntero, funciona bien tal cual. En touch
  // (celular), un solo dedo se ignora aqui a proposito — lo maneja el
  // effect de abajo, que solo reacciona a DOS dedos.
  function handleRepositionPointerDown(e: React.PointerEvent<HTMLImageElement>) {
    if (!canReposition || e.pointerType !== "mouse") return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startY: e.clientY, startPosition: position ?? 0 };
    setIsRepositioning(true);
  }

  function handleRepositionPointerMove(e: React.PointerEvent<HTMLImageElement>) {
    if (e.pointerType !== "mouse") return;
    if (!dragState.current || !frameRef.current || !onPositionChange) return;
    const frameHeight = frameRef.current.getBoundingClientRect().height;
    const deltaPercent =
      ((e.clientY - dragState.current.startY) / frameHeight) * 100;
    const next = Math.min(
      100,
      Math.max(0, dragState.current.startPosition - deltaPercent)
    );
    onPositionChange(Math.round(next));
  }

  function handleRepositionPointerUp(e: React.PointerEvent<HTMLImageElement>) {
    if (e.pointerType !== "mouse") return;
    dragState.current = null;
    setIsRepositioning(false);
  }

  // En movil, arrastrar con UN dedo (sobre todo hacia abajo, cerca del
  // borde superior de la pagina) lo interceptaba el gesto nativo de
  // "pull to refresh" del navegador — touch-action: none no lo evitaba
  // de forma confiable en todos los navegadores. Con DOS dedos ese
  // conflicto no existe (ningun navegador usa un gesto de 2 dedos para
  // refrescar o hacer scroll), asi que el reposicionamiento en touch
  // solo se activa con exactamente 2 toques. Se usan listeners nativos
  // (no los onTouch* sinteticos de React) porque React los registra
  // como passive por defecto, lo que impediria que preventDefault()
  // realmente bloquee el pinch-zoom del navegador durante el gesto.
  useEffect(() => {
    if (!canReposition) return;
    const img = imageRef.current;
    if (!img) return;

    function averageY(touches: TouchList) {
      let sum = 0;
      for (let i = 0; i < touches.length; i++) sum += touches[i].clientY;
      return sum / touches.length;
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      dragState.current = {
        startY: averageY(e.touches),
        startPosition: positionRef.current,
      };
      setIsRepositioning(true);
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragState.current || e.touches.length !== 2 || !frameRef.current) {
        return;
      }
      e.preventDefault();
      const frameHeight = frameRef.current.getBoundingClientRect().height;
      const deltaPercent =
        ((averageY(e.touches) - dragState.current.startY) / frameHeight) * 100;
      const next = Math.min(
        100,
        Math.max(0, dragState.current.startPosition - deltaPercent)
      );
      onPositionChangeRef.current?.(Math.round(next));
    }

    function onTouchEnd() {
      dragState.current = null;
      setIsRepositioning(false);
    }

    img.addEventListener("touchstart", onTouchStart, { passive: false });
    img.addEventListener("touchmove", onTouchMove, { passive: false });
    img.addEventListener("touchend", onTouchEnd);
    img.addEventListener("touchcancel", onTouchEnd);

    return () => {
      img.removeEventListener("touchstart", onTouchStart);
      img.removeEventListener("touchmove", onTouchMove);
      img.removeEventListener("touchend", onTouchEnd);
      img.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [canReposition]);

  async function uploadFile(file: File) {
    setStatus("uploading");
    setErrorMessage(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${kennelId}/${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
    setStatus("idle");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-onlight dark:text-ink-text"
      >
        {label}
      </label>
      {hint && (
        <p className="text-xs text-onlight-dim dark:text-ink-text-dim">
          {hint}
        </p>
      )}
      <input type="hidden" name={name} value={value} />

      <div
        ref={frameRef}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={canReposition ? undefined : () => fileInputRef.current?.click()}
        className={`relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          canReposition ? "" : "cursor-pointer"
        } ${
          aspect === "wide"
            ? "aspect-[16/9] w-full"
            : aspect === "tall"
              ? "aspect-[1/3] w-full max-w-[220px]"
              : aspect === "banner"
                ? "aspect-[3/1] w-full"
                : "h-36 w-36"
        } ${
          isDragOver
            ? "border-saddle bg-saddle/5 dark:border-brass dark:bg-brass/10"
            : "border-saddle/30 dark:border-brass/30"
        }`}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={value}
              alt=""
              draggable={false}
              onPointerDown={handleRepositionPointerDown}
              onPointerMove={handleRepositionPointerMove}
              onPointerUp={handleRepositionPointerUp}
              onPointerCancel={handleRepositionPointerUp}
              style={
                canReposition
                  ? { objectPosition: `center ${position ?? 0}%` }
                  : undefined
              }
              className={`h-full w-full object-cover ${
                canReposition
                  ? isRepositioning
                    ? "cursor-grabbing touch-pan-y"
                    : "cursor-grab touch-pan-y"
                  : ""
              }`}
            />
            {canReposition && (
              <>
                <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-center text-[0.65rem] font-medium text-white">
                  <span className="hidden sm:inline">Drag photo to reposition</span>
                  <span className="sm:hidden">Drag with two fingers to reposition</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  aria-label="Replace photo"
                  className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <EditIcon />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              aria-label="Remove photo"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <XIcon />
            </button>
          </>
        ) : status === "uploading" ? (
          <SpinnerIcon />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-onlight-dim dark:text-ink-text-dim">
            <PlusIcon />
            <span className="text-xs font-medium">Add photo</span>
          </div>
        )}
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {status === "error" && (
        <p className="text-xs text-oxblood dark:text-oxblood-2">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6 animate-spin text-onlight-dim dark:text-ink-text-dim"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
