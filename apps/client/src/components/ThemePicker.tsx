import { useEffect, useRef, useState } from "react";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "cupcake", label: "Cupcake" },
  { value: "bumblebee", label: "Bumblebee" },
  { value: "emerald", label: "Emerald" },
  { value: "corporate", label: "Corporate" },
  { value: "synthwave", label: "Synthwave" },
  { value: "retro", label: "Retro" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "valentine", label: "Valentine" },
  { value: "halloween", label: "Halloween" },
  { value: "garden", label: "Garden" },
  { value: "forest", label: "Forest" },
  { value: "aqua", label: "Aqua" },
  { value: "lofi", label: "Lo-Fi" },
  { value: "pastel", label: "Pastel" },
  { value: "fantasy", label: "Fantasy" },
  { value: "wireframe", label: "Wireframe" },
  { value: "black", label: "Black" },
  { value: "luxury", label: "Luxury" },
  { value: "dracula", label: "Dracula" },
  { value: "cmyk", label: "CMYK" },
  { value: "autumn", label: "Autumn" },
  { value: "business", label: "Business" },
  { value: "acid", label: "Acid" },
  { value: "lemonade", label: "Lemonade" },
  { value: "night", label: "Night" },
  { value: "coffee", label: "Coffee" },
  { value: "winter", label: "Winter" },
  { value: "dim", label: "Dim" },
  { value: "nord", label: "Nord" },
  { value: "sunset", label: "Sunset" },
  { value: "caramellatte", label: "Caramel Latte" },
  { value: "abyss", label: "Abyss" },
  { value: "silk", label: "Silk" },
] as const;

const STORAGE_KEY = "bot-cherry-theme";
const DEFAULT_THEME = "dark";

function getInitialTheme(): string {
  const current = document.documentElement.dataset.theme;
  if (current) return current;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some((theme) => theme.value === stored)) return stored;

  return DEFAULT_THEME;
}

export default function ThemePicker({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = THEMES.find((item) => item.value === theme) ?? THEMES[1];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

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
        aria-label="Select a theme"
        onClick={() => setOpen((value) => !value)}
        className={`flex cursor-pointer items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-sm font-medium text-base-content shadow-sm transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
      >
        <span className="inline-block size-3 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <span className="truncate">{selected.label}</span>
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
          aria-label="DaisyUI themes"
          className="absolute right-0 z-50 mt-2 max-h-80 w-48 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1.5 shadow-xl"
        >
          {THEMES.map((item) => {
            const isSelected = item.value === theme;

            return (
              <li key={item.value} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setTheme(item.value);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-field px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-base-200 font-semibold text-base-content"
                      : "bg-transparent text-base-content hover:bg-base-200"
                  }`}
                >
                  <span>{item.label}</span>
                  {isSelected && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="size-4 text-primary"
                    >
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
