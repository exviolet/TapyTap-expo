// src/components/AnimatedTabBarButton.tsx
import React, { useEffect } from 'react';
import { GestureResponderEvent, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import * as LucideIcons from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useAnimatedProps } from 'react-native-reanimated';

interface AnimatedTabBarButtonProps {
    onPress: (event: GestureResponderEvent) => void;
    label: string;
    iconName: string;
    isFocused: boolean;
    // Цвета, переданные из AppNavigator
    activeTintColor: string;
    inactiveTintColor: string;
    backgroundColor: string; // Фон всей кнопки таббара
    accentColor: string;     // Акцентный цвет для индикатора
}

export default function AnimatedTabBarButton({
    onPress,
    label,
    iconName,
    isFocused,
    activeTintColor,
    inactiveTintColor,
    backgroundColor,
    accentColor,
}: AnimatedTabBarButtonProps) {
    // Shared value для анимации прогресса (0 для неактивного, 1 для активного)
    const animation = useSharedValue(isFocused ? 1 : 0);

    // Эффект для обновления shared value при изменении isFocused
    useEffect(() => {
        animation.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
    }, [isFocused, animation]);

    // Анимированный стиль для цвета иконки и текста
    const animatedTintStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            animation.value,
            [0, 1],
            [inactiveTintColor, activeTintColor] // Переключение между серым (inactive) и фиолетовым (active)
        );
        return {
            color: color,
        };
    });



    const animatedIconProps = useAnimatedProps(() => {
      const color = interpolateColor(
        animation.value,
        [0, 1],
        [inactiveTintColor, activeTintColor]
      );
      return { color };
    });

    // Анимированный стиль для индикатора активности (фиолетовая полоса)
    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: isFocused ? accentColor : 'transparent', // Фон - акцентный цвет, если активна
            width: withTiming(isFocused ? 30 : 0, { duration: 250 }), // Ширина полосы
            height: withTiming(isFocused ? 4 : 0, { duration: 250 }), // Высота полосы
            opacity: withTiming(isFocused ? 1 : 0, { duration: 250 }), // Прозрачность
            borderRadius: 2,
            position: 'absolute',
            top: 0, // Позиционируем сверху
            alignSelf: 'center', // Центрируем по горизонтали
        };
    });

    // Динамический импорт иконки Lucide
const RawIconComponent = LucideIcons[iconName as keyof typeof LucideIcons];
const IconComponent = (RawIconComponent || LucideIcons.HelpCircle) as LucideIcon;
const AnimatedLucideIcon = Animated.createAnimatedComponent(IconComponent);

    return (
        <TouchableOpacity
            onPress={onPress}
            // Каждая кнопка имеет фон цвета таббара.
            // Если вы хотите, чтобы фон кнопки менялся при нажатии, это нужно анимировать здесь.
            // Но исходя из вашего описания, фон самой кнопки остается неизменным (темным/светлым фоном таббара).
            style={[styles.container, { backgroundColor: backgroundColor }]}
            activeOpacity={1}
        >
            <Animated.View style={animatedIndicatorStyle} />

            <View style={styles.content}>
                <AnimatedLucideIcon size={24} animatedProps={animatedIconProps} />
                <Animated.Text style={[styles.label, animatedTintStyle]}>
                  {label}
                </Animated.Text>
                <Animated.Text style={[styles.label, animatedTintStyle]}>
                    {label}
                </Animated.Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        position: 'relative', // Важно для позиционирования Animated.View
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5, // Отступ для полосы сверху
    },
    label: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },
});
