// src/components/HabitCalendarItem.tsx
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from './ThemeProvider';
import { Habit } from '../lib/habits';
import { CheckCircle, XCircle, Slash } from 'lucide-react-native'; // Добавим Slash для не начатых
import {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart, Check,
    Lightbulb, Bell, Archive, PlusCircle, MinusCircle, Clock
} from "lucide-react-native";

// Маппинг иконок
const iconMap: { [key: string]: React.ComponentType<any> } = {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart, Check,
    Lightbulb, Bell, Archive, Clock, PlusCircle, MinusCircle, Slash, XCircle
};

interface HabitCalendarItemProps {
    habit: Habit; // Привычка с текущим прогрессом за выбранную дату
    onPress: (habit: Habit) => void; // Добавим пропс для обработки нажатия
}

export default function HabitCalendarItem({ habit, onPress }: HabitCalendarItemProps) {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('HabitCalendarItem must be used within a ThemeProvider');
    }
    const { colors } = context;

    const targetCompletions = habit.target_completions || 1;
    const currentProgress = habit.target_completions; // Это progress за выбранную дату, который уже должен быть подставлен

    const isCompleted = currentProgress >= targetCompletions && targetCompletions > 0;
    const isPartial = currentProgress > 0 && currentProgress < targetCompletions;
    const isNotStarted = currentProgress === 0;

    const LucideIcon = iconMap[habit.icon || "Book"];

    return (
        <TouchableOpacity
            onPress={() => onPress(habit)} // Используем переданный onPress
            style={[styles.itemContainer, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]}
            activeOpacity={0.8}
        >
            <View style={styles.iconAndTitle}>
                <View style={[styles.iconBg, { borderColor: colors.accent, backgroundColor: colors.cardIconBackground }]}>
                    <LucideIcon size={24} color={colors.accent} strokeWidth={2} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                    {habit.description && (
                        <Text style={[styles.habitDescription, { color: colors.textSecondary }]}>{habit.description}</Text>
                    )}
                    <View style={styles.categoryContainer}>
                        {habit.categories && habit.categories.length > 0 ? (
                            habit.categories.map((cat) => {
                                const CategoryIcon = iconMap[cat.icon || "Book"]; // Используем тот же iconMap
                                return (
                                    <View key={cat.id} style={[styles.categoryChip, { backgroundColor: cat.color }]}>
                                        <CategoryIcon size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.categoryChipText}>{cat.name}</Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={[styles.habitDescription, { color: colors.textSecondary }]}>Без категории</Text>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.statusContainer}>
                <Text style={[styles.progressText, { color: colors.text }]}>
                    {currentProgress} / {targetCompletions}
                </Text>
                {isCompleted ? (
                    <CheckCircle size={24} color={colors.progressGreen} />
                ) : isPartial ? (
                    <Slash size={24} color={colors.progressYellow} /> // Иконка для частичного выполнения
                ) : (
                    <XCircle size={24} color={colors.progressRed} />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    iconAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBg: {
        borderRadius: 10,
        padding: 8,
        marginRight: 10,
        borderWidth: 1.5,
    },
    textContainer: {
        flex: 1,
    },
    habitName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    habitDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    categoryContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 4,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
    },
    categoryChipText: {
        fontSize: 11,
        color: "#FFFFFF",
        fontWeight: "500",
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    progressText: {
        fontSize: 14,
        marginRight: 8,
    },
});
