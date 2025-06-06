// src/components/ThemeProvider.tsx
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    text: string;
    accent: string;
    inputBackground: string;
    inputBorder: string;
  };
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  colors: {
    background: "#1A1A2E",
    text: "#FFFFFF",
    accent: "#6A0DAD",
    inputBackground: "#2A2A3E",
    inputBorder: "#3A3A5C",
  },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("dark");

  const colors = {
    light: {
      background: "#FFFFFF",
      text: "#000000",
      accent: "#6A0DAD",
      inputBackground: "#F5F5F5",
      inputBorder: "#DDDDDD",
    },
    dark: {
      background: "#1A1A2E",
      text: "#FFFFFF",
      accent: "#6A0DAD",
      inputBackground: "#2A2A3E",
      inputBorder: "#3A3A5C",
    },
  };

  useEffect(() => {
    AsyncStorage.getItem("theme").then((savedTheme) => {
      if (savedTheme) setTheme(savedTheme as Theme);
    });
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: colors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};
