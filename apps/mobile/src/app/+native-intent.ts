import { getShareExtensionKey } from "expo-share-intent";

/**
 * Android/iOS share intents arrive as a native deep link. Redirect the share
 * payload to the protected responses route; ShareCaptureProvider takes over
 * from there and opens the save modal.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: string;
}) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return "/responses";
    }
    return path;
  } catch {
    return "/";
  }
}
