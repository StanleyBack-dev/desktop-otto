import { forwardRef, useState, type KeyboardEvent } from "react";
import { QUESTION_MAX_LENGTH } from "@shared/assistant";
import { Button } from "@/design-system";

// The question box: Enter sends, Shift+Enter breaks the line.
export const Composer = forwardRef<
  HTMLTextAreaElement,
  { disabled: boolean; onSend: (text: string) => void }
>(function Composer({ disabled, onSend }, ref) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-line p-3">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        maxLength={QUESTION_MAX_LENGTH}
        placeholder="Pergunte ao Otto…"
        aria-label="Pergunta"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      <Button onClick={submit} disabled={disabled || !text.trim()}>
        Enviar
      </Button>
    </div>
  );
});
