"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import KennelInfoForm from "./KennelInfoForm";
import DogForm from "./DogForm";
import BreedingForm from "./BreedingForm";
import { deleteDog, deleteBreeding } from "./actions";
import type { Kennel, Dog, Breeding, DogCategory } from "@/lib/supabase/types";
import {
  HomeIcon,
  StarIcon,
  HeartIcon,
  FolderIcon,
  CalendarIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
} from "./icons";

type IconComponent = (props: { className?: string }) => React.JSX.Element;

const DOG_SECTIONS: {
  key: string;
  label: string;
  categories: DogCategory[];
  icon: IconComponent;
  emptyHint: string;
}[] = [
  {
    key: "studs",
    label: "Studs",
    categories: ["stud"],
    icon: StarIcon,
    emptyHint: "Add your first stud",
  },
  {
    key: "females",
    label: "Females",
    categories: ["female"],
    icon: HeartIcon,
    emptyHint: "Add your first female",
  },
  {
    key: "productions",
    label: "Productions",
    categories: ["production", "puppy"],
    icon: FolderIcon,
    emptyHint: "Add a production dog or puppy",
  },
  {
    key: "available",
    label: "Available",
    categories: ["available"],
    icon: CheckCircleIcon,
    emptyHint: "Add a dog that's available",
  },
];

type View =
  | { screen: "menu" }
  | { screen: "info" }
  | { screen: "section"; sectionKey: string }
  | { screen: "dog-edit"; sectionKey: string; dogId: string | null }
  | { screen: "breedings" }
  | { screen: "breeding-edit"; breedingId: string | null };

export default function DashboardApp({
  kennel,
  dogs,
  breedings,
  isAdmin = false,
  backLink,
  onSignOut,
  publicUrl,
}: {
  kennel: Kennel;
  dogs: Dog[];
  breedings: Breeding[];
  isAdmin?: boolean;
  // Solo se pasa desde /admin/kennels/[id]: reemplaza el boton de
  // "Log out" por un link de regreso al panel de admin.
  backLink?: { href: string; label: string };
  // Solo se pasa desde /dashboard.
  onSignOut?: () => void | Promise<void>;
  // URL absoluta de la landing publica (armada en el servidor a
  // partir del host real de la request), para poder copiarla/abrirla
  // tal cual desde el menu.
  publicUrl: string;
}) {
  const [view, setView] = useState<View>({ screen: "menu" });
  const [previewOpen, setPreviewOpen] = useState(false);
  const desktopPreviewRef = useRef<HTMLIFrameElement>(null);
  const mobilePreviewRef = useRef<HTMLIFrameElement>(null);

  // Borradores: mientras se edita algo (todavia sin guardar), el panel
  // de "Vista previa" debe reflejarlo al instante. Cada uno se limpia
  // al salir de su pantalla (o al guardar, que navega de vuelta).
  const [draftKennel, setDraftKennel] = useState<Kennel | null>(null);
  const [draftDog, setDraftDog] = useState<Dog | null>(null);
  const [draftBreeding, setDraftBreeding] = useState<Breeding | null>(null);

  const previewKennel = draftKennel ?? kennel;
  const previewDogs = useMemo(() => {
    if (!draftDog) return dogs;
    const exists = dogs.some((d) => d.id === draftDog.id);
    return exists
      ? dogs.map((d) => (d.id === draftDog.id ? draftDog : d))
      : [...dogs, draftDog];
  }, [dogs, draftDog]);
  const previewBreedings = useMemo(() => {
    if (!draftBreeding) return breedings;
    const exists = breedings.some((b) => b.id === draftBreeding.id);
    return exists
      ? breedings.map((b) => (b.id === draftBreeding.id ? draftBreeding : b))
      : [...breedings, draftBreeding];
  }, [breedings, draftBreeding]);

  // El panel de preview vive en un iframe real (no renderizado directo
  // aqui) para que sus estilos responsivos (sm:/md:/lg:) se calculen
  // contra el ancho del panel, no contra el del navegador completo.
  // Los datos (incluyendo cambios sin guardar) se le mandan por
  // postMessage cada vez que cambian.
  function sendPreviewData(win: Window | null | undefined) {
    win?.postMessage(
      {
        type: "kennel-dashboard-preview",
        payload: {
          kennel: previewKennel,
          dogs: previewDogs,
          breedings: previewBreedings,
        },
      },
      window.location.origin
    );
  }

  useEffect(() => {
    sendPreviewData(desktopPreviewRef.current?.contentWindow);
    sendPreviewData(mobilePreviewRef.current?.contentWindow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKennel, previewDogs, previewBreedings]);

  useEffect(() => {
    function handleReady(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "kennel-dashboard-preview-ready") return;
      sendPreviewData(e.source as Window);
    }
    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKennel, previewDogs, previewBreedings]);

  function goMenu() {
    setDraftKennel(null);
    setDraftDog(null);
    setDraftBreeding(null);
    setView({ screen: "menu" });
  }

  let title: string | null = null;
  let onBack: (() => void) | null = null;
  let content: React.ReactNode;

  if (view.screen === "menu") {
    content = (
      <MenuScreen
        dogs={dogs}
        breedings={breedings}
        publicUrl={publicUrl}
        onNavigate={setView}
      />
    );
  } else if (view.screen === "info") {
    title = "Kennel info";
    onBack = goMenu;
    content = (
      <KennelInfoForm
        kennel={kennel}
        isAdmin={isAdmin}
        onDraftChange={setDraftKennel}
      />
    );
  } else if (view.screen === "section") {
    const section = DOG_SECTIONS.find((s) => s.key === view.sectionKey);
    if (section) {
      title = section.label;
      onBack = goMenu;
      const items = dogs.filter((d) => section.categories.includes(d.category));
      content = (
        <SectionListScreen
          items={items}
          emptyHint={section.emptyHint}
          onAdd={() =>
            setView({ screen: "dog-edit", sectionKey: section.key, dogId: null })
          }
          onEdit={(id) =>
            setView({ screen: "dog-edit", sectionKey: section.key, dogId: id })
          }
        />
      );
    }
  } else if (view.screen === "dog-edit") {
    const section = DOG_SECTIONS.find((s) => s.key === view.sectionKey);
    if (section) {
      const dog = view.dogId ? dogs.find((d) => d.id === view.dogId) : undefined;
      title = dog ? `Edit ${dog.name}` : `Add to ${section.label}`;
      const backToSection = () => {
        setDraftDog(null);
        setView({ screen: "section", sectionKey: section.key });
      };
      onBack = backToSection;
      content = (
        <DogForm
          dog={dog}
          kennelId={kennel.id}
          categories={section.categories}
          onDone={backToSection}
          onCancel={backToSection}
          onDraftChange={setDraftDog}
        />
      );
    }
  } else if (view.screen === "breedings") {
    title = "Breedings";
    onBack = goMenu;
    content = (
      <BreedingsListScreen
        items={breedings}
        onAdd={() => setView({ screen: "breeding-edit", breedingId: null })}
        onEdit={(id) => setView({ screen: "breeding-edit", breedingId: id })}
      />
    );
  } else if (view.screen === "breeding-edit") {
    const breeding = view.breedingId
      ? breedings.find((b) => b.id === view.breedingId)
      : undefined;
    title = breeding ? `Edit ${breeding.title ?? "breeding"}` : "Add a breeding";
    const backToList = () => {
      setDraftBreeding(null);
      setView({ screen: "breedings" });
    };
    onBack = backToList;
    content = (
      <BreedingForm
        breeding={breeding}
        kennelId={kennel.id}
        onDone={backToList}
        onCancel={backToList}
        onDraftChange={setDraftBreeding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper text-onlight dark:bg-ink dark:text-ink-text">
      <div className="mx-auto flex max-w-6xl">
        <div className="min-h-screen flex-1 p-4 pb-10 sm:p-6 md:max-w-xl">
          <TopBar
            kennel={kennel}
            title={title}
            onBack={onBack}
            backLink={view.screen === "menu" ? backLink : undefined}
            onSignOut={view.screen === "menu" ? onSignOut : undefined}
            onOpenPreview={() => setPreviewOpen(true)}
          />
          {content}
        </div>

        {/* Escritorio: panel de vista previa siempre visible, lado a lado. */}
        <div className="hidden w-[380px] shrink-0 border-l border-saddle/15 dark:border-brass/15 md:block">
          <div className="sticky top-0 h-screen p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-saddle dark:text-brass">
              Your public page (live)
            </p>
            <iframe
              ref={desktopPreviewRef}
              src="/preview"
              title="Public page preview"
              className="h-[calc(100%-28px)] w-full rounded-xl border border-saddle/15 dark:border-brass/15"
            />
          </div>
        </div>
      </div>

      {/* Pantalla completa: para ver el preview en grande (desktop o
          movil) sin salir del dashboard ni tener que guardar primero. */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper dark:bg-ink">
          <div className="flex items-center justify-between border-b border-saddle/15 p-4 dark:border-brass/15">
            <span className="font-semibold">Your public page (live)</span>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-saddle/25 dark:border-brass/25"
            >
              <XIcon />
            </button>
          </div>
          <iframe
            ref={mobilePreviewRef}
            src="/preview"
            title="Public page preview"
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
}

function TopBar({
  kennel,
  title,
  onBack,
  backLink,
  onSignOut,
  onOpenPreview,
}: {
  kennel: Kennel;
  title: string | null;
  onBack: (() => void) | null;
  backLink?: { href: string; label: string };
  onSignOut?: () => void | Promise<void>;
  onOpenPreview: () => void;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-saddle/25 dark:border-brass/25"
          >
            <ArrowLeftIcon />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-saddle dark:text-brass">
            {title ? kennel.name : "Dashboard"}
          </p>
          <h1 className="truncate text-lg font-bold sm:text-xl">
            {title ?? kennel.name}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenPreview}
          aria-label="View live preview"
          title="View live preview"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-saddle/25 text-onlight dark:border-brass/25 dark:text-ink-text"
        >
          <EyeIcon />
        </button>
        {backLink && (
          <Link
            href={backLink.href}
            className="rounded-full border border-saddle/25 px-2.5 py-2 text-[0.65rem] font-bold uppercase tracking-wide dark:border-brass/25"
          >
            {backLink.label}
          </Link>
        )}
        {onSignOut && (
          <form action={onSignOut}>
            <button
              type="submit"
              className="rounded-full border border-saddle/25 px-2.5 py-2 text-[0.65rem] font-bold uppercase tracking-wide dark:border-brass/25"
            >
              Log out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function MenuScreen({
  dogs,
  breedings,
  publicUrl,
  onNavigate,
}: {
  dogs: Dog[];
  breedings: Breeding[];
  publicUrl: string;
  onNavigate: (view: View) => void;
}) {
  const cards: {
    key: string;
    label: string;
    icon: IconComponent;
    meta: string;
    onClick: () => void;
  }[] = [
    {
      key: "info",
      label: "Kennel info",
      icon: HomeIcon,
      meta: "Photos, contact, brand color",
      onClick: () => onNavigate({ screen: "info" }),
    },
    ...DOG_SECTIONS.map((section) => {
      const count = dogs.filter((d) => section.categories.includes(d.category)).length;
      return {
        key: section.key,
        label: section.label,
        icon: section.icon,
        meta: count > 0 ? `${count} dog${count === 1 ? "" : "s"}` : section.emptyHint,
        onClick: () => onNavigate({ screen: "section", sectionKey: section.key }),
      };
    }),
    {
      key: "breedings",
      label: "Breedings",
      icon: CalendarIcon,
      meta:
        breedings.length > 0
          ? `${breedings.length} breeding${breedings.length === 1 ? "" : "s"}`
          : "Add your first breeding",
      onClick: () => onNavigate({ screen: "breedings" }),
    },
  ];

  return (
    <div className="space-y-3">
      <PublicLinkCard publicUrl={publicUrl} />
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={card.onClick}
            className="flex flex-col items-start gap-2.5 rounded-2xl border border-saddle/20 bg-white p-4 text-left transition-colors hover:border-saddle/40 dark:border-brass/20 dark:bg-ink-2 dark:hover:border-brass/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-saddle/10 text-saddle dark:bg-brass/10 dark:text-brass">
              <card.icon className="h-5 w-5" />
            </span>
            <span className="font-semibold leading-tight">{card.label}</span>
            <span className="text-xs leading-tight text-onlight-dim dark:text-ink-text-dim">
              {card.meta}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PublicLinkCard({ publicUrl }: { publicUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-saddle/20 bg-white p-3.5 dark:border-brass/20 dark:bg-ink-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-saddle dark:text-brass">
          Public page link
        </p>
        <p className="truncate text-sm">{publicUrl}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-saddle/25 text-onlight dark:border-brass/25 dark:text-ink-text"
      >
        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      </button>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open public page"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-saddle/25 text-onlight dark:border-brass/25 dark:text-ink-text"
      >
        <ExternalLinkIcon className="h-4 w-4" />
      </a>
    </div>
  );
}

function SectionListScreen({
  items,
  emptyHint,
  onAdd,
  onEdit,
}: {
  items: Dog[];
  emptyHint: string;
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="space-y-3 pb-24">
      {items.map((dog) => (
        <ItemRow
          key={dog.id}
          photo={dog.photos?.[0]}
          title={dog.name}
          subtitle={[dog.breed, dog.color].filter(Boolean).join(" · ")}
          onEdit={() => onEdit(dog.id)}
          deleteAction={deleteDog}
          deleteFieldName="dog_id"
          deleteFieldValue={dog.id}
          confirmMessage={`Delete ${dog.name}? This can't be undone.`}
        />
      ))}

      {items.length === 0 && (
        <p className="text-sm text-onlight-dim dark:text-ink-text-dim">
          {emptyHint}.
        </p>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-saddle/30 py-3.5 text-sm font-bold uppercase tracking-wide text-onlight dark:border-brass/30 dark:text-ink-text"
      >
        <PlusIcon className="h-4 w-4" />
        Add
      </button>
    </div>
  );
}

function BreedingsListScreen({
  items,
  onAdd,
  onEdit,
}: {
  items: Breeding[];
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="space-y-3 pb-24">
      {items.map((breeding) => (
        <ItemRow
          key={breeding.id}
          photo={breeding.photos?.[0]}
          title={breeding.title ?? "Untitled breeding"}
          subtitle={[breeding.sire_name, breeding.dam_name].filter(Boolean).join(" x ")}
          onEdit={() => onEdit(breeding.id)}
          deleteAction={deleteBreeding}
          deleteFieldName="breeding_id"
          deleteFieldValue={breeding.id}
          confirmMessage="Delete this breeding? This can't be undone."
        />
      ))}

      {items.length === 0 && (
        <p className="text-sm text-onlight-dim dark:text-ink-text-dim">
          Add your first breeding.
        </p>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-saddle/30 py-3.5 text-sm font-bold uppercase tracking-wide text-onlight dark:border-brass/30 dark:text-ink-text"
      >
        <PlusIcon className="h-4 w-4" />
        Add
      </button>
    </div>
  );
}

function ItemRow({
  photo,
  title,
  subtitle,
  onEdit,
  deleteAction,
  deleteFieldName,
  deleteFieldValue,
  confirmMessage,
}: {
  photo?: string;
  title: string;
  subtitle: string;
  onEdit: () => void;
  deleteAction: (formData: FormData) => void | Promise<void>;
  deleteFieldName: string;
  deleteFieldValue: string;
  confirmMessage: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-saddle/20 bg-white p-3 dark:border-brass/20 dark:bg-ink-2">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-parchment dark:bg-ink-3">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-onlight-dim dark:text-ink-text-dim">
            {subtitle}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${title}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-saddle/25 text-onlight dark:border-brass/25 dark:text-ink-text"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name={deleteFieldName} value={deleteFieldValue} />
        <button
          type="submit"
          aria-label={`Delete ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-oxblood/30 text-oxblood dark:border-oxblood-2/50 dark:text-oxblood-2"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
