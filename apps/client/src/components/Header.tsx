import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import ThemePicker from "./ThemePicker";

function CherryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16.5 4.5c-.5 3.5-2.5 6.5-6 9M17 4.5c.5 3.5 2.5 6.5 6 9"
        stroke="#4d7c0f"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 5.5c1.8-2.2 4.2-2.8 6.5-1.8-1.3 2.6-3.7 3.7-6.5 1.8Z"
        fill="#84cc16"
      />
      <circle cx="9.5" cy="21" r="6.25" fill="#e11d48" />
      <circle cx="22.5" cy="21" r="6.25" fill="#be123c" />
      <circle cx="7.5" cy="18.5" r="1.6" fill="#fda4af" opacity=".8" />
      <circle cx="20.5" cy="18.5" r="1.6" fill="#fda4af" opacity=".8" />
    </svg>
  );
}

function UserMenu({
  userName,
  signingOut,
  onSignOut,
}: {
  userName: string;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${userName}`}
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-sm font-medium text-base-content/70 shadow-sm transition-colors hover:bg-base-200 hover:text-base-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="max-w-40 truncate">Hi, {userName}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <ul
          role="menu"
          aria-label="Account actions"
          className="absolute right-0 z-50 mt-2 w-44 rounded-box border border-base-300 bg-base-100 p-1.5 shadow-xl"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              disabled={signingOut}
              className="flex w-full cursor-pointer items-center rounded-field px-3 py-2 text-left text-sm text-base-content transition-colors hover:bg-base-200 focus-visible:bg-base-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function Header() {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const userName = session.data?.user.name?.trim();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      await session.refetch();
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
      <div className="navbar mx-auto min-h-14 w-full max-w-6xl px-4">
        <div className="navbar-start gap-1">
          <Link
            to="/"
            aria-label="Bot Cherry home"
            className="inline-flex items-center rounded-full p-2 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <CherryIcon className="size-7" />
          </Link>

          <nav aria-label="Main navigation">
            {session.data && (
              <NavLink
                to="/responses"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-base-200 text-base-content"
                      : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                  }`
                }
              >
                Responses
              </NavLink>
            )}
          </nav>
        </div>

        <div className="navbar-end gap-2 sm:gap-3">
          {userName && (
            <UserMenu
              userName={userName}
              signingOut={signingOut}
              onSignOut={handleSignOut}
            />
          )}
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
