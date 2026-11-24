// Push to talk. While listening it shows the voice level and a click ends
// the question.
export function MicButton({
  listening,
  level,
  disabled,
  onClick,
}: {
  listening: boolean;
  level: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const ring = listening ? Math.min(1, level * 12) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Parar e enviar" : "Falar com o Otto"}
      title={listening ? "Parar e enviar" : "Falar com o Otto"}
      className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors disabled:opacity-50 ${
        listening
          ? "bg-red-500 text-white"
          : "border border-line text-ink-muted hover:border-brand hover:text-brand"
      }`}
      style={
        listening
          ? { boxShadow: `0 0 0 ${2 + ring * 8}px rgb(239 68 68 / 0.25)` }
          : undefined
      }
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}
