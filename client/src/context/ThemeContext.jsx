import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = "mitra-theme";
const VALID_THEMES = ["light", "dark", "system"];

const getSystemPrefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyThemeClass = (isDark) => {
  document.documentElement.classList.toggle("dark", isDark);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(stored) ? stored : "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === "system" ? (getSystemPrefersDark() ? "dark" : "light") : theme,
  );

  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      applyThemeClass(theme === "dark");
      return;
    }

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      setResolvedTheme(mql.matches ? "dark" : "light");
      applyThemeClass(mql.matches);
    };
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!VALID_THEMES.includes(next)) return;
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};