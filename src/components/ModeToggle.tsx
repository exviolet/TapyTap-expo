// src/components/ModeToggle.tsx
import React, { useContext } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { ThemeContext } from './ThemeProvider'; // Путь к вашему ThemeProvider

const ModeToggle = () => {
    const { theme, toggleTheme, colors } = useContext(ThemeContext);

    // Определяем иконку в зависимости от текущей темы
    let IconComponent;
    if (theme === 'dark' || (theme === 'system' && colors.background === '#000000')) {
        IconComponent = LucideIcons["Sun"]; // Если тема темная (или системная темная), показываем солнце (чтобы переключить на светлую)
    } else {
        IconComponent = LucideIcons["Moon"]; // Если тема светлая (или системная светлая), показываем луну (чтобы переключить на темную)
    }

    return (
        <TouchableOpacity onPress={toggleTheme} style={styles.container}>
            <IconComponent size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        marginRight: 10, // Отступ от края экрана или других элементов
    },
});

export default ModeToggle;
