// src/components/HabitCard.tsx
import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from './ThemeProvider';
import { Habit } from '../lib/habits';
import {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart, Check,
    Lightbulb, Bell, Archive, PlusCircle, MinusCircle, Clock
} from "lucide-react-native";

type RootStackParamList = {
    Habits: undefined;
    AddHabit: undefined;
    EditHabit: { habit: Habit };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "Habits">;

// Маппинг иконок
const iconMap: { [key: string]: React.ComponentType<any> } = {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart,
    Lightbulb, Bell, Archive, Clock, PlusCircle, MinusCircle
};

interface HabitCardProps {
    habit: Habit;
    onUpdateProgress: (habitId: string, newProgress: number) => void;
    onDeleteHabit: (habitId: string) => void;
}

export default function HabitCard({ habit, onUpdateProgress, onDeleteHabit }: HabitCardProps) {
    const { colors } = useContext(ThemeContext); // Получаем цвета из контекста темы
    const navigation = useNavigation<NavigationProp>();

    const progressWidth = useSharedValue(0);
    const scale = useSharedValue(1);

    const targetCompletions = habit.target_completions || 1;
    const currentProgress = habit.progress;

    const animatedProgressStyle = useAnimatedStyle(() => {
        return {
            width: `${progressWidth.value}%`,
        };
    });

    const animatedCardScaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    useEffect(() => {
        const targetPercentage = (currentProgress / targetCompletions) * 100;
        const clampedPercentage = Math.min(100, Math.max(0, targetPercentage));
        progressWidth.value = withTiming(clampedPercentage, { duration: 400 });
    }, [currentProgress, targetCompletions, progressWidth]);

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const LucideIcon = iconMap[habit.icon || "Book"];

    return (
        <Animated.View style={[styles.cardWrapper, animatedCardScaleStyle]}>
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => navigation.navigate("EditHabit", { habit: habit })}
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
            >
                <View style={styles.iconContainer}>
                    <View style={[styles.iconBg, { borderColor: colors.accent, backgroundColor: colors.cardIconBackground }]}>
                        <LucideIcon size={28} color={colors.accent} strokeWidth={2} />
                    </View>
                </View>
                <View style={styles.content}>
                    <Text style={[styles.habitTitle, { color: colors.text }]}>{habit.name}</Text>
                    {habit.description && (
                        <Text style={[styles.subtitle, { color: colors.text }]}>{habit.description}</Text>
                    )}
                    <View style={styles.categoryContainer}>
                        {habit.categories && habit.categories.length > 0 ? (
                            habit.categories.map((cat) => {
                                const CategoryIcon = iconMap[cat.icon || "Book"];
                                return (
                                    <View key={cat.id} style={[styles.categoryChip, { backgroundColor: cat.color }]}>
                                        <CategoryIcon size={14} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 4 }} />
                                        <Text style={styles.categoryChipText}>{cat.name}</Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={[styles.subtitle, { color: colors.text }]}>Без категории</Text>
                        )}
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.inputBorder }]}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    animatedProgressStyle,
                                    { backgroundColor: colors.accent }
                                ]}
                            />
                        </View>
                        <View style={styles.progressRow}>
                            <Text style={[styles.progressCounterText, { color: colors.text }]}>{currentProgress} / {targetCompletions} в день</Text>
                            <View style={styles.progressButtons}>
                                <TouchableOpacity
                                    onPress={() => onUpdateProgress(habit.id, Math.max(0, currentProgress - 1))}
                                    style={[styles.progressButton, { backgroundColor: colors.inputBackground }]}
                                >
                                    <Text style={[styles.progressButtonText, { color: colors.text }]}>-1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => onUpdateProgress(habit.id, currentProgress + 1)}
                                    style={[styles.progressButton, { backgroundColor: colors.inputBackground }]}
                                >
                                    <Text style={[styles.progressButtonText, { color: colors.text }]}>+1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => onUpdateProgress(habit.id, targetCompletions)}
                                    style={[styles.progressButton, styles.completeButton]}
                                >
                                    <Text style={styles.progressButtonText}>✓</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    card: {
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
    },
    iconContainer: {
        justifyContent: "center",
        marginRight: 20,
    },
    iconBg: {
        borderRadius: 15,
        padding: 12,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        // backgroundColor теперь задается динамически
    },
    content: {
        flex: 1,
    },
    habitTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 8,
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
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 6,
        backgroundColor: "#4A4A6E", // Если этот цвет также должен меняться, его нужно получать из темы
    },
    categoryChipText: {
        fontSize: 13,
        color: "#FFFFFF",
        fontWeight: "500",
    },
    progressContainer: {
        marginTop: 15,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    progressCounterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    progressButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    progressButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    completeButton: {
        backgroundColor: '#4CAF50',
    },
    progressButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
        justifyContent: "center",
        alignItems: "center",
        width: 90,
        height: '100%',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        paddingHorizontal: 10,
    },
    deleteButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 4,
    },
});
