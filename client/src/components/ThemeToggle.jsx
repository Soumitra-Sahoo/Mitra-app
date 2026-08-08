import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-surface rounded-xl transition-theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          title={label}
          aria-pressed={theme === value}
          className={`flex items-center justify-center size-8 rounded-lg transition ${
            theme === value
              ? "bg-card text-primary shadow-sm"
              : "text-muted hover:text-foreground-secondary"
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;