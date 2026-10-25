import { Link } from "react-router-dom";
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

export default function Header() {
  const session = authClient.useSession();
  const userName = session.data?.user.name?.trim();

  return (
    <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
      <div className="navbar mx-auto min-h-14 w-full max-w-6xl px-4">
        <div className="navbar-start">
          <Link
            to="/"
            aria-label="Bot Cherry home"
            className="inline-flex items-center rounded-full p-2 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <CherryIcon className="size-7" />
          </Link>
        </div>

        <nav className="navbar-center" aria-label="Main navigation">
          {/* Menu items will go here once the app has pages for them. */}
        </nav>

        <div className="navbar-end gap-3">
          {userName && (
            <span
              title={`Hi, ${userName}`}
              className="hidden max-w-48 truncate text-sm text-base-content/70 sm:inline-block"
            >
              Hi, {userName}
            </span>
          )}
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
