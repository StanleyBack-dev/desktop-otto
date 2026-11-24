import { useEffect, useState } from "react";
import { DEFAULT_VOICE_SETTINGS, type VoiceSettings } from "@shared/assistant";
import { Button, Select } from "@/design-system";
import { chatClient } from "@/features/chat/api/chat.client";
import {
  preferredVoice,
  setPreferredVoice,
  speak,
  stopSpeaking,
  voicesFor,
} from "@/features/chat/model/speech";

// Which installed Windows voice reads the answers, with a preview. The
// list follows the language in the settings; the choice is saved on this PC.
export function VoicePicker() {
  const [settings, setSettings] = useState<VoiceSettings>(
    DEFAULT_VOICE_SETTINGS,
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState(preferredVoice);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    void chatClient.voiceSettings().then((loaded) => {
      setSettings(loaded);
      void voicesFor(loaded.language).then(setVoices);
    });
    return stopSpeaking;
  }, []);

  const installed = voices.some((v) => v.voiceURI === voice);

  function preview() {
    setPlaying(true);
    void speak(
      `Olá! Eu sou o ${settings.assistantName}. É assim que eu vou responder você.`,
      {
        language: settings.language,
        rate: settings.speechRate,
        voice,
        onEnd: () => setPlaying(false),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Voz"
        hint={
          voices.length === 0
            ? "Nenhuma voz deste idioma instalada no Windows. Instale em Configurações > Hora e idioma > Fala."
            : "Vozes instaladas no Windows. Para ter mais, adicione em Configurações > Hora e idioma > Fala."
        }
        value={installed ? voice : ""}
        options={[
          { value: "", label: "Automática (a melhor do idioma)" },
          ...voices.map((v) => ({
            value: v.voiceURI,
            label: `${v.name.replace(/^Microsoft /, "")} (${v.lang})`,
          })),
        ]}
        onChange={(uri) => {
          stopSpeaking();
          setPlaying(false);
          setPreferredVoice(uri);
          setVoice(uri);
        }}
      />
      <div>
        {playing ? (
          <Button
            variant="ghost"
            onClick={() => {
              stopSpeaking();
              setPlaying(false);
            }}
          >
            Parar
          </Button>
        ) : (
          <Button variant="ghost" onClick={preview}>
            Ouvir esta voz
          </Button>
        )}
      </div>
    </div>
  );
}
