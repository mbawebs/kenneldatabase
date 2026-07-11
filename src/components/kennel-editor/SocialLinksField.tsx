"use client";

import { useId } from "react";
import { SOCIAL_PLATFORMS, type SocialLink } from "@/lib/supabase/types";
import { SocialIcon } from "@/components/social-icons";
import { PlusIcon, TrashIcon } from "./icons";

const inputClass =
  "w-full rounded-lg border border-saddle/25 bg-paper px-4 py-3 text-base text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";

// Lista dinamica de links (WhatsApp, Instagram, Facebook, TikTok,
// YouTube, X, sitio propio, etc). Todos opcionales, ninguno forzado —
// el usuario agrega solo los que use.
export default function SocialLinksField({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  const uid = useId();

  function updateLink(index: number, patch: Partial<SocialLink>) {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function addLink() {
    onChange([...links, { platform: "instagram", value: "" }]);
  }

  return (
    <div className="space-y-3">
      {links.map((link, index) => {
        const platformInfo = SOCIAL_PLATFORMS.find((p) => p.value === link.platform);
        return (
          <div
            key={`${uid}-${index}`}
            className="space-y-2 rounded-lg border border-saddle/20 p-3 dark:border-brass/20"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-saddle/25 text-onlight dark:border-brass/25 dark:text-ink-text">
                <SocialIcon platform={link.platform} className="h-4 w-4" />
              </span>
              <select
                value={link.platform}
                onChange={(e) =>
                  updateLink(index, {
                    platform: e.target.value as SocialLink["platform"],
                  })
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
                onClick={() => removeLink(index)}
                aria-label="Remove link"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-oxblood/30 text-oxblood dark:border-oxblood-2/50 dark:text-oxblood-2"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            {link.platform === "custom" && (
              <input
                value={link.label ?? ""}
                onChange={(e) => updateLink(index, { label: e.target.value })}
                placeholder="Name shown to visitors, e.g. Supplements"
                className={inputClass}
                aria-label="Custom link name"
              />
            )}
            <input
              value={link.value}
              onChange={(e) => updateLink(index, { value: e.target.value })}
              placeholder={platformInfo?.placeholder}
              className={inputClass}
              aria-label={`${platformInfo?.label ?? "Link"} value`}
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={addLink}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-saddle/30 py-3 text-sm font-bold uppercase tracking-wide text-onlight dark:border-brass/30 dark:text-ink-text"
      >
        <PlusIcon className="h-4 w-4" />
        Add a link
      </button>

      {links.map((link, index) => (
        <span key={`hidden-${index}`}>
          <input type="hidden" name="social_platform" value={link.platform} />
          <input type="hidden" name="social_value" value={link.value} />
          <input type="hidden" name="social_label" value={link.label ?? ""} />
        </span>
      ))}
    </div>
  );
}
