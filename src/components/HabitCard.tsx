// src/components/HabitCard.tsx
import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ThemeContext } from './ThemeProvider';
import { Habit } from '../lib/habits';
import * as LucideIcons from "lucide-react-native";

interface HabitCardProps {
    habit: Habit;
    streak: number;
    onUpdateProgress: (habitId: string, newProgress: number) => void;
    onLongPress: (habit: Habit) => void;
    onPress: (habit: Habit) => void; // Уже правильно определено
}

const iconMap: any = LucideIcons;
const dayLabels = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };

const HabitCard: React.FC<HabitCardProps> = ({ habit, streak, onUpdateProgress, onLongPress, onPress }) => { // Добавлено onPress
    const { colors } = useContext(ThemeContext)!;
    const isCompleted = habit.progress >= habit.target_completions;

    const handleUpdate = (newValue: number) => {
        onUpdateProgress(habit.id, Math.max(0, newValue));
    };

    const handleCheckoff = () => {
        handleUpdate(isCompleted ? 0 : habit.target_completions);
    };
    
    const animatedCardStyle = useAnimatedStyle(() => ({
        backgroundColor: withTiming(isCompleted ? colors.cardBackgroundCompleted : colors.cardBackground, { duration: 300 })
    }));

    const CurrentIcon = iconMap[habit.icon] || LucideIcons.CheckSquare;

    return (
        <TouchableOpacity onPress={() => onPress(habit)} onLongPress={() => onLongPress(habit)} activeOpacity={0.8} style={styles.container}>
            <Animated.View style={[styles.card, animatedCardStyle, { borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: isCompleted ? colors.accentFaded : (habit.categories[0]?.color || colors.accent) }]}>
                    <CurrentIcon size={28} color={isCompleted ? colors.accent : "#FFFFFF"} />
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                        {streak > 0 && (
                            <View style={styles.streakContainer}>
                                <LucideIcons.Flame size={14} color="#FF9500" />
                                <Text style={styles.streakText}>{streak}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.categoriesRow}>
                        {habit.categories?.slice(0, 2).map(cat => (
                            <View key={cat.id} style={[styles.categoryChip, { backgroundColor: cat.color + '20' }]}>
                                <Text style={[styles.categoryChipText, { color: cat.color }]}>{cat.name}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.progressBar, {backgroundColor: colors.inputBackground}]}>
                        <View style={[styles.progressFill, { width: `${(habit.progress / habit.target_completions) * 100}%`, backgroundColor: colors.accent }]} />
                    </View>
                </View>

                <View style={styles.controlsContainer}>
                    {habit.type === 'quantitative' ? (
                        <>
                            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                                {`${habit.progress}/${habit.target_completions} ${habit.unit || ''}`}
                            </Text>
                            <View style={styles.buttonsRow}>
                                <TouchableOpacity onPress={() => handleUpdate(habit.progress - 1)} style={[styles.controlButton, { backgroundColor: colors.inputBackground }]}>
                                    <LucideIcons.Minus size={20} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleUpdate(habit.progress + 1)} style={[styles.controlButton, { backgroundColor: colors.inputBackground }]}>
                                    <LucideIcons.Plus size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <TouchableOpacity onPress={handleCheckoff} style={[styles.checkoffButton, { backgroundColor: isCompleted ? colors.success : colors.inputBackground }]}>
                            <LucideIcons.Check size={28} color={isCompleted ? '#FFF' : colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { marginHorizontal: 16, marginVertical: 8 },
    card: { flexDirection: 'row', padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
    iconContainer: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    detailsContainer: { flex: 1, justifyContent: 'center' },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    habitName: {
        fontSize: 17,
        fontWeight: '600',
        marginRight: 8,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 149, 0, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    streakText: {
        color: '#FF9500',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    categoriesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    categoryChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginRight: 6,
        marginBottom: 4,
    },
    categoryChipText: {
        fontSize: 11,
        fontWeight: '600',
    },
    categoryText: { fontSize: 13, marginBottom: 8 },
    progressBar: { height: 5, borderRadius: 2.5, overflow: 'hidden' },
    progressFill: { height: '100%' },
    controlsContainer: { marginLeft: 10, alignItems: 'flex-end' },
    progressText: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
    buttonsRow: { flexDirection: 'row', gap: 8 },
    controlButton: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    checkoffButton: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});

export default HabitCard;
