// src/components/ModeToggle.tsx
import React, { useContext } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { ThemeContext } from "./ThemeProvider";

export const ModeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <TouchableOpacity style={styles.button} onPress={toggleTheme}>
      <Text style={styles.text}>
        Переключить на {theme === "light" ? "тёмную" : "светлую"} тему
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 8,
    margin: 10,
  },
  text: {
    fontSize: 16,
  },
});
