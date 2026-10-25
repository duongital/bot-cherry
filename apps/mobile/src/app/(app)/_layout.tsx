import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

export default function AppLayout() {
  const { session, isPending } = useAuth();
  const { colors } = useTheme();

  if (isPending) return <LoadingScreen label="Checking your session…" />;
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
