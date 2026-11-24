import type { ReactNode } from "react";

type Tone = "error" | "warning" | "info";

const TONES: Record<Tone, string> = {
  error: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300",
  warning:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-brand/40 bg-brand/10 text-brand dark:text-blue-300",
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3 py-2 text-sm ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
