// src/screens/StatisticsScreen.tsx
import React, { useContext, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { ThemeContext } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { useHabitStore } from '../store/useHabitStore';
import { PieChart } from "react-native-gifted-charts";
import { subDays, startOfDay, isWithinInterval, format, parseISO, eachDayOfInterval, getDay } from 'date-fns';
import { Svg, Rect } from 'react-native-svg';

const SQUARE_SIZE = 16;
const SQUARE_MARGIN = 4;
const weekDays = ['Пн', 'Ср', 'Пт']; // Отображаем только некоторые дни недели для чистоты

// Новый, улучшенный компонент Heatmap
const GitHubStyleHeatmap = () => {
    const { colors } = useContext(ThemeContext)!;
    const { allCompletions, habits } = useHabitStore();

    const data = useMemo(() => {
        const countsByDate: Map<string, number> = new Map();
        allCompletions.forEach(comp => {
            const habit = habits.find(h => h.id === comp.habit_id);
            if (habit && comp.completed_count >= habit.target_completions) {
                const date = comp.completion_date;
                countsByDate.set(date, (countsByDate.get(date) || 0) + 1);
            }
        });
        return countsByDate;
    }, [allCompletions, habits]);
    
    const today = startOfDay(new Date());
    const yearAgo = startOfDay(subDays(today, 364));
    const allDays = eachDayOfInterval({ start: yearAgo, end: today });

    const getColorForCount = (count: number) => {
        if (count === 0) return colors.inputBackground;
        if (count <= 1) return '#0e4429';
        if (count <= 3) return '#006d32';
        if (count <= 5) return '#26a641';
        return '#39d353';
    };

    return (
        <View style={styles.heatmapContainer}>
            <View style={styles.weekdaysContainer}>
                {weekDays.map(day => <Text key={day} style={[styles.weekdayText, {color: colors.textSecondary}]}>{day}</Text>)}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Svg height={7 * (SQUARE_SIZE + SQUARE_MARGIN)} width={allDays.length / 7 * (SQUARE_SIZE + SQUARE_MARGIN)}>
                    {allDays.map((day, index) => {
                        const dayOfWeek = (getDay(day) + 6) % 7; // Понедельник = 0
                        const weekIndex = Math.floor(index / 7);
                        const dateString = format(day, 'yyyy-MM-dd');
                        const count = data.get(dateString) || 0;
                        
                        return (
                            <Rect
                                key={dateString}
                                x={weekIndex * (SQUARE_SIZE + SQUARE_MARGIN)}
                                y={dayOfWeek * (SQUARE_SIZE + SQUARE_MARGIN)}
                                width={SQUARE_SIZE} height={SQUARE_SIZE}
                                fill={getColorForCount(count)}
                                rx={3} ry={3}
                            />
                        );
                    })}
                </Svg>
            </ScrollView>
        </View>
    );
};


export default function StatisticsScreen() {
    const { colors } = useContext(ThemeContext)!;
    const { user } = useAuth();
    const { allCompletions, habits, fetchAllCompletions, fetchHabits } = useHabitStore();

    useEffect(() => {
        if (user?.id) {
            // Загружаем и привычки, и выполнения для точного расчета
            fetchHabits(user.id);
            fetchAllCompletions(user.id);
        }
    }, [user?.id, fetchAllCompletions, fetchHabits]);

    const chartData = useMemo(() => {
        const today = startOfDay(new Date());
        
        // --- Логика для круговых диаграмм ---
        const calculateProductivity = (days: number) => {
            if (habits.length === 0) return { pieData: [{ value: 0 }, { value: 1, color: colors.inputBackground }], percentageText: "0%" };
            
            const period = { start: subDays(today, days - 1), end: today };
            const periodCompletions = allCompletions.filter(c => isWithinInterval(parseISO(c.completion_date), period));
            
            let totalPossible = 0;
            let totalCompleted = 0;

            for(let i = 0; i < days; i++) {
                const currentDate = subDays(today, i);
                const dateString = format(currentDate, 'yyyy-MM-dd');
                const activeHabitsOnDay = habits.filter(h => parseISO(h.created_at) <= currentDate);
                totalPossible += activeHabitsOnDay.length;
            }

            periodCompletions.forEach(comp => {
                 const habit = habits.find(h => h.id === comp.habit_id);
                 if (habit && comp.completed_count >= habit.target_completions) {
                     totalCompleted++;
                 }
            });

            const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
            
            return {
                pieData: [
                    { value: percentage, color: colors.success },
                    { value: 100 - percentage, color: colors.inputBackground }
                ],
                percentageText: `${percentage}%`
            };
        };

        const weekly = calculateProductivity(7);
        const monthly = calculateProductivity(30);

        return { weeklyPieData: weekly.pieData, weeklyText: weekly.percentageText, monthlyPieData: monthly.pieData, monthlyText: monthly.percentageText };

    }, [allCompletions, habits, colors]);

    if (!user || (habits.length === 0 && allCompletions.length === 0)) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                 <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Статистика</Text>
                </View>
                <View style={styles.center}>
                    <Text style={{color: colors.textSecondary}}>Недостаточно данных для статистики.</Text>
                </View>
            </View>
        );
    }
    
    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Статистика</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Карта активности</Text>
                <GitHubStyleHeatmap />
            </View>
            
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                 <Text style={[styles.cardTitle, { color: colors.text }]}>Общая продуктивность</Text>
                 <View style={styles.pieChartsContainer}>
                    <View style={styles.pieChartWrapper}>
                        <PieChart data={chartData.weeklyPieData} donut radius={60} innerRadius={45} centerLabelComponent={() => <Text style={{color: colors.text, fontSize: 22, fontWeight: 'bold'}}>{chartData.weeklyText}</Text>} />
                        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Прошлая неделя</Text>
                    </View>
                    <View style={styles.pieChartWrapper}>
                        <PieChart data={chartData.monthlyPieData} donut radius={60} innerRadius={45} centerLabelComponent={() => <Text style={{color: colors.text, fontSize: 22, fontWeight: 'bold'}}>{chartData.monthlyText}</Text>} />
                        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Прошлый месяц</Text>
                    </View>
                 </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
    card: { marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 20 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    heatmapContainer: { flexDirection: 'row', alignItems: 'center' },
    weekdaysContainer: { paddingRight: 8 },
    weekdayText: { fontSize: 10, height: SQUARE_SIZE, textAlignVertical: 'center', marginBottom: SQUARE_MARGIN },
    pieChartsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    pieChartWrapper: { alignItems: 'center' },
    chartLabel: { marginTop: 8, fontSize: 14, fontWeight: '500' }
});
