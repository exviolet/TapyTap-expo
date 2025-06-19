// src/screens/HabitDetailScreen.tsx
import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { useHabitStore } from '../store/useHabitStore';
import * as LucideIcons from 'lucide-react-native';
import { BarChart } from "react-native-gifted-charts";
import { format, subDays, startOfDay } from 'date-fns';

export default function HabitDetailScreen() {
    const { colors } = useContext(ThemeContext)!;
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { habitId, habitName } = route.params;

    const { streaks, allCompletions, habits } = useHabitStore();
    const habit = habits.find(h => h.id === habitId);
    
    // --- ДАННЫЕ ДЛЯ ГРАФИКА ---
    const chartData = useMemo(() => {
        if (!habit) return [];
        
        const today = startOfDay(new Date());
        const dataPoints = [];
        for (let i = 13; i >= 0; i--) {
            const date = subDays(today, i);
            const dateString = format(date, 'yyyy-MM-dd');
            const completion = allCompletions.find(c => c.habit_id === habitId && c.completion_date === dateString);
            const value = completion ? completion.completed_count : 0;
            
            dataPoints.push({ 
                value: value,
                label: format(date, 'd/MM'),
                topLabelComponent: () => <Text style={{color: colors.textFaded, fontSize: 10}}>{value}</Text>
            });
        }
        return dataPoints;
    }, [allCompletions, habitId, colors]);

    if (!habit) {
        return <View style={styles.container}><Text style={{color: colors.text}}>Привычка не найдена.</Text></View>
    }

    const currentStreak = streaks.get(habit.id) || 0;
    const totalCompletions = allCompletions.filter(c => c.habit_id === habit.id && c.completed_count >= habit.target_completions).length;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><LucideIcons.ChevronLeft size={28} color={colors.text} /></TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{habitName}</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.kpiContainer}>
                    <View style={[styles.kpiBox, {backgroundColor: colors.cardBackground}]}>
                        <LucideIcons.Flame size={24} color="#FF9500" />
                        <Text style={[styles.kpiValue, {color: colors.text}]}>{currentStreak}</Text>
                        <Text style={[styles.kpiLabel, {color: colors.textSecondary}]}>Текущая серия</Text>
                    </View>
                    <View style={[styles.kpiBox, {backgroundColor: colors.cardBackground}]}>
                        <LucideIcons.Trophy size={24} color={colors.success} />
                        <Text style={[styles.kpiValue, {color: colors.text}]}>{totalCompletions}</Text>
                        <Text style={[styles.kpiLabel, {color: colors.textSecondary}]}>Всего выполнено</Text>
                    </View>
                </View>

                <View style={[styles.card, {backgroundColor: colors.cardBackground}]}>
                     <Text style={[styles.cardTitle, { color: colors.text }]}>Прогресс за 2 недели</Text>
                      <BarChart
                        data={chartData}
                        barWidth={20}
                        barBorderRadius={4}
                        frontColor={habit.categories[0]?.color || colors.accent}
                        yAxisTextStyle={{ color: colors.textFaded }}
                        xAxisLabelTextStyle={{ color: colors.textFaded, fontSize: 10 }}
                        noOfSections={4}
                        isAnimated
                      />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', flex: 1, marginHorizontal: 10, },
    scrollContent: { padding: 16 },
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, gap: 16 },
    kpiBox: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
    kpiValue: { fontSize: 28, fontWeight: 'bold', marginVertical: 8 },
    kpiLabel: { fontSize: 14, fontWeight: '500' },
    card: { borderRadius: 16, padding: 20, paddingBottom: 30 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
});
