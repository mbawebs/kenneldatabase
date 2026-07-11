"use client";

import { useState } from "react";
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SOCIAL_PLATFORMS, type SocialLink } from "@/lib/supabase/types";
import { SocialIcon } from "@/components/social-icons";
import { PlusIcon, TrashIcon, GripIcon } from "./icons";

const inputClass =
  "w-full rounded-lg border border-saddle/25 bg-paper px-4 py-3 text-base text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";

// Lista dinamica de links (WhatsApp, Instagram, Facebook, TikTok,
// YouTube, X, sitio propio, etc). Todos opcionales, ninguno forzado —
// el usuario agrega solo los que use, y los puede arrastrar para
// reacomodar el orden en el que aparecen en la landing publica.
export default function SocialLinksField({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  // SocialLink no trae un id propio (a diferencia de perros/cruzas, que
  // vienen de la base de datos) — dnd-kit necesita un identificador
  // estable por fila para rastrear el arrastre, asi que se genera uno
  // aqui mismo y se mantiene sincronizado (mismo largo, mismo orden)
  // con cada cambio que este componente ya hace sobre "links".
  const [ids, setIds] = useState<string[]>(() => links.map(() => crypto.randomUUID()));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function updateLink(index: number, patch: Partial<SocialLink>) {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
    setIds((prev) => prev.filter((_, i) => i !== index));
  }

  function addLink() {
    onChange([...links, { platform: "instagram", value: "" }]);
    setIds((prev) => [...prev, crypto.randomUUID()]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(links, oldIndex, newIndex));
    setIds(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {links.map((link, index) => (
            <SortableLinkRow
              key={ids[index]}
              id={ids[index]}
              link={link}
              onUpdate={(patch) => updateLink(index, patch)}
              onRemove={() => removeLink(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addLink}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-saddle/30 py-3 text-sm font-bold uppercase tracking-wide text-onlight dark:border-brass/30 dark:text-ink-text"
      >
        <PlusIcon className="h-4 w-4" />
        Add a link
      </button>

      {links.map((link, index) => (
        <span key={`hidden-${ids[index]}`}>
          <input type="hidden" name="social_platform" value={link.platform} />
          <input type="hidden" name="social_value" value={link.value} />
          <input type="hidden" name="social_label" value={link.label ?? ""} />
        </span>
      ))}
    </div>
  );
}

function SortableLinkRow({
  id,
  link,
  onUpdate,
  onRemove,
}: {
  id: string;
  link: SocialLink;
  onUpdate: (patch: Partial<SocialLink>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const platformInfo = SOCIAL_PLATFORMS.find((p) => p.value === link.platform);

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
      className="flex items-start gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="mt-3 flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-full border border-saddle/25 text-onlight-dim active:cursor-grabbing dark:border-brass/25 dark:text-ink-text-dim"
      >
        <GripIcon className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1 space-y-2 rounded-lg border border-saddle/20 p-3 dark:border-brass/20">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-saddle/25 text-onlight dark:border-brass/25 dark:text-ink-text">
            <SocialIcon platform={link.platform} className="h-4 w-4" />
          </span>
          <select
            value={link.platform}
            onChange={(e) =>
              onUpdate({ platform: e.target.value as SocialLink["platform"] })
            }
            className={`${inputClass} min-w-0 flex-1`}
            aria-label="Platform"
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove link"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-oxblood/30 text-oxblood dark:border-oxblood-2/50 dark:text-oxblood-2"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
        {link.platform === "custom" && (
          <input
            value={link.label ?? ""}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Name shown to visitors, e.g. Supplements"
            className={inputClass}
            aria-label="Custom link name"
          />
        )}
        <input
          value={link.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={platformInfo?.placeholder}
          className={inputClass}
          aria-label={`${platformInfo?.label ?? "Link"} value`}
        />
      </div>
    </div>
  );
}
