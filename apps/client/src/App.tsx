import { useState, type FormEvent } from "react";
import { authClient } from "./lib/auth-client";

type Mode = "signin" | "signup";

export default function App() {
  const session = authClient.useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await authClient.signUp.email({ name, email, password });
        if (res.error) throw new Error(res.error.message ?? "Sign up failed");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message ?? "Sign in failed");
      }
      await session.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    await session.refetch();
  }

  if (session.isPending) {
    return (
      <main className="container">
        <div className="card">Loading…</div>
      </main>
    );
  }

  if (session.data) {
    return (
      <main className="container">
        <div className="card">
          <h1>Welcome 👋</h1>
          <p>
            Signed in as <strong>{session.data.user.email}</strong>
          </p>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h1>{mode === "signin" ? "Sign in" : "Create account"}</h1>

        {mode === "signup" && (
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>

        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
