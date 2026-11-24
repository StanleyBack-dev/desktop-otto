import { useState } from "react";
import type { AccountSettings, SettingsChange } from "@shared/account";
import { Card, Switch, TextField } from "@/design-system";

const TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function BriefingSection({
  settings,
  onUpdate,
}: {
  settings: AccountSettings;
  onUpdate: (change: SettingsChange) => Promise<boolean>;
}) {
  const [time, setTime] = useState(settings.briefingTime);

  return (
    <Card title="Resumo do dia">
      <div className="flex flex-col gap-4">
        <Switch
          label="Preparar o resumo todo dia"
          hint="Clima, agenda e as manchetes de ontem, lidos para você."
          checked={settings.briefingEnabled}
          onChange={(briefingEnabled) => void onUpdate({ briefingEnabled })}
        />
        <TextField
          label="Horário"
          type="time"
          value={time}
          disabled={!settings.briefingEnabled}
          onChange={(event) => setTime(event.target.value)}
          onBlur={() => {
            if (TIME.test(time) && time !== settings.briefingTime) {
              void onUpdate({ briefingTime: time });
            }
          }}
        />
      </div>
    </Card>
  );
}
