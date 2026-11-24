import { useCallback, useEffect, useState } from "react";
import type {
  AccountResult,
  AccountSettings,
  SettingsChange,
} from "@shared/account";
import { accountClient } from "@/features/account/api/account.client";

// The account settings shown in Ajustes: load once, save each change and
// keep the API answer (or its message) on screen.
export function useAccountSettings() {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = useCallback((result: AccountResult<AccountSettings>) => {
    if (result.ok) {
      setSettings(result.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
    return result.ok;
  }, []);

  useEffect(() => {
    void accountClient.settings().then(apply);
  }, [apply]);

  const update = useCallback(
    async (change: SettingsChange) => {
      setSaving(true);
      const ok = apply(await accountClient.updateSettings(change));
      setSaving(false);
      return ok;
    },
    [apply],
  );

  return { settings, error, saving, update, apply };
}
