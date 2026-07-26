type Props = { className?: string; showWordmark?: boolean };

/**
 * The Sweet Share mark: two hands offering, drawn as a heart resting on a
 * cloud, crowned with a small halo. Inline SVG so it is crisp everywhere and
 * costs no network request.
 */
export default function Logo({ className = "", showWordmark = true }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="h-9 w-9 shrink-0"
        fill="none"
      >
        <defs>
          <linearGradient id="ss-heart" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f9c4d4" />
            <stop offset="55%" stopColor="#ee6f94" />
            <stop offset="100%" stopColor="#c93f6c" />
          </linearGradient>
          <linearGradient id="ss-halo" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e9b45d" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#e9b45d" />
            <stop offset="100%" stopColor="#e9b45d" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* halo */}
        <ellipse
          cx="24"
          cy="9.5"
          rx="10"
          ry="3.1"
          stroke="url(#ss-halo)"
          strokeWidth="1.8"
        />

        {/* heart */}
        <path
          d="M24 34.5s-9.4-5.9-12.2-11.3c-1.9-3.6-.5-8 3.3-9.4 2.8-1 5.9.1 7.5 2.6l1.4 2.2 1.4-2.2c1.6-2.5 4.7-3.6 7.5-2.6 3.8 1.4 5.2 5.8 3.3 9.4C33.4 28.6 24 34.5 24 34.5Z"
          fill="url(#ss-heart)"
        />

        {/* cloud it rests upon */}
        <path
          d="M11 39.5c-2.2 0-4-1.6-4-3.6s1.8-3.6 4-3.6c.3 0 .6 0 .9.1.7-2.4 3-4.2 5.8-4.2 2.2 0 4.1 1.1 5.2 2.8.8-.5 1.7-.8 2.7-.8 2.5 0 4.6 1.7 5.1 4 .4-.1.8-.2 1.3-.2 2.2 0 4 1.6 4 3.6s-1.8 3.6-4 3.6H11Z"
          fill="#fff"
          fillOpacity="0.92"
        />
        <path
          d="M11 39.5c-2.2 0-4-1.6-4-3.6s1.8-3.6 4-3.6c.3 0 .6 0 .9.1.7-2.4 3-4.2 5.8-4.2 2.2 0 4.1 1.1 5.2 2.8.8-.5 1.7-.8 2.7-.8 2.5 0 4.6 1.7 5.1 4 .4-.1.8-.2 1.3-.2 2.2 0 4 1.6 4 3.6s-1.8 3.6-4 3.6H11Z"
          stroke="#f9c4d4"
          strokeWidth="1.1"
        />
      </svg>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className="text-[1.35rem] tracking-[0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sweet Share
          </span>
          <span className="mt-0.5 text-[0.5rem] font-medium uppercase tracking-[0.34em] text-candy">
            Dessert Heaven
          </span>
        </span>
      )}
    </span>
  );
}
