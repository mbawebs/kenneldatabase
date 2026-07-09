// Set de iconos minimos, dibujados a mano (outline, 24x24, stroke
// currentColor) para no depender de una libreria externa. Mismo
// estilo que los iconos que ya existian en el lightbox.

function base(children: React.ReactNode, className = "h-5 w-5") {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: { className?: string }) {
  return base(
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>,
    props.className
  );
}

export function StarIcon(props: { className?: string }) {
  return base(
    <path d="M12 3l2.6 5.8 6.3.6-4.8 4.2 1.4 6.2L12 16.9l-5.5 2.9 1.4-6.2-4.8-4.2 6.3-.6L12 3z" />,
    props.className
  );
}

export function HeartIcon(props: { className?: string }) {
  return base(
    <path d="M12 20.5s-7-4.35-9.5-8.7C.9 8.4 2.6 5 6 5c2 0 3.3 1.1 4 2.2C10.7 6.1 12 5 14 5c3.4 0 5.1 3.4 3.5 6.8-2.5 4.35-9.5 8.7-9.5 8.7z" />,
    props.className
  );
}

export function FolderIcon(props: { className?: string }) {
  return base(
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />,
    props.className
  );
}

export function CalendarIcon(props: { className?: string }) {
  return base(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>,
    props.className
  );
}

export function CheckCircleIcon(props: { className?: string }) {
  return base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.4 2.4 4.6-5.2" />
    </>,
    props.className
  );
}

export function EyeIcon(props: { className?: string }) {
  return base(
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    props.className
  );
}

export function ArrowLeftIcon(props: { className?: string }) {
  return base(
    <path d="M19 12H5M11 6l-6 6 6 6" />,
    props.className
  );
}

export function PlusIcon(props: { className?: string }) {
  return base(<path d="M12 5v14M5 12h14" />, props.className);
}

export function PencilIcon(props: { className?: string }) {
  return base(
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
    props.className
  );
}

export function TrashIcon(props: { className?: string }) {
  return base(
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
    props.className
  );
}

export function XIcon(props: { className?: string }) {
  return base(<path d="M6 6l12 12M18 6L6 18" />, props.className);
}
