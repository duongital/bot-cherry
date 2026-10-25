import type { Auth } from "./auth";

export interface Bindings {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CLIENT_URL: string;
  MOBILE_APP_SCHEME?: string;
}

type AuthSession = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>;

export interface AppVariables {
  user: AuthSession["user"];
  session: AuthSession["session"];
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: AppVariables;
};
