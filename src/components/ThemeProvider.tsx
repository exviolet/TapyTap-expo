// src/components/ThemeProvider.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ИНТЕРФЕЙС, ВКЛЮЧАЮЩИЙ НЕДОСТАЮЩИЕ СВОЙСТВА
export interface ColorPalette {
    background: string;
    text: string;
    textSecondary: string;
    textFaded: string;
    accent: string;
    accentFaded: string;
    inputBackground: string;
    border: string;
    inputBorder: string; // <-- ДОБАВЛЕНО
    cardBackground: string;
    cardIconBackground: string; // <-- ДОБАВЛЕНО
    cardBackgroundCompleted: string;
    tabBarBackground: string;
    tabBarActiveTint: string;
    tabBarInactiveTint: string;
    buttonText: string;
    progressRed: string;
    progressYellow: string;
    progressGreen: string;
    success: string;
    warning: string;
    danger: string;
}

interface ThemeContextType {
    theme: 'light' | 'dark' | 'system';
    colors: ColorPalette;
    toggleTheme: () => void;
    setAppTheme: (newTheme: 'light' | 'dark' | 'system') => void;
}

// Палитра для темной темы
const darkColors: ColorPalette = {
    background: "#121212",
    text: "#EAEAEA",
    textSecondary: "#A0A0A0",
    textFaded: "#777777",
    accent: "#BB86FC",
    accentFaded: '#3A2D4F',
    inputBackground: "#2C2C2C",
    border: "#2C2C2C",
    inputBorder: "#34394F", // <-- ДОБАВЛЕНО
    cardBackground: "#1E1E1E",
    cardIconBackground: "#2C314C", // <-- ДОБАВЛЕНО
    cardBackgroundCompleted: '#2A3B2E',
    tabBarBackground: "#1E1E1E",
    tabBarActiveTint: "#BB86FC",
    tabBarInactiveTint: "#707070",
    buttonText: '#FFFFFF',
    progressRed: "#EF5350",
    progressYellow: "#FFEE58",
    progressGreen: "#66BB6A",
    success: "#66BB6A",
    warning: "#FFEE58",
    danger: "#EF5350",
};

// Палитра для светлой темы
const lightColors: ColorPalette = {
    background: "#F7F8FA",
    text: "#121212",
    textSecondary: "#555555",
    textFaded: "#888888",
    accent: "#6A0DAD",
    accentFaded: '#E9D5FF',
    inputBackground: "#EEEEEE",
    border: "#EAEAEA",
    inputBorder: "#E0E0E0", // <-- ДОБАВЛЕНО
    cardBackground: "#FFFFFF",
    cardIconBackground: "#EEEEEE", // <-- ДОБАВЛЕНО
    cardBackgroundCompleted: '#E8F5E9',
    tabBarBackground: "#FFFFFF",
    tabBarActiveTint: "#6A0DAD",
    tabBarInactiveTint: "#A0A0A0",
    buttonText: '#FFFFFF',
    progressRed: "#F44336",
    progressYellow: "#FFC107",
    progressGreen: "#4CAF50",
    success: "#4CAF50",
    warning: "#FFC107",
    danger: "#D32F2F",
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('appTheme');
            if (savedTheme) {
                setCurrentTheme(savedTheme as 'light' | 'dark' | 'system');
            }
        };
        loadTheme();
    }, []);

    const setAppTheme = async (newTheme: 'light' | 'dark' | 'system') => {
        setCurrentTheme(newTheme);
        await AsyncStorage.setItem('appTheme', newTheme);
    };

    const toggleTheme = () => {
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        setAppTheme(nextTheme);
    };

    const colors = React.useMemo(() => {
        const themeToApply = currentTheme === 'system' ? systemColorScheme : currentTheme;
        return themeToApply === 'dark' ? darkColors : lightColors;
    }, [currentTheme, systemColorScheme]);

    const contextValue = {
        theme: currentTheme,
        colors,
        toggleTheme,
        setAppTheme,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};
