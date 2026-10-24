import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function Header() {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      await session.refetch();
      navigate("/");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span aria-hidden="true">🍒</span> Cherry Bot
      </Link>

      <nav className="site-nav">
        {session.isPending ? (
          <span className="muted">Loading…</span>
        ) : session.data ? (
          <>
            <span className="user-info">
              <strong>{session.data.user.name || "Friend"}</strong>
              <span className="user-email">{session.data.user.email}</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link to="/signup" className="btn">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
