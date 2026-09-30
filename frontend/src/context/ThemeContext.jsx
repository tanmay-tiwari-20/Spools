import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Theme can be 'dark', 'light', or 'system'
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("spools-theme") || "dark";
  });

  // isDarkMode is the actual active boolean mode (true for dark, false for light)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("spools-theme");
    if (saved === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return saved !== null ? saved === "dark" : true; // Default to dark mode
  });

  useEffect(() => {
    const applyTheme = () => {
      let isDark = true;
      if (theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = theme === "dark";
      }

      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => {
        setIsDarkMode(e.matches);
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("spools-theme", newTheme);
    let isDark = true;
    if (newTheme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = newTheme === "dark";
    }
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleColorMode = () => {
    const nextMode = isDarkMode ? "light" : "dark";
    setTheme(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        setTheme,
        toggleColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside provider
    const isDark = document.documentElement.classList.contains("dark");
    return {
      theme: isDark ? "dark" : "light",
      isDarkMode: isDark,
      setTheme: () => {},
      toggleColorMode: () => {
        const next = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("spools-theme", next ? "dark" : "light");
      },
    };
  }
  return context;
};

export default ThemeContext;
