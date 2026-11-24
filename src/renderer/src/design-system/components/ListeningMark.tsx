// The Otto mark (ring and dot); `active` pulses while listening.
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
      className={`relative grid place-items-center rounded-full border-[10px] border-brand ${
        active ? "animate-pulse" : ""
      }`}
      style={{ width: size, height: size }}
    >
      <span
        className="rounded-full bg-brand"
        style={{ width: size * 0.28, height: size * 0.28 }}
      />
    </div>
  );
}
