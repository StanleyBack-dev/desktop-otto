import { ListeningMark } from "@/design-system";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { useSession } from "@/features/auth/model/use-session";
import { HomeScreen } from "@/features/system/components/HomeScreen";

export function App() {
  const session = useSession();

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
  return <HomeScreen user={session.user} offline={session.offline} />;
}
