import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import {
  detectFormat,
  suggestTitle,
  utf8ByteLength,
  MAX_CONTENT_BYTES,
} from "@/lib/markdown";
import type { PasteDraft } from "@/lib/types";

export function PasteButton({
  onDraft,
  onError,
  size = "md",
  fullWidth = false,
  label = "Paste",
}: {
  onDraft: (draft: PasteDraft) => void;
  onError: (message: string) => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  label?: string;
}) {
  const [reading, setReading] = useState(false);

  function openManual() {
    onDraft({
      content: "",
      contentFormat: "plain",
      suggestedTitle: "",
      manual: true,
    });
  }

  async function handlePress() {
    setReading(true);
    try {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        onError("Your clipboard is empty — copy something first.");
        return;
      }
      if (utf8ByteLength(text) > MAX_CONTENT_BYTES) {
        onError("That clipboard content is larger than 256 KiB.");
        return;
      }
      onDraft({
        content: text,
        contentFormat: detectFormat(text),
        suggestedTitle: suggestTitle(text),
        manual: false,
      });
    } catch {
      openManual();
    } finally {
      setReading(false);
    }
  }

  return (
    <AppButton
      accessibilityHint="Reads text from the clipboard and opens the save form"
      fullWidth={fullWidth}
      loading={reading}
      onPress={() => void handlePress()}
      size={size}
    >
      {label}
    </AppButton>
  );
}
