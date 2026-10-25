import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import type { ThemeMode } from "@/lib/types";
import {
  darkColors,
  lightColors,
  radius,
  spacing,
  type ThemeColors,
} from "@/theme/tokens";

const STORAGE_KEY = "botcherry.theme";

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  spacing: typeof spacing;
  radius: typeof radius;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      })
      .catch(() => {
        // Theme persistence is best-effort.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {
      // Ignore storage failures; the in-memory choice still applies.
    });
  }, []);

  const resolvedMode =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedMode === "dark" ? darkColors : lightColors,
      mode,
      resolvedMode,
      setMode,
      spacing,
      radius,
    }),
    [mode, resolvedMode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
