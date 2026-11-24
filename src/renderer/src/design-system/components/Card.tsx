import type { ReactNode } from "react";

export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface-muted p-4">
      {title && (
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">{title}</h2>
      )}
      {children}
    </section>
  );
}
