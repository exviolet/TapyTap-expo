// src/components/HabitCard.tsx (ИСПРАВЛЕННАЯ ВЕРСИЯ)
import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from './ThemeProvider';
import { Habit } from '../lib/habits';
import * as LucideIcons from "lucide-react-native";

type RootStackParamList = {
    Habits: undefined;
    AddHabit: undefined;
    EditHabit: { habit: Habit };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "Habits">;

const iconMap: { [key: string]: React.ComponentType<any> } = {
    Book: LucideIcons.Book,
    Activity: LucideIcons.Activity,
    GraduationCap: LucideIcons.GraduationCap,
    Briefcase: LucideIcons.Briefcase,
    Music: LucideIcons.Music,
    Coffee: LucideIcons.Coffee,
    Sun: LucideIcons.Sun,
    Moon: LucideIcons.Moon,
    Star: LucideIcons.Star,
    Heart: LucideIcons.Heart,
    Lightbulb: LucideIcons.Lightbulb,
    Bell: LucideIcons.Bell,
    Archive: LucideIcons.Archive,
    Clock: LucideIcons.Clock,
    CheckSquare: LucideIcons.CheckSquare, // Добавим иконку по умолчанию
    // Добавьте другие иконки, если они используются
};

interface HabitCardProps {
    habit: Habit;
    onUpdateProgress: (habitId: string, newProgress: number, date: string) => void;
    onLongPress: (habit: Habit) => void;
    onPress: (habit: Habit) => void;
    currentDate: string;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onUpdateProgress, onLongPress, onPress, currentDate }) => {
    const theme = useContext(ThemeContext);
    if (!theme) throw new Error('ThemeContext must be used within ThemeProvider');
    const { colors } = theme;
    const navigation = useNavigation<NavigationProp>();

    const CurrentIcon = iconMap[habit.icon] || LucideIcons.CheckSquare;

    const progressPercentage = habit.target_completions > 0 ? (habit.progress / habit.target_completions) * 100 : 0;
    const isCompleted = habit.progress >= habit.target_completions && habit.target_completions > 0;

    const handleIncrement = () => {
        onUpdateProgress(habit.id, habit.progress + 1, currentDate);
    };

    const handleDecrement = () => {
        if (habit.progress > 0) {
            onUpdateProgress(habit.id, habit.progress - 1, currentDate);
        }
    };

    const handleComplete = () => {
        if (isCompleted) {
             onUpdateProgress(habit.id, 0, currentDate); // Сбрасываем прогресс, если уже выполнено
        } else {
             onUpdateProgress(habit.id, habit.target_completions, currentDate); // Мгновенно выполняем
        }
    }

    const cardBgColor = useSharedValue(colors.cardBackground);
    useEffect(() => {
        cardBgColor.value = withTiming(isCompleted ? colors.cardBackgroundCompleted : colors.cardBackground, { duration: 300 });
    }, [isCompleted, colors.cardBackground, colors.cardBackgroundCompleted]);

    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: cardBgColor.value,
        };
    });

    return (
        <TouchableOpacity
            onLongPress={() => onLongPress(habit)}
            onPress={() => onPress(habit)}
            style={styles.container}
            activeOpacity={0.8}
        >
            <Animated.View style={[styles.card, animatedCardStyle]}>
                <View style={[styles.iconContainer, { backgroundColor: isCompleted ? colors.accentFaded : (habit.categories[0]?.color || colors.accent) }]}>
                    <CurrentIcon size={28} color={isCompleted ? colors.accent : "#FFFFFF"} />
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                    {habit.description && (
                        <Text style={[styles.habitDescription, { color: colors.textFaded }]} numberOfLines={1}>{habit.description}</Text>
                    )}
                     <Text style={[styles.habitDescription, { color: colors.textFaded }]}>
                        {habit.categories.length > 0 ? habit.categories.map(c => c.name).join(', ') : "Без категории"}
                    </Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: colors.accent }]} />
                    </View>
                </View>
                <View style={styles.controlsContainer}>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                        {habit.progress}/{habit.target_completions} в день
                    </Text>
                    <View style={styles.buttonsRow}>
                        <TouchableOpacity onPress={handleDecrement} style={[styles.controlButton, { backgroundColor: colors.inputBackground }]}>
                            <Text style={{ color: colors.text }}>-1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleIncrement} style={[styles.controlButton, { backgroundColor: colors.inputBackground }]}>
                            <Text style={{ color: colors.text }}>+1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleComplete} style={[styles.completeButton, { backgroundColor: isCompleted ? colors.progressGreen : colors.inputBackground }]}>
                            <LucideIcons.Check size={20} color={isCompleted ? '#FFFFFF' : colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 4,
        alignItems: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    habitName: {
        fontSize: 17,
        fontWeight: '600',
    },
    habitDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    progressBar: {
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#E0E0E0',
        marginTop: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    controlsContainer: {
        marginLeft: 10,
        alignItems: 'flex-end',
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    buttonsRow: {
        flexDirection: 'row',
    },
    controlButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    completeButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
});

export default HabitCard;
