// src/components/ThemeProvider.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Установите: npm install @react-native-async-storage/async-storage

// Определяем интерфейс для цветовой палитры
interface ColorPalette {
    background: string;
    text: string;
    accent: string;
    inputBackground: string;
    inputBorder: string;
    cardBackground: string; // Добавим для карточек, если они будут
    cardIconBackground: string;
    tabBarBackground: string; // Фон нижней панели навигации
    tabBarActiveTint: string; // Цвет активной иконки/текста в нижней панели
    tabBarInactiveTint: string; // Цвет неактивной иконки/текста в нижней панели
    // Добавьте другие цвета по мере необходимости
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
    background: "#000000", // Чисто чёрный фон
    text: "#FFFFFF",     // Белый текст
    accent: "#6A0DAD",   // Яркий фиолетовый
    inputBackground: "#1A1A2E", // Тёмный фон для полей ввода
    inputBorder: "#3A3A5C",     // Более светлый фиолетовый для границ
    cardBackground: "#1A1A2E", // Тёмный фон для карточек привычек
    cardIconBackground: "#1A1A2E",
    tabBarBackground: "#000000", // Темный фон для нижней панели
    tabBarActiveTint: "#6A0DAD", // Фиолетовый для активных элементов
    tabBarInactiveTint: "#707070", // Более светлый серый для неактивных
};

const lightColors: ColorPalette = {
    background: "#F0F0F0", // Светло-серый фон
    text: "#333333",     // Тёмный текст
    accent: "#6A0DAD",   // Тот же фиолетовый акцент
    inputBackground: "#FFFFFF", // Белый фон для полей ввода
    inputBorder: "#CCCCCC",     // Светло-серый для границ
    cardBackground: "#FFFFFF", // Белый фон для карточек
    cardIconBackground: "#FFFFFF",
    tabBarBackground: "#FFFFFF", // Белый фон для нижней панели
    tabBarActiveTint: "#6A0DAD", // Фиолетовый для активных элементов
    tabBarInactiveTint: "#A0A0A0", // Серый для неактивных
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
