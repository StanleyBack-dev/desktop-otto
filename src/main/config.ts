// Build-time configuration (electron-vite injects MAIN_VITE_* from .env
// into the main process only; the screens never see these values).
export type AppConfig = { apiUrl: string; clientApiKey: string };

export function loadConfig(): AppConfig {
  const apiUrl = (import.meta.env.MAIN_VITE_API_URL ?? "").replace(/\/+$/, "");
  const clientApiKey = import.meta.env.MAIN_VITE_CLIENT_API_KEY ?? "";
  if (!apiUrl || !clientApiKey) {
    throw new Error(
      "MAIN_VITE_API_URL and MAIN_VITE_CLIENT_API_KEY must be set in .env (see .env.example).",
    );
  }
  return { apiUrl, clientApiKey };
}
