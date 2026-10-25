import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/AppButton";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { signIn, signUp, refetch } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;
    setError(null);

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "signup"
          ? await signUp(name.trim(), email.trim(), password)
          : await signIn(email.trim(), password);

      if (result.error) {
        setError(
          result.error.message ??
            (mode === "signup" ? "Sign up failed" : "Sign in failed"),
        );
        return;
      }

      await refetch();
      router.replace("/responses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { padding: spacing.xl, gap: spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, { gap: spacing.sm }]}>
            <Text style={styles.cherry} aria-hidden>
              🍒
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {mode === "login"
                ? "Sign in to keep your saved responses in sync."
                : "One account is all you need to get started."}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                gap: spacing.md,
                padding: spacing.lg,
              },
            ]}
          >
            {mode === "signup" ? (
              <TextField
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Ada Lovelace"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            ) : null}

            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              textContentType={
                mode === "login" ? "password" : "newPassword"
              }
              returnKeyType="go"
              onSubmitEditing={() => void handleSubmit()}
            />

            {error ? (
              <View
                style={[
                  styles.error,
                  {
                    backgroundColor: colors.errorSurface,
                    borderColor: colors.error,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <AppButton
              fullWidth
              loading={loading}
              onPress={() => void handleSubmit()}
              style={{ marginTop: spacing.sm }}
            >
              {mode === "login" ? "Log in" : "Create account"}
            </AppButton>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.replace(mode === "login" ? "/signup" : "/login")
            }
            style={styles.switchMode}
          >
            <Text style={[styles.switchText, { color: colors.textMuted }]}>
              {mode === "login" ? "Need an account? " : "Already have an account? "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {mode === "login" ? "Sign up" : "Log in"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
  },
  cherry: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
  },
  error: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
  },
  switchMode: {
    alignItems: "center",
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
