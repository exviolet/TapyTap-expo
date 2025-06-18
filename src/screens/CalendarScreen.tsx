// src/screens/CalendarScreen.tsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Pressable, ScrollView } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../components/ThemeProvider";
import { useHabitStore, HabitCompletionRecord } from "../store/useHabitStore";
import { Habit } from '../lib/habits';
import { useAuth } from '../contexts/AuthContext';
import * as LucideIcons from "lucide-react-native";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays, getMonth } from 'date-fns';
import { CircularProgressDay } from '../components/CircularProgressDay';
import { ru } from 'date-fns/locale';
import { Svg, Rect } from 'react-native-svg';

// Настройка локализации для календаря
LocaleConfig.locales['ru'] = {
  monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  monthNamesShort: ['Янв.','Фев.','Март','Апр.','Май','Июнь','Июль','Авг.','Сен.','Окт.','Ноя.','Дек.'],
  dayNames: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  dayNamesShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сегодня'
};
LocaleConfig.defaultLocale = 'ru';

// --- НОВЫЙ, УЛУЧШЕННЫЙ КОМПОНЕНТ HEATMAP ---
const GitHubStyleHeatmap = ({ habit, completions }: { habit: Habit | null, completions: HabitCompletionRecord[] }) => {
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
    const startDate = subDays(endDate, 364); // 52 недели = 364 дня, чтобы избежать лишнего дня
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Цвета Heatmap основаны на цвете привычки
    const habitColor = habit?.categories[0]?.color || colors.accent;
    const getColorForCount = (count: number) => {
        if (count === 0) return colors.inputBackground;
        const opacity = Math.min(1, count / 5); // Максимальная интенсивность при 5+ выполнений
        return count > 0 ? `${habitColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}` : colors.inputBackground;
    };
    
    // Названия месяцев для подписей
    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const shownMonths = new Set<number>();

    // Точный расчет максимального weekIndex
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
                                const weekIndex = Math.min(weekIndexRaw, maxWeekIndex); // Ограничение weekIndex
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

export default function CalendarScreen() {
    const { colors, theme } = useContext(ThemeContext)!;
    const { habits, allCompletions, isLoadingHabits, fetchAllCompletions, fetchHabits, updateHabitProgress } = useHabitStore();
    const { user } = useAuth();
    
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [isSelectorVisible, setSelectorVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    useFocusEffect(useCallback(() => { if (user?.id) { fetchHabits(user.id); fetchAllCompletions(user.id); } }, [user?.id]));
    useEffect(() => { if (!selectedHabit && habits.length > 0) setSelectedHabit(habits[0]); }, [habits, selectedHabit]);
    
    const progressMap = useMemo(() => {
        const map = new Map<string, number>();
        if (!selectedHabit) return map;
        allCompletions.forEach(comp => {
            if (comp.habit_id === selectedHabit.id) {
                const progress = comp.completed_count / selectedHabit.target_completions;
                map.set(comp.completion_date, Math.min(1, progress));
            }
        });
        return map;
    }, [allCompletions, selectedHabit]);

    const handleUpdateDay = (dateString: string) => {
        if (!selectedHabit) return;
        const currentProgress = progressMap.get(dateString) || 0;
        let newProgressValue;

        if (selectedHabit.type === 'checkoff') {
            newProgressValue = currentProgress >= 1 ? 0 : selectedHabit.target_completions;
        } else {
            const currentCount = currentProgress * selectedHabit.target_completions;
            newProgressValue = currentCount + 1;
        }
        updateHabitProgress(selectedHabit.id, newProgressValue, dateString);
    };

    const handleSelectHabit = (habit: Habit) => { setSelectedHabit(habit); setSelectorVisible(false); };

    const SelectedIcon: React.ComponentType<{ size: number; color: string }> = selectedHabit
        ? (LucideIcons[selectedHabit.icon as keyof typeof LucideIcons] as React.ComponentType<{ size: number; color: string }>) || LucideIcons.Star
        : LucideIcons.Activity;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TouchableOpacity style={styles.headerContainer} onPress={() => setSelectorVisible(true)} disabled={habits.length === 0}>
                <View style={styles.headerContent}>
                    {selectedHabit && (
                        <View style={[styles.headerIcon, { backgroundColor: selectedHabit.categories[0]?.color || colors.accent }]}>
                            <SelectedIcon size={22} color="#FFFFFF" />
                        </View>
                    )}
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {selectedHabit ? selectedHabit.name : "Нет привычек"}
                    </Text>
                    {habits.length > 0 && <LucideIcons.ChevronDown size={24} color={colors.text} style={{ marginLeft: 8 }} />}
                </View>
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isSelectorVisible}
                onRequestClose={() => setSelectorVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setSelectorVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Выберите привычку</Text>
                        <FlatList
                            data={habits}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectHabit(item)}>
                                    <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                                    {selectedHabit?.id === item.id && <LucideIcons.CheckCircle size={20} color={colors.success} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                {selectedHabit ? (
                    <Calendar
                        key={`${selectedHabit.id}-${theme}`}
                        dayComponent={({ date, state }) => (
                            <CircularProgressDay
                                date={date}
                                state={state}
                                habit={selectedHabit}
                                progress={progressMap.get(date?.dateString || '') || 0}
                                onPress={() => handleUpdateDay(date!.dateString)}
                            />
                        )}
                        theme={{
                            calendarBackground: colors.background,
                            monthTextColor: colors.text,
                            textSectionTitleColor: colors.textSecondary,
                            arrowColor: colors.accent,
                        }}
                    />
                ) : (
                    <View style={styles.placeholder}><ActivityIndicator color={colors.accent} /></View>
                )}

                {selectedHabit && (
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <GitHubStyleHeatmap habit={selectedHabit} completions={allCompletions} />
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        paddingTop: 60,
        paddingBottom: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)'
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        maxWidth: '70%',
    },
    placeholder: { height: 360, justifyContent: 'center', alignItems: 'center' },
    card: { marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 15 },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '60%',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.2)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalItemText: {
        fontSize: 16,
    },
    calendarWrapper: {
        marginHorizontal: 16,
        paddingTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'transparent'
    },
    heatmapOuterContainer: {
        marginHorizontal: 16,
        marginTop: 10,
        padding: 10,
    },
    heatmapContainer: {
        flexDirection: 'row',
    },
    weekdaysContainer: {
        paddingRight: 8,
        justifyContent: 'space-around',
    },
    weekdayText: {
        fontSize: 10,
        height: 14,
        textAlignVertical: 'center',
        color: '#999'
    },
    monthsContainer: {
        flexDirection: 'row',
        height: 14,
        marginBottom: 2,
    },
    monthText: {
        position: 'absolute',
        fontSize: 10,
    }
});
