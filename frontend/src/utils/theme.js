export const getInitialTheme = () => {
  const stored = localStorage.getItem("theme");
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const toggleTheme = (isDark, setIsDark) => {
  const newVal = !isDark;
  setIsDark(newVal);
  localStorage.setItem("theme", newVal ? "dark" : "light");

  if (newVal) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
};
