import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  const { colors, spacing, radius } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View
      accessibilityLabel="Loading"
      style={{ padding: spacing.lg, gap: spacing.lg }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <Animated.View
          key={index}
          style={{ opacity, gap: spacing.sm }}
        >
          <View
            style={{
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.sm,
              height: 14,
              width: index % 2 === 0 ? "82%" : "64%",
            }}
          />
          <View
            style={{
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.sm,
              height: 10,
              width: "38%",
            }}
          />
        </Animated.View>
      ))}
    </View>
  );
}
