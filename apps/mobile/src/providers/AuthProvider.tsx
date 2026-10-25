import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";

type SessionReturn = ReturnType<typeof authClient.useSession>;

interface AuthContextValue {
  session: SessionReturn["data"];
  user: NonNullable<SessionReturn["data"]>["user"] | null;
  isPending: boolean;
  refetch: SessionReturn["refetch"];
  signIn: (email: string, password: string) => ReturnType<typeof authClient.signIn.email>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => ReturnType<typeof authClient.signUp.email>;
  signOut: () => Promise<void>;
  handleUnauthorized: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = authClient.useSession();
  const { refetch } = session;

  const signIn = useCallback(
    (email: string, password: string) =>
      authClient.signIn.email({ email, password }),
    [],
  );

  const signUp = useCallback(
    (name: string, email: string, password: string) =>
      authClient.signUp.email({ name, email, password }),
    [],
  );

  const signOut = useCallback(async () => {
    await authClient.signOut();
    await refetch();
  }, [refetch]);

  const handleUnauthorized = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {
      // The server may already consider the session invalid.
    }
    try {
      await refetch();
    } catch {
      // Ignore; navigation below is still correct.
    }
    router.replace("/login");
  }, [refetch, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: session.data,
      user: session.data?.user ?? null,
      isPending: session.isPending,
      refetch,
      signIn,
      signUp,
      signOut,
      handleUnauthorized,
    }),
    [
      handleUnauthorized,
      refetch,
      session.data,
      session.isPending,
      signIn,
      signOut,
      signUp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
