"use client";

import { useActionState, useState } from "react";
import { updateSiteSettings, type UpdateSiteSettingsState } from "./actions";
import ImageUploadField from "@/components/kennel-editor/ImageUploadField";
import { SITE_ASSETS_ID } from "@/lib/site-assets";
import type { SiteSettings } from "@/lib/supabase/types";

const initialState: UpdateSiteSettingsState = { error: null };

const inputClass =
  "w-full border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";
const labelClass =
  "font-mono text-[0.68rem] uppercase tracking-[0.12em] text-onlight-dim dark:text-ink-text-dim";

export default function SiteSettingsForm({
  settings,
}: {
  settings: SiteSettings;
}) {
  const [state, formAction, isPending] = useActionState(
    updateSiteSettings,
    initialState
  );
  const [heroUrl, setHeroUrl] = useState(settings.hero_image_url ?? "");
  const [leftUrl, setLeftUrl] = useState(settings.banner_left_image_url ?? "");
  const [rightUrl, setRightUrl] = useState(
    settings.banner_right_image_url ?? ""
  );
  const [mobileTopUrl, setMobileTopUrl] = useState(
    settings.mobile_banner_top_image_url ?? ""
  );
  const [mobileBottomUrl, setMobileBottomUrl] = useState(
    settings.mobile_banner_bottom_image_url ?? ""
  );

  return (
    <form
      action={formAction}
      className="space-y-6 border border-saddle/20 bg-white p-6 dark:border-brass/20 dark:bg-ink-2"
    >
      {state.error && (
        <p className="border border-oxblood/40 bg-oxblood/5 p-3 text-sm text-oxblood dark:border-oxblood-2 dark:bg-oxblood/20 dark:text-ink-text">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="border border-hunter/40 bg-hunter/5 p-3 text-sm text-hunter dark:border-hunter-2 dark:bg-hunter/20 dark:text-ink-text">
          Homepage settings saved.
        </p>
      )}

      <div className="space-y-3">
        <p className={labelClass}>Hero image</p>
        <ImageUploadField
          name="hero_image_url"
          label="Background behind the KENNEL DATABASE title"
          hint="Wide, around 1920×800px — dog photos work best, the title sits on top of it"
          kennelId={SITE_ASSETS_ID}
          folder="hero"
          aspect="wide"
          value={heroUrl}
          onChange={setHeroUrl}
        />
      </div>

      <div className="space-y-3 border-t border-saddle/15 pt-6 dark:border-brass/15">
        <p className={labelClass}>Top announcement banner</p>
        <p className="text-xs text-onlight-dim dark:text-ink-text-dim">
          Small strip above the hero, e.g. &quot;Meet this month&apos;s top
          kennel&quot;. Leave the text blank to hide it. This slot (and the
          two side banners below) can be sold as advertising.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="top_banner_text" className={labelClass}>
              Text
            </label>
            <input
              id="top_banner_text"
              name="top_banner_text"
              defaultValue={settings.top_banner_text ?? ""}
              placeholder="Meet this month's top kennel: ..."
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="top_banner_link" className={labelClass}>
              Link (optional)
            </label>
            <input
              id="top_banner_link"
              name="top_banner_link"
              defaultValue={settings.top_banner_link ?? ""}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-saddle/15 pt-6 dark:border-brass/15 sm:grid-cols-2">
        <div className="space-y-3">
          <p className={labelClass}>Left side banner</p>
          <ImageUploadField
            name="banner_left_image_url"
            label="Vertical ad image"
            hint="Tall, around 300×900px"
            kennelId={SITE_ASSETS_ID}
            folder="banner-left"
            aspect="tall"
            value={leftUrl}
            onChange={setLeftUrl}
          />
          <div className="space-y-1">
            <label htmlFor="banner_left_link" className={labelClass}>
              Link
            </label>
            <input
              id="banner_left_link"
              name="banner_left_link"
              defaultValue={settings.banner_left_link ?? ""}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className={labelClass}>Right side banner</p>
          <ImageUploadField
            name="banner_right_image_url"
            label="Vertical ad image"
            hint="Tall, around 300×900px"
            kennelId={SITE_ASSETS_ID}
            folder="banner-right"
            aspect="tall"
            value={rightUrl}
            onChange={setRightUrl}
          />
          <div className="space-y-1">
            <label htmlFor="banner_right_link" className={labelClass}>
              Link
            </label>
            <input
              id="banner_right_link"
              name="banner_right_link"
              defaultValue={settings.banner_right_link ?? ""}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-saddle/15 pt-6 dark:border-brass/15">
        <p className={labelClass}>Mobile banners</p>
        <p className="text-xs text-onlight-dim dark:text-ink-text-dim">
          The two side banners above are hidden on phones/tablets (no room
          without squeezing the search fields). These two horizontal
          banners take their place there instead — one above the search
          fields, one at the very bottom of the page. Hidden on desktop.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-onlight dark:text-ink-text">
              Above the search fields
            </p>
            <ImageUploadField
              name="mobile_banner_top_image_url"
              label="Horizontal ad image"
              hint="Wide and short, around 1200×400px"
              kennelId={SITE_ASSETS_ID}
              folder="mobile-banner-top"
              aspect="banner"
              value={mobileTopUrl}
              onChange={setMobileTopUrl}
            />
            <div className="space-y-1">
              <label htmlFor="mobile_banner_top_link" className={labelClass}>
                Link
              </label>
              <input
                id="mobile_banner_top_link"
                name="mobile_banner_top_link"
                defaultValue={settings.mobile_banner_top_link ?? ""}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-onlight dark:text-ink-text">
              Bottom of the page
            </p>
            <ImageUploadField
              name="mobile_banner_bottom_image_url"
              label="Horizontal ad image"
              hint="Wide and short, around 1200×400px"
              kennelId={SITE_ASSETS_ID}
              folder="mobile-banner-bottom"
              aspect="banner"
              value={mobileBottomUrl}
              onChange={setMobileBottomUrl}
            />
            <div className="space-y-1">
              <label
                htmlFor="mobile_banner_bottom_link"
                className={labelClass}
              >
                Link
              </label>
              <input
                id="mobile_banner_bottom_link"
                name="mobile_banner_bottom_link"
                defaultValue={settings.mobile_banner_bottom_link ?? ""}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-onlight-dim dark:text-ink-text-dim">
        Empty slots (no image) just don&apos;t show up on the homepage —
        nothing broken-looking is left behind.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="border border-saddle bg-saddle px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim"
      >
        {isPending ? "Saving..." : "Save homepage settings"}
      </button>
    </form>
  );
}
