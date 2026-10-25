import { Redirect } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/providers/AuthProvider";

export default function IndexRoute() {
  const { session, isPending } = useAuth();

  if (isPending) return <LoadingScreen label="Checking your session…" />;

  return <Redirect href={session ? "/responses" : "/login"} />;
}
