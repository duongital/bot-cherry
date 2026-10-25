import * as Clipboard from "expo-clipboard";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import Markdown, {
  MarkdownIt,
  type MarkdownStyleMap,
  type RenderRules,
} from "@ronradtke/react-native-markdown-display";
import { useMemo } from "react";
import type { ContentFormat } from "@/lib/types";
import { monoFont } from "@/theme/tokens";
import { useTheme } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";

const markdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
});

const tableRules: RenderRules = {
  table: (node, children, _parent, styles) => (
    <ScrollView
      key={node.key}
      horizontal
      showsHorizontalScrollIndicator
      style={styles.table_scroll}
    >
      <View style={[styles.table, { minWidth: 460 }]}>{children}</View>
    </ScrollView>
  ),
};

export function MarkdownContent({
  content,
  format,
}: {
  content: string;
  format: ContentFormat;
}) {
  const { colors, spacing, resolvedMode } = useTheme();
  const { showToast } = useToast();

  const markdownStyles = useMemo<MarkdownStyleMap>(
    () => ({
      body: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 25,
      },
      text: {
        color: colors.text,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: spacing.md,
      },
      heading1: {
        color: colors.text,
        fontSize: 26,
        fontWeight: "800",
        lineHeight: 32,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      },
      heading2: {
        color: colors.text,
        fontSize: 22,
        fontWeight: "700",
        lineHeight: 28,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      },
      heading3: {
        color: colors.text,
        fontSize: 19,
        fontWeight: "700",
        lineHeight: 25,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      heading4: {
        color: colors.text,
        fontSize: 17,
        fontWeight: "700",
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      heading5: {
        color: colors.text,
        fontSize: 15,
        fontWeight: "700",
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      heading6: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: "700",
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      strong: {
        color: colors.text,
        fontWeight: "700",
      },
      em: {
        fontStyle: "italic",
      },
      link: {
        color: colors.link,
        textDecorationLine: "underline",
      },
      blockquote: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
        borderLeftWidth: 4,
        marginVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      },
      code_inline: {
        backgroundColor: colors.codeBackground,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 5,
        color: colors.codeText,
        fontFamily: monoFont,
        fontSize: 13,
        paddingHorizontal: 5,
        paddingVertical: 2,
      },
      code_block: {
        backgroundColor: colors.codeBackground,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        color: colors.codeText,
        fontFamily: monoFont,
        fontSize: 12,
        lineHeight: 18,
        padding: spacing.md,
      },
      fence: {
        backgroundColor: colors.codeBackground,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        marginVertical: spacing.sm,
      },
      fence_header: {
        backgroundColor: colors.surfaceMuted,
        borderBottomColor: colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
      },
      fence_language_label: {
        color: colors.textMuted,
        fontFamily: monoFont,
        fontSize: 11,
      },
      fence_copy_text: {
        color: colors.textMuted,
        fontSize: 11,
      },
      fence_code: {
        backgroundColor: colors.codeBackground,
        padding: spacing.md,
      },
      fence_token: {
        color: colors.codeText,
        fontFamily: monoFont,
        fontSize: 12,
        lineHeight: 18,
      },
      bullet_list: {
        marginVertical: spacing.xs,
      },
      ordered_list: {
        marginVertical: spacing.xs,
      },
      list_item: {
        marginVertical: 2,
      },
      bullet_list_icon: {
        color: colors.primary,
        marginLeft: spacing.sm,
        marginRight: spacing.sm,
      },
      ordered_list_icon: {
        color: colors.textMuted,
        marginLeft: spacing.sm,
        marginRight: spacing.sm,
      },
      hr: {
        backgroundColor: colors.border,
        height: StyleSheet.hairlineWidth,
        marginVertical: spacing.lg,
      },
      table: {
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
      },
      thead: {
        backgroundColor: colors.surfaceMuted,
      },
      th: {
        borderColor: colors.border,
        borderRightWidth: StyleSheet.hairlineWidth,
        flex: 1,
        minWidth: 120,
        padding: spacing.sm,
      },
      tr: {
        borderBottomColor: colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
      },
      td: {
        borderColor: colors.border,
        borderRightWidth: StyleSheet.hairlineWidth,
        flex: 1,
        minWidth: 120,
        padding: spacing.sm,
      },
      table_scroll: {
        marginVertical: spacing.sm,
      },
    }),
    [colors, spacing],
  );

  if (format === "plain") {
    return (
      <Text
        selectable
        style={[
          styles.plain,
          {
            color: colors.text,
            fontFamily: monoFont,
          },
        ]}
      >
        {content}
      </Text>
    );
  }

  return (
    <Markdown
      colorScheme={resolvedMode}
      markdownit={markdownIt}
      onCopyCode={(code) => {
        void Clipboard.setStringAsync(code).then(() => {
          showToast("success", "Code copied to clipboard.");
        });
      }}
      onLinkPress={(url) => {
        void Linking.openURL(url).catch(() => {
          showToast("error", "Could not open that link.");
        });
        return false;
      }}
      rules={tableRules}
      style={markdownStyles}
    >
      {content}
    </Markdown>
  );
}

const styles = StyleSheet.create({
  plain: {
    fontSize: 13,
    lineHeight: 21,
  },
});
