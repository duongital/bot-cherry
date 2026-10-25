import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { API_URL, APP_SCHEME } from "./env";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: APP_SCHEME,
      storage: SecureStore,
      storagePrefix: "botcherry",
    }),
  ],
});
