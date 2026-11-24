// The Otto mark (ring and dot); `active` pulses while listening or
// thinking. The ring keeps the icon's proportions at any size.
export function ListeningMark({
  size = 72,
  active = false,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border-brand ${
        active ? "animate-pulse" : ""
      }`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size * 0.14)),
      }}
    >
      <span
        className="rounded-full bg-brand"
        style={{ width: size * 0.28, height: size * 0.28 }}
      />
    </div>
  );
}
