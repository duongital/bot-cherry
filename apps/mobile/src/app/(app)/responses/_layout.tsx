import { Stack } from "expo-router";
import { ResponsesProvider } from "@/providers/ResponsesProvider";
import { useTheme } from "@/providers/ThemeProvider";

export default function ResponsesLayout() {
  const { colors } = useTheme();

  return (
    <ResponsesProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </ResponsesProvider>
  );
}
