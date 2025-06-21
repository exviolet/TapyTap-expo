// src/components/Heatmap.tsx
import React, { useContext, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ThemeContext } from './ThemeProvider';
import { HabitCompletionRecord } from '../store/useHabitStore';
import { Habit } from '@/lib/habits';
import { Svg, Rect } from 'react-native-svg';
import { format, parseISO, subDays, getDay, getMonth, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

const Heatmap: React.FC<{ habit: Habit | null; completions: HabitCompletionRecord[] }> = ({ habit, completions }) => {
    const { colors } = useContext(ThemeContext)!;

    const data = useMemo(() => {
        const countsByDate: Map<string, number> = new Map();
        if (!habit) return countsByDate;

        completions
            .filter(c => c.habit_id === habit.id)
            .forEach(comp => {
                if (comp.completed_count > 0) {
                    countsByDate.set(comp.completion_date, (countsByDate.get(comp.completion_date) || 0) + comp.completed_count);
                }
            });
        return countsByDate;
    }, [completions, habit]);

    const endDate = new Date();
    const startDate = subDays(endDate, 364); // 52 недели
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    const habitColor = habit?.categories[0]?.color || colors.accent;
    const getColorForCount = (count: number) => {
        if (count === 0) return colors.inputBackground;
        const opacity = Math.min(1, count / 5);
        return count > 0 ? `${habitColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}` : colors.inputBackground;
    };

    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const shownMonths = new Set<number>();
    const maxWeekIndex = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

    return (
        <View style={styles.heatmapOuterContainer}>
            <View style={{ flexDirection: 'row' }}>
                <View style={styles.weekdaysContainer}>
                    <Text style={styles.weekdayText}>Пн</Text>
                    <Text style={styles.weekdayText}>Ср</Text>
                    <Text style={styles.weekdayText}>Пт</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        <View style={styles.monthsContainer}>
                            {[...allDays].reverse().map((day, index) => {
                                const month = getMonth(day);
                                const dateString = format(day, 'yyyy-MM-dd');
                                const weekIndex = Math.floor((day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

                                if (!shownMonths.has(month)) {
                                    shownMonths.add(month);
                                    const totalMonths = new Set(allDays.map(d => getMonth(d))).size;
                                    return (
                                        <Text
                                            key={`month-${dateString}`}
                                            style={[styles.monthText, { left: (totalMonths - shownMonths.size) * 63, color: colors.textSecondary }]}
                                        >
                                            {monthNames[month]}
                                        </Text>
                                    );
                                }
                                return null;
                            })}
                        </View>
                        <Svg height={7 * 14} width={(maxWeekIndex + 1) * 14}>
                            {allDays.map((day, index) => {
                                const dayOfWeek = getDay(day);
                                const weekIndexRaw = Math.floor((day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                                const weekIndex = Math.min(weekIndexRaw, maxWeekIndex);
                                const dateString = format(day, 'yyyy-MM-dd');
                                const count = data.get(dateString) || 0;
                                const isToday = dateString === format(endDate, 'yyyy-MM-dd');

                                return (
                                    <Rect
                                        key={dateString}
                                        x={weekIndex * 14}
                                        y={dayOfWeek * 14}
                                        width={10}
                                        height={10}
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

const styles = StyleSheet.create({
    heatmapOuterContainer: { marginHorizontal: 16, marginTop: 10, padding: 10 },
    weekdaysContainer: { paddingRight: 8, justifyContent: 'space-around' },
    weekdayText: { fontSize: 10, height: 14, textAlignVertical: 'center', color: '#999' },
    monthsContainer: { flexDirection: 'row', height: 14, marginBottom: 2 },
    monthText: { position: 'absolute', fontSize: 10 },
});

export default Heatmap;
