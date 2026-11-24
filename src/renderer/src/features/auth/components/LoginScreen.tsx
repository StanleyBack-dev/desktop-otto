import { useState, type FormEvent } from "react";
import { Alert, Button, ListeningMark, TextField } from "@/design-system";
import { authClient } from "@/features/auth/api/auth.client";

export function LoginScreen({ expired = false }: { expired?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await authClient.login({ email, password });
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      setPassword("");
    }
    // On success the session change switches the screen.
  }

  return (
    <main className="flex h-full flex-col justify-center gap-8 p-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <ListeningMark size={56} />
        <div>
          <h1 className="text-2xl font-semibold">Entrar no Otto</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Use a sua conta. Este PC fica conectado até você sair.
          </p>
        </div>
      </header>

      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        {expired && !error && (
          <Alert tone="warning">Sua sessão terminou. Entre de novo.</Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        <TextField
          label="E-mail"
          type="email"
          autoComplete="username"
          autoFocus
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          type="submit"
          loading={loading}
          disabled={!email.trim() || !password}
        >
          Entrar
        </Button>
      </form>
    </main>
  );
}
