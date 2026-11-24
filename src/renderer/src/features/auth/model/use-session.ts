import { useEffect, useState } from "react";
import type { SessionState } from "@shared/session";
import { authClient } from "@/features/auth/api/auth.client";

// The current session, kept in sync with the main process.
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  useEffect(() => {
    const unsubscribe = authClient.onChange(setState);
    void authClient.state().then(setState);
    return unsubscribe;
  }, []);
  return state;
}
