import { useEffect, useState } from "react";
import type { AppInfo } from "@shared/ipc";
import type { SessionUser } from "@shared/session";
import { Alert, Button, Card, Select, Switch } from "@/design-system";
import { BriefingSection } from "@/features/account/components/BriefingSection";
import { LocationSection } from "@/features/account/components/LocationSection";
import { NewsSection } from "@/features/account/components/NewsSection";
import { ProfileSection } from "@/features/account/components/ProfileSection";
import { useAccountSettings } from "@/features/account/model/use-account-settings";
import { authClient } from "@/features/auth/api/auth.client";
import { chatClient } from "@/features/chat/api/chat.client";
import { systemClient } from "@/features/system/api/system.client";
import { wakeClient } from "@/features/voice/api/wake.client";
import { MicLevelMeter } from "@/features/voice/components/MicLevelMeter";
import { VoicePicker } from "@/features/settings/components/VoicePicker";
import {
  listMicrophones,
  preferredMicrophone,
  setPreferredMicrophone,
  type Microphone,
} from "@/features/voice/model/microphone";

// App settings on this PC: start with Windows, the shortcut and the account.
export function SettingsScreen({
  user,
  info,
  onBack,
}: {
  user: SessionUser;
  info: AppInfo | null;
  onBack: () => void;
}) {
  const account = useAccountSettings();
  const [autostart, setAutostart] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [wakeWord, setWakeWord] = useState<boolean | null>(null);
  const [assistantName, setAssistantName] = useState("Otto");
  const [microphones, setMicrophones] = useState<Microphone[]>([]);
  const [microphone, setMicrophone] = useState(preferredMicrophone());

  useEffect(() => {
    void systemClient.autostart().then(setAutostart);
    void listMicrophones()
      .then(setMicrophones)
      .catch(() => setMicrophones([]));
    void chatClient.voiceSettings().then((voice) => {
      setWakeWord(voice.wakeWordEnabled);
      setAssistantName(voice.assistantName);
    });
  }, []);

  return (
    <main className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h1 className="font-semibold">Ajustes</h1>
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {account.error && <Alert tone="error">{account.error}</Alert>}
        {account.settings ? (
          <>
            <ProfileSection
              ownerName={user.name}
              settings={account.settings}
              onUpdate={account.update}
            />
            <LocationSection
              settings={account.settings}
              onSaved={account.apply}
            />
            <BriefingSection
              settings={account.settings}
              onUpdate={account.update}
            />
            <NewsSection />
          </>
        ) : (
          !account.error && (
            <p className="text-sm text-ink-muted">Carregando sua conta…</p>
          )
        )}

        <Card title="Inicialização">
          <Switch
            label="Iniciar com o Windows"
            hint={
              info && info.platform !== "win32"
                ? "Disponível no Windows."
                : "Abro minimizado ao ligar o PC, pronto para ouvir. Fechar a janela não me desliga."
            }
            checked={autostart}
            onChange={(enabled) => {
              void systemClient.setAutostart(enabled).then(setAutostart);
            }}
          />
        </Card>

        <Card title="Voz">
          <div className="mb-4">
            <Select
              label="Microfone"
              hint="Usado para ouvir o nome e as perguntas. Se ele for desconectado, uso o padrão do Windows."
              value={
                microphones.some((mic) => mic.id === microphone)
                  ? microphone
                  : ""
              }
              options={[
                { value: "", label: "Padrão do Windows" },
                ...microphones.map((mic) => ({
                  value: mic.id,
                  label: mic.label,
                })),
              ]}
              onChange={(id) => {
                setPreferredMicrophone(id);
                setMicrophone(id);
              }}
            />
            <div className="mt-3">
              <MicLevelMeter microphoneKey={microphone} />
            </div>
          </div>
          <Switch
            label={`Ouvir quando eu disser “${assistantName}”`}
            hint="O reconhecimento do nome roda neste PC; nada sai daqui até você chamar."
            checked={wakeWord ?? false}
            disabled={wakeWord === null}
            onChange={(enabled) => {
              setWakeWord(enabled);
              void wakeClient
                .saveSetting(enabled)
                .then(setWakeWord)
                .catch(() => setWakeWord(!enabled));
            }}
          />
        </Card>

        <Card title="Voz do Otto">
          <VoicePicker />
        </Card>

        <Card title="Atalhos (de qualquer lugar do Windows)">
          <ul className="flex flex-col gap-2 text-sm">
            <ShortcutRow keys={info?.talkShortcut} action="falar com o Otto" />
            <ShortcutRow
              keys={info?.askShortcut}
              action="digitar uma pergunta"
            />
          </ul>
        </Card>

        <Card title="Conta">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              loading={leaving}
              onClick={() => {
                setLeaving(true);
                void authClient.logout();
              }}
            >
              Sair da conta
            </Button>
          </div>
        </Card>

        <p className="mt-auto text-center text-xs text-ink-muted">
          {info ? `${info.name} ${info.version}` : ""}
        </p>
      </div>
    </main>
  );
}

function ShortcutRow({
  keys,
  action,
}: {
  keys: string | null | undefined;
  action: string;
}) {
  return (
    <li>
      {keys ? (
        <>
          <kbd className="rounded border border-line px-1.5 py-0.5 text-xs">
            {keys}
          </kbd>{" "}
          {action}
        </>
      ) : (
        `Atalho para ${action} em uso por outro programa.`
      )}
    </li>
  );
}
