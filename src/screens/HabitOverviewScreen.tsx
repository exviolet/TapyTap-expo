// src/screens/HabitOverviewScreen.tsx
import React, { useContext, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from "@react-navigation/stack";
import { useRoute, useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { useHabitStore } from '../store/useHabitStore';
import { Habit } from '@/lib/habits';
import * as LucideIcons from 'lucide-react-native';
import Heatmap from '../components/Heatmap';

type RootStackParamList = {
  Habits: undefined;
  SortCategories: undefined;
  SortHabits: { categoryId: string; categoryName: string };
  HabitOverviewScreen: { habitId: string; habitName: string };
  EditHabit: { habit: Habit };
};

type HabitOverviewNavProp = StackNavigationProp<RootStackParamList, 'HabitOverviewScreen'>;


export default function HabitOverviewScreen() {
    const { colors } = useContext(ThemeContext)!;

    const navigation = useNavigation<HabitOverviewNavProp>();
    const route = useRoute<any>();
    const { habitId, habitName } = route.params;

    const { habits, allCompletions, streaks } = useHabitStore();
    const habit = habits.find(h => h.id === habitId);
    const currentStreak = streaks.get(habitId) || 0;
    const totalCompletions = allCompletions.filter(c => c.habit_id === habitId && c.completed_count >= (habit?.target_completions || 1)).length;

    const reminders = useMemo(() => {
        if (!habit?.frequency || typeof habit.frequency !== 'string') return [];
        try {
            return JSON.parse(habit.frequency) || [];
        } catch {
            return [];
        }
    }, [habit?.frequency]);

    if (!habit) return <View><Text>Привычка не найдена</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><LucideIcons.ChevronLeft size={28} color={colors.text} /></TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{habitName}</Text>
                <View style={{ width: 28 }} />
            </View>
            <ScrollView style={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Описание</Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}>{habit.description || 'Нет описания'}</Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Напоминания</Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                        {reminders.length > 0 ? reminders.map((r: any) => `${r.time} (${r.days.join(', ')})`).join('; ') : 'Нет напоминаний'}
                    </Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Прогресс</Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                        Цель: {habit.target_completions} {habit.unit || 'раз'}, Выполнено: {totalCompletions}
                    </Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Текущая серия</Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}>{currentStreak} дней</Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Теплокарта</Text>
                    <Heatmap habit={habit} completions={allCompletions} />
                </View>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('EditHabit', { habit })}>
                    <Text style={styles.editButtonText}>Редактировать</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    scrollContent: { padding: 16 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    sectionText: { fontSize: 16 },
    editButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    editButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
