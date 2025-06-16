// src/screens/CalendarScreen.tsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../components/ThemeProvider";
import { useHabitStore } from "../store/useHabitStore";
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, X } from "lucide-react-native";
import { useAuth } from '../contexts/AuthContext';

// Настройка локализации для календаря
LocaleConfig.locales['ru'] = {
  monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  monthNamesShort: ['Янв.','Фев.','Март','Апр.','Май','Июнь','Июль','Авг.','Сен.','Окт.','Ноя.','Дек.'],
  dayNames: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  dayNamesShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сегодня'
};
LocaleConfig.defaultLocale = 'ru';

export default function CalendarScreen() {
    const { colors, theme } = useContext(ThemeContext)!; // Достаем `theme` для ключа
    const { habits, habitCompletions, isLoadingHabits, fetchHabits, fetchHabitCompletions, updateHabitProgress } = useHabitStore();
    const { user } = useAuth();
    
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useFocusEffect(
        useCallback(() => {
            if (user?.id) {
                fetchHabits(user.id);
                const today = new Date();
                const start = format(startOfMonth(today), 'yyyy-MM-dd');
                const end = format(endOfMonth(today), 'yyyy-MM-dd');
                fetchHabitCompletions(user.id, start, end);
            }
        }, [user?.id])
    );
    
    const { displayedHabits, markedDates } = useMemo(() => {
        const completionsForSelectedDate = habitCompletions.filter(c => c.completion_date === selectedDate);
        
        // Фильтруем привычки, которые были созданы до или в выбранный день
        const activeHabitsForDay = habits.filter(habit => {
            const habitCreationDate = parseISO(habit.created_at);
            const currentSelectedDate = parseISO(selectedDate);
            habitCreationDate.setHours(0, 0, 0, 0);
            currentSelectedDate.setHours(0, 0, 0, 0);
            return habitCreationDate <= currentSelectedDate;
        });

        const habitsForDisplay = activeHabitsForDay.map(habit => {
            const record = completionsForSelectedDate.find(c => c.habit_id === habit.id);
            return { ...habit, progress: record ? record.completed_count : 0 };
        });

        const newMarkedDates: { [key: string]: any } = {};
        
        // Логика маркеров для дней
        const completionsByDay: {[key: string]: boolean} = {};
        habitCompletions.forEach(c => {
            const day = c.completion_date;
            const habit = habits.find(h => h.id === c.habit_id);
            if (!habit) return;
            if(c.completed_count < habit.target_completions){
                completionsByDay[day] = false;
            } else if(completionsByDay[day] === undefined) {
                 completionsByDay[day] = true;
            }
        });

        Object.keys(completionsByDay).forEach(day => {
            newMarkedDates[day] = {
                marked: true,
                dotColor: completionsByDay[day] ? colors.progressGreen : colors.danger
            }
        });
        
        newMarkedDates[selectedDate] = { ...newMarkedDates[selectedDate], selected: true, selectedColor: colors.accent, disableTouchEvent: true };

        return { displayedHabits: habitsForDisplay, markedDates: newMarkedDates };
    }, [selectedDate, habits, habitCompletions, colors]);

    const onMonthChange = (month: DateData) => {
        if (user?.id) {
            const start = format(startOfMonth(new Date(month.dateString)), 'yyyy-MM-dd');
            const end = format(endOfMonth(new Date(month.dateString)), 'yyyy-MM-dd');
            fetchHabitCompletions(user.id, start, end);
        }
    };

    const renderHabitItem = ({ item }: { item: typeof habits[0] }) => {
        const isCompleted = item.progress >= item.target_completions;
        return (
             <TouchableOpacity
                style={[ styles.item, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => {
                    const newProgress = isCompleted ? 0 : item.target_completions;
                    updateHabitProgress(item.id, newProgress, selectedDate);
                }}
            >
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <View style={styles.itemProgressContainer}>
                    <Text style={[styles.itemProgressText, { color: colors.textSecondary }]}>
                        {`${item.progress}/${item.target_completions}`}
                    </Text>
                    {isCompleted ? <Check size={20} color={colors.progressGreen} /> : <X size={20} color={colors.danger} />}
                </View>
            </TouchableOpacity>
        );
    }
    
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Календарь</Text>
            </View>
            <Calendar
                key={theme} // <-- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: заставляет календарь перерисоваться при смене темы
                current={selectedDate}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                onMonthChange={onMonthChange}
                markedDates={markedDates}
                markingType={'dot'}
                theme={{
                    calendarBackground: colors.background,
                    dayTextColor: colors.text,
                    monthTextColor: colors.text,
                    textSectionTitleColor: colors.textSecondary,
                    arrowColor: colors.accent,
                    todayTextColor: colors.accent,
                    selectedDayBackgroundColor: colors.accent,
                    selectedDayTextColor: '#ffffff',
                    textDisabledColor: colors.textFaded // Добавил недостающий цвет для неактивных дней
                }}
            />
            <Text style={[styles.listHeader, { color: colors.text }]}>
                Привычки на {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: ru })}
            </Text>
            {isLoadingHabits && habits.length === 0 ? (
                <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }}/>
            ) : (
                <FlatList
                    data={displayedHabits}
                    keyExtractor={item => item.id}
                    renderItem={renderHabitItem}
                    ListEmptyComponent={<Text style={{textAlign: 'center', color: colors.textSecondary, marginTop: 20}}>Нет привычек на этот день</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15 },
    title: { fontSize: 28, fontWeight: "bold" },
    listHeader: { fontSize: 18, fontWeight: '600', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
    item: {
        borderRadius: 10,
        padding: 15,
        marginHorizontal: 16,
        marginVertical: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    itemName: { fontSize: 16, fontWeight: '600' },
    itemProgressContainer: { flexDirection: 'row', alignItems: 'center' },
    itemProgressText: { fontSize: 14, marginRight: 8 },
});
