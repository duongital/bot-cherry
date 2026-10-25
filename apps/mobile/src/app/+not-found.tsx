import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/providers/ThemeProvider";

export default function NotFoundRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <EmptyState
        icon="🍒"
        title="Page not found"
        description="That route does not exist in the mobile app."
        action={
          <AppButton onPress={() => router.replace("/responses")}>
            Go to responses
          </AppButton>
        }
      />
    </SafeAreaView>
  );
}
