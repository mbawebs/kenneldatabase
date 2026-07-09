"use client";

import { useId, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { SpinnerIcon } from "./ImageUploadField";
import { GripIcon } from "./icons";

const BUCKET = "kennel-media";

// Cuadricula de fotos tipo Instagram/Canva: miniaturas grandes con
// preview real, reordenables arrastrando desde la agarradera de la
// esquina (mouse o dedo), + un tile de "+" al final para agregar mas.
// Controlado (value/onChange) para que el padre sepa de cada cambio
// al instante.
export default function MultiImageUploadField({
  name,
  label,
  kennelId,
  folder,
  value: urls,
  onChange,
}: {
  name: string;
  label: string;
  kennelId: string;
  folder: string;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dos sensores para cubrir mouse y tactil de forma confiable:
  // PointerSensor (mouse/pen/algunos touch) con un pequeno umbral de
  // distancia, y TouchSensor (touchstart real) con un delay corto —
  // asi un tap normal no dispara un drag mientras se hace scroll.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  async function uploadFiles(files: FileList | File[]) {
    setStatus("uploading");
    setErrorMessage(null);

    const supabase = createClient();
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
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
      uploaded.push(data.publicUrl);
    }

    onChange([...urls, ...uploaded]);
    setStatus("idle");
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) uploadFiles(files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  function removeUrl(url: string) {
    onChange(urls.filter((u) => u !== url));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = urls.indexOf(String(active.id));
    const newIndex = urls.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(urls, oldIndex, newIndex));
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-onlight dark:text-ink-text"
      >
        {label}
      </label>

      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`grid grid-cols-3 gap-3 rounded-xl p-1 transition-colors ${
          isDragOver ? "bg-saddle/5 dark:bg-brass/10" : ""
        }`}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={urls} strategy={rectSortingStrategy}>
            {urls.map((url) => (
              <SortablePhotoTile
                key={url}
                url={url}
                onRemove={() => removeUrl(url)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors ${
            isDragOver
              ? "border-saddle dark:border-brass"
              : "border-saddle/30 dark:border-brass/30"
          } text-onlight-dim dark:text-ink-text-dim`}
        >
          {status === "uploading" ? (
            <SpinnerIcon />
          ) : (
            <>
              <PlusIcon />
              <span className="text-xs font-medium">Add photo</span>
            </>
          )}
        </button>
      </div>

      {urls.length > 1 && (
        <p className="text-xs text-onlight-dim dark:text-ink-text-dim">
          Drag the {"⠇"} handle to reorder. The first photo is the cover
          shown on the card.
        </p>
      )}

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />

      {status === "error" && (
        <p className="text-xs text-oxblood dark:text-oxblood-2">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function SortablePhotoTile({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square overflow-hidden rounded-xl bg-parchment dark:bg-ink-3"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute left-1.5 top-1.5 flex h-7 w-7 touch-none items-center justify-center rounded-full bg-black/60 text-white active:cursor-grabbing"
      >
        <GripIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
      >
        <XIcon />
      </button>
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
      className="h-6 w-6"
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
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
