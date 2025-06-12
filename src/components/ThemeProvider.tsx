// src/components/ThemeProvider.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Установите: npm install @react-native-async-storage/async-storage

// Определяем интерфейс для цветовой палитры
export interface ColorPalette {
    background: string;
    text: string;
    accent: string;
    inputBackground: string;
    inputBorder: string;
    cardBackground: string;
    cardIconBackground: string;
    tabBarBackground: string;
    tabBarActiveTint: string;
    tabBarInactiveTint: string;
    textSecondary: string; // <-- ДОБАВЛЕНО
    textFaded: string;     // <-- ДОБАВЛЕНО
    border: string;        // <-- Также добавим border, который использовался в CalendarScreen
    // НОВЫЕ ЦВЕТА ДЛЯ ПРОГРЕССА КАЛЕНДАРЯ
    progressRed: string;   // Для 0% выполнения
    progressYellow: string; // Для частичного выполнения
    progressGreen: string; // Для 100% выполнения
}

// Определяем интерфейс для контекста темы
interface ThemeContextType {
    theme: 'light' | 'dark' | 'system';
    colors: ColorPalette;
    toggleTheme: () => void;
    setAppTheme: (newTheme: 'light' | 'dark' | 'system') => void;
}

// Определяем палитры цветов в стиле Obsidian
const darkColors: ColorPalette = {
    background: "#000000",
    text: "#FFFFFF",
    accent: "#6A0DAD",
    inputBackground: "#1A1A2E",
    inputBorder: "#3A3A5C",
    cardBackground: "#1A1A2E",
    cardIconBackground: "#1A1A2E",
    tabBarBackground: "#000000",
    tabBarActiveTint: "#6A0DAD",
    tabBarInactiveTint: "#707070",
    textSecondary: "#A0A0A0", // <-- ДОБАВЛЕНО: примерное значение для темной темы
    textFaded: "#707070",     // <-- ДОБАВЛЕНО: примерное значение для темной темы
    border: "#3A3A5C",        // <-- ДОБАВЛЕНО: используем похожий на inputBorder
    progressRed: "#FF3B30",     // Красный
    progressYellow: "#FFCC00",  // Желтый
    progressGreen: "#4CAF50",   // Зеленый
};

const lightColors: ColorPalette = {
    background: "#F0F0F0",
    text: "#333333",
    accent: "#6A0DAD",
    inputBackground: "#FFFFFF",
    inputBorder: "#CCCCCC",
    cardBackground: "#FFFFFF",
    cardIconBackground: "#FFFFFF",
    tabBarBackground: "#FFFFFF",
    tabBarActiveTint: "#6A0DAD",
    tabBarInactiveTint: "#A0A0A0",
    textSecondary: "#666666", // <-- ДОБАВЛЕНО: примерное значение для светлой темы
    textFaded: "#999999",     // <-- ДОБАВЛЕНО: примерное значение для светлой темы
    border: "#CCCCCC",        // <-- ДОБАВЛЕНО: используем похожий на inputBorder
    progressRed: "#FF3B30",     // Красный
    progressYellow: "#FFCC00",  // Желтый
    progressGreen: "#4CAF50",   // Зеленый
};

export const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    colors: darkColors, // Значение по умолчанию, будет перезаписано
    toggleTheme: () => {},
    setAppTheme: () => {},
});

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    // Получаем системную тему устройства
    const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null

    // Состояние для выбранной пользователем темы ('light', 'dark', 'system')
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');

    // Эффект для загрузки сохранённой темы при старте
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('appTheme');
                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
                    setCurrentTheme(savedTheme);
                } else {
                    // Если нет сохранённой темы, используем системную
                    setCurrentTheme('system');
                }
            } catch (error) {
                console.error("Failed to load theme from AsyncStorage", error);
                setCurrentTheme('system'); // В случае ошибки, установить системную
            }
        };
        loadTheme();
    }, []);

    // Функция для установки темы и сохранения её
    const setAppTheme = async (newTheme: 'light' | 'dark' | 'system') => {
        setCurrentTheme(newTheme);
        try {
            await AsyncStorage.setItem('appTheme', newTheme);
        } catch (error) {
            console.error("Failed to save theme to AsyncStorage", error);
        }
    };

    // Функция для циклического переключения тем: Light -> Dark -> System -> Light
    const toggleTheme = () => {
        setCurrentTheme(prevTheme => {
            let nextTheme: 'light' | 'dark' | 'system';
            if (prevTheme === 'light') {
                nextTheme = 'dark';
            } else if (prevTheme === 'dark') {
                nextTheme = 'system';
            } else { // prevTheme === 'system'
                nextTheme = 'light';
            }
            setAppTheme(nextTheme); // Сохраняем новую тему
            return nextTheme;
        });
    };

    // Определяем текущие цвета на основе выбранной темы
    const colors = React.useMemo(() => {
        if (currentTheme === 'dark') {
            return darkColors;
        } else if (currentTheme === 'light') {
            return lightColors;
        } else { // 'system'
            return systemColorScheme === 'dark' ? darkColors : lightColors;
        }
    }, [currentTheme, systemColorScheme]);

    const contextValue = React.useMemo(() => ({
        theme: currentTheme,
        colors,
        toggleTheme,
        setAppTheme,
    }), [currentTheme, colors, toggleTheme, setAppTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};
