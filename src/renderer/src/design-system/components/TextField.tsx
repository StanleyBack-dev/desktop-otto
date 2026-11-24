import { useId, type InputHTMLAttributes } from "react";

export function TextField({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </div>
  );
}
