"use client";

import { useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "kennel-media";

// Slot de foto unica (logo, portada): un cuadro grande con preview
// inmediato, no un input de archivo generico. "square" para logo,
// "wide" para portada (16:9).
export default function ImageUploadField({
  name,
  label,
  kennelId,
  folder,
  defaultValue,
  aspect = "square",
  hint,
}: {
  name: string;
  label: string;
  kennelId: string;
  folder: string;
  defaultValue?: string | null;
  aspect?: "square" | "wide";
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUrl(data.publicUrl);
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
      <input type="hidden" name={name} value={url} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          aspect === "wide" ? "aspect-[16/9] w-full" : "h-36 w-36"
        } ${
          isDragOver
            ? "border-saddle bg-saddle/5 dark:border-brass dark:bg-brass/10"
            : "border-saddle/30 dark:border-brass/30"
        }`}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUrl("");
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
