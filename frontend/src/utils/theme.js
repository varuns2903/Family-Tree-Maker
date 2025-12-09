// src/utils/theme.js

export const getInitialTheme = () => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;

  // Fallback: system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const toggleTheme = (isDark, setIsDark) => {
  const next = !isDark;
  setIsDark(next);

  if (typeof window !== "undefined") {
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }
};
