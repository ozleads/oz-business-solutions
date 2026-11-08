import { useId } from "react";

export function Monogram({ size = 40, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={`cut-${id}`} maskUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="#fff" />
          <path d="M17 19.5H47L17 44.5H47" stroke="#000" strokeWidth="7" strokeLinejoin="miter" />
        </mask>
      </defs>
      <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="2" mask={`url(#cut-${id})`} />
      <path
        d="M17 19.5H47L17 44.5H47"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`wordmark ${className ?? ""}`}>
      <span className="wordmark__oz">OZ</span>
      <span className="wordmark__sub">Business Solutions</span>
    </span>
  );
}
