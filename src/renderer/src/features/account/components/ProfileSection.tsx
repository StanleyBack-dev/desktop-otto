import { useState } from "react";
import type { AccountSettings, SettingsChange } from "@shared/account";
import { Alert, Button, Card, Range, Switch, TextField } from "@/design-system";
import { accountClient } from "@/features/account/api/account.client";

// Your name, the assistant's name and how it speaks.
export function ProfileSection({
  ownerName,
  settings,
  onUpdate,
}: {
  ownerName: string;
  settings: AccountSettings;
  onUpdate: (change: SettingsChange) => Promise<boolean>;
}) {
  const [name, setName] = useState(ownerName);
  const [assistantName, setAssistantName] = useState(settings.assistantName);
  const [rate, setRate] = useState(settings.speechRate);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const changed =
    name.trim() !== ownerName ||
    assistantName.trim() !== settings.assistantName;

  async function save() {
    setSaving(true);
    setMessage(null);
    if (name.trim() !== ownerName) {
      const result = await accountClient.updateName(name);
      if (!result.ok) {
        setMessage({ ok: false, text: result.error.message });
        setSaving(false);
        return;
      }
    }
    if (assistantName.trim() !== settings.assistantName) {
      if (!(await onUpdate({ assistantName: assistantName.trim() }))) {
        setSaving(false);
        return;
      }
    }
    setMessage({ ok: true, text: "Salvo." });
    setSaving(false);
  }

  return (
    <Card title="Você e o assistente">
      <div className="flex flex-col gap-4">
        <TextField
          label="Seu nome"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Nome do assistente (é por ele que eu atendo)"
          value={assistantName}
          maxLength={40}
          onChange={(event) => setAssistantName(event.target.value)}
        />
        {changed && (
          <div>
            <Button loading={saving} onClick={() => void save()}>
              Salvar nomes
            </Button>
          </div>
        )}
        {message && (
          <Alert tone={message.ok ? "info" : "error"}>{message.text}</Alert>
        )}
        <Range
          label="Velocidade da voz"
          value={rate}
          min={0.5}
          max={2}
          step={0.1}
          format={(value) => `${value.toFixed(1)}×`}
          onChange={setRate}
          onCommit={(value) => void onUpdate({ speechRate: value })}
        />
        <Switch
          label="Ler as respostas em voz alta"
          hint="Desligado, eu só escrevo; use “Ouvir” em cada resposta."
          checked={settings.autoSpeak}
          onChange={(autoSpeak) => void onUpdate({ autoSpeak })}
        />
      </div>
    </Card>
  );
}
