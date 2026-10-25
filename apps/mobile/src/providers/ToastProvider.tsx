import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./ThemeProvider";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      setToast({ id: Date.now(), type, message });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(hideToast, 3200);
    return () => clearTimeout(timer);
  }, [hideToast, opacity, toast, translateY]);

  const value = useMemo(
    () => ({ showToast, hideToast }),
    [hideToast, showToast],
  );

  const background =
    toast?.type === "error"
      ? colors.errorSurface
      : toast?.type === "success"
        ? colors.successSurface
        : colors.surfaceMuted;
  const foreground =
    toast?.type === "error"
      ? colors.error
      : toast?.type === "success"
        ? colors.success
        : colors.text;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              styles.toast,
              {
                bottom: insets.bottom + spacing.xl,
                backgroundColor: background,
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Text style={[styles.text, { color: foreground }]}>
              {toast.message}
            </Text>
            <Pressable
              accessibilityLabel="Dismiss message"
              accessibilityRole="button"
              hitSlop={12}
              onPress={hideToast}
            >
              <Text style={[styles.dismiss, { color: foreground }]}>×</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  dismiss: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "600",
  },
});
