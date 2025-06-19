// src/screens/StatisticsScreen.tsx
import React, { useContext, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { useHabitStore } from '../store/useHabitStore';
import { PieChart } from "react-native-gifted-charts";
import { subDays, startOfDay, isWithinInterval, format, parseISO, eachDayOfInterval, getDay, getMonth } from 'date-fns';
import { Svg, Rect } from 'react-native-svg';
import * as LucideIcons from "lucide-react-native";
import { Habit } from '../lib/habits';

const iconMap: any = LucideIcons;
const SQUARE_SIZE = 12;
const SQUARE_MARGIN = 3;
const SQUARE_MARGIN_MONTH = 65;

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
    
    const endDate = new Date(); // 19 июня 2025, 04:42 PM +05
    const startDate = subDays(endDate, 364); // 52 недели
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getColorForCount = (count: number) => {
        if (count === 0) return colors.inputBackground;
        if (count <= 2) return '#0e4429';
        if (count <= 4) return '#006d32';
        if (count <= 6) return '#26a641';
        return '#39d353';
    };
    
    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const shownMonths = new Set<number>();

    // Точный расчет максимального weekIndex
    const maxWeekIndex = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalMonths = new Set(allDays.map(d => getMonth(d))).size;

    return (
        <View style={styles.heatmapContainer}>
            <View style={{ flexDirection: 'row' }}>
                <View style={styles.weekdaysContainer}>
                    <Text style={[styles.weekdayText, { color: colors.textFaded }]}>Пн</Text>
                    <Text style={[styles.weekdayText, { color: colors.textFaded }]}>Ср</Text>
                    <Text style={[styles.weekdayText, { color: colors.textFaded }]}>Пт</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        <View style={styles.monthsContainer}>
                            {[...allDays].reverse().map((day) => {
                                const month = getMonth(day);
                                const dateString = format(day, 'yyyy-MM-dd');
                                if (!shownMonths.has(month)) {
                                    shownMonths.add(month);
                                    const monthIndex = totalMonths - shownMonths.size; // Индекс от конца
                                    return (
                                        <Text
                                            key={`month-${dateString}`}
                                            style={[styles.monthText, { left: monthIndex * (SQUARE_MARGIN_MONTH), color: colors.textSecondary }]}
                                        >
                                            {monthNames[month]}
                                        </Text>
                                    );
                                }
                                return null;
                            })}
                        </View>
                        <Svg height={7 * (SQUARE_SIZE + SQUARE_MARGIN)} width={(maxWeekIndex + 1) * (SQUARE_SIZE + SQUARE_MARGIN)}>
                            {allDays.map((day) => {
                                const dayOfWeek = (getDay(day) === 0 ? 6 : getDay(day) - 1); // Пн = 0, Вс = 6
                                const weekIndex = Math.floor((day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                                const dateString = format(day, 'yyyy-MM-dd');
                                const count = data.get(dateString) || 0;
                                return (
                                    <Rect
                                        key={dateString}
                                        x={weekIndex * (SQUARE_SIZE + SQUARE_MARGIN)}
                                        y={dayOfWeek * (SQUARE_SIZE + SQUARE_MARGIN)}
                                        width={SQUARE_SIZE}
                                        height={SQUARE_SIZE}
                                        rx={2}
                                        ry={2}
                                        fill={getColorForCount(count)}
                                    />
                                );
                            })}
                        </Svg>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};


export default function StatisticsScreen() {
    const { colors } = useContext(ThemeContext)!;
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const { allCompletions, habits, streaks, fetchAllCompletions, fetchHabits, calculateStreaks } = useHabitStore();

    useEffect(() => {
        if (user?.id) {
            fetchHabits(user.id);
            fetchAllCompletions(user.id).then(() => {
                // Рассчитываем стрики после загрузки всех данных
                calculateStreaks(user.id);
            });
        }
    }, [user?.id]);

    // --- ИСПРАВЛЕННАЯ ЛОГИКА ДЛЯ ДИАГРАММ ---
const chartData = useMemo(() => {
    const calculateProductivity = (days: number) => {
        if (habits.length === 0) return { pieData: [{ value: 0 }, { value: 100, color: colors.inputBackground }], text: "0%" };
        
        const today = startOfDay(new Date());
        const period = { start: subDays(today, days - 1), end: today };
        let totalPossible = 0;
        let totalCompleted = 0;

        for (let i = 0; i < days; i++) {
            const currentDate = subDays(today, i);
            const activeHabitsOnDay = habits.filter(h => parseISO(h.created_at) <= currentDate);
            totalPossible += activeHabitsOnDay.length; // Количество активных привычек на день
            
            const dayCompletions = allCompletions.filter(c => c.completion_date === format(currentDate, 'yyyy-MM-dd'));
            dayCompletions.forEach(comp => {
                const habit = activeHabitsOnDay.find(h => h.id === comp.habit_id);
                if (habit && comp.completed_count >= habit.target_completions) {
                    totalCompleted++;
                }
            });
        }

        const percentage = totalPossible > 0 ? Math.min(100, Math.round((totalCompleted / totalPossible) * 100)) : 0; // Ограничение до 100%
        
        return {
            pieData: [
                { value: percentage, color: colors.success },
                { value: 100 - percentage, color: colors.inputBackground }
            ],
            text: `${percentage}%`
        };
    };

    const weekly = calculateProductivity(7);
    const monthly = calculateProductivity(30);
    return { weeklyPieData: weekly.pieData, weeklyText: weekly.text, monthlyPieData: monthly.pieData, monthlyText: monthly.text };
}, [allCompletions, habits, colors]);

    const renderHabitItem = ({item}: {item: Habit}) => {
        const streakCount = streaks.get(item.id) || 0;
        const IconComponent = iconMap[item.icon] || LucideIcons.Star;

        return (
            <TouchableOpacity 
                style={[styles.habitRow, {backgroundColor: colors.cardBackground}]}
                onPress={() => navigation.navigate('HabitDetailScreen', { habitId: item.id, habitName: item.name })}
            >
                <View style={[styles.habitIcon, {backgroundColor: item.categories[0]?.color || colors.accent}]}>
                    <IconComponent size={20} color="#FFF"/>
                </View>
                <Text style={[styles.habitName, {color: colors.text}]}>{item.name}</Text>
                <View style={styles.streakContainer}>
                    <LucideIcons.Flame size={16} color={streakCount > 0 ? '#FF9500' : colors.textFaded} />
                    <Text style={[styles.streakText, {color: streakCount > 0 ? '#FF9500' : colors.textFaded}]}>{streakCount}</Text>
                </View>
            </TouchableOpacity>
        )
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
                        <PieChart
                            data={chartData.weeklyPieData}
                            donut
                            radius={60}
                            innerRadius={45}
                            centerLabelComponent={() => (
                                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style={{color: colors.text, fontSize: 22, fontWeight: 'bold'}}>{chartData.weeklyText}</Text>
                                </View>
                            )}
                            innerCircleColor={colors.cardBackground}
                        />
                        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Прошлая неделя</Text>
                    </View>
                    <View style={styles.pieChartWrapper}>
                        <PieChart
                            data={chartData.monthlyPieData}
                            donut
                            radius={60}
                            innerRadius={45}
                            centerLabelComponent={() => (
                                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style={{color: colors.text, fontSize: 22, fontWeight: 'bold'}}>{chartData.monthlyText}</Text>
                                </View>
                            )}
                            innerCircleColor={colors.cardBackground}
                        />
                        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Прошлый месяц</Text>
                    </View>
                 </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Анализ привычек</Text>
                <FlatList
                    data={habits}
                    keyExtractor={item => item.id}
                    renderItem={renderHabitItem}
                    scrollEnabled={false} // Отключаем скролл внутри ScrollView
                    ListEmptyComponent={<Text style={{color: colors.textSecondary, textAlign: 'center'}}>Нет активных привычек для анализа</Text>}
                />
            </View>
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
    card: { marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 20 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    heatmapContainer: { flexDirection: 'row', alignItems: 'center' },
    weekdaysContainer: { paddingRight: 5, justifyContent: 'space-around', paddingTop: 18 },
    weekdayText: { fontSize: 9, height: SQUARE_SIZE + SQUARE_MARGIN, textAlignVertical: 'center' },
    monthsContainer: { flexDirection: 'row', height: 16 },
    monthText: { position: 'absolute', fontSize: 10 },
    pieChartsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    pieChartWrapper: { alignItems: 'center' },
    chartLabel: { marginTop: 8, fontSize: 14, fontWeight: '500' },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    habitIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    habitName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 149, 0, 0.1)'
    },
    streakText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    }
});
