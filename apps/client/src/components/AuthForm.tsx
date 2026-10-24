import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

type Mode = "login" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
  const session = authClient.useSession();
  const navigate = useNavigate();
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
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (session.isPending) {
    return <div className="card">🍒 Loading…</div>;
  }

  if (session.data) {
    return <Navigate to="/" replace />;
  }

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      <h1>
        {mode === "login" ? "🍒 Welcome back" : "🍒 Create your account"}
      </h1>
      <p className="subtitle">
        {mode === "login"
          ? "Sign in to keep chatting with bot-cherry."
          : "One account is all you need to get started."}
      </p>

      {mode === "signup" && (
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="name"
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
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>

      <p className="switch-mode">
        {mode === "login" ? (
          <>
            Need an account? <Link to="/signup">Sign up</Link>
          </>
        ) : (
          <>
            Already have an account? <Link to="/login">Log in</Link>
          </>
        )}
      </p>
    </form>
  );
}
