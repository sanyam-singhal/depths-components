// components/site/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon } from "@tabler/icons-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // IMPORTANT: lock the first render to dark so SSR === first client paint
  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // suppress hydration warnings for the tiny label swap
      suppressHydrationWarning
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="fixed bottom-4 right-4 z-50 rounded-full border bg-background/80 backdrop-blur p-3 shadow-lg hover:shadow-xl transition"
    >
      {/* also suppress for the icon swap */}
      <span suppressHydrationWarning>
        {isDark ? <IconSun size={22} /> : <IconMoon size={22} />}
      </span>
    </button>
  );
}
