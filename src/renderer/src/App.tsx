import { useEffect, useState } from "react";
import type { AppInfo } from "@shared/ipc";
import { ListeningMark } from "@/design-system";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { useSession } from "@/features/auth/model/use-session";
import { ChatScreen } from "@/features/chat/components/ChatScreen";
import { SettingsScreen } from "@/features/settings/components/SettingsScreen";
import { TodayScreen } from "@/features/today/components/TodayScreen";
import { systemClient } from "@/features/system/api/system.client";

export function App() {
  const session = useSession();
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [screen, setScreen] = useState<"chat" | "today" | "settings">("chat");

  useEffect(() => {
    void systemClient.info().then(setInfo);
  }, []);

  if (session.status === "loading") {
    return (
      <main className="grid h-full place-items-center">
        <ListeningMark active />
      </main>
    );
  }
  if (session.status === "signed-out") {
    return <LoginScreen expired={session.reason === "expired"} />;
  }
  if (screen === "today") {
    return <TodayScreen onBack={() => setScreen("chat")} />;
  }
  if (screen === "settings") {
    return (
      <SettingsScreen
        user={session.user}
        info={info}
        onBack={() => setScreen("chat")}
      />
    );
  }
  return (
    <ChatScreen
      user={session.user}
      offline={session.offline}
      askShortcut={info?.askShortcut ?? null}
      talkShortcut={info?.talkShortcut ?? null}
      onOpenSettings={() => setScreen("settings")}
      onOpenToday={() => setScreen("today")}
    />
  );
}
