// src/screens/CalendarScreen.tsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { Calendar } from "react-native-calendars";
import { DateData, MarkedDates } from "react-native-calendars/src/types";
import { ThemeContext, ColorPalette } from "../components/ThemeProvider"; // <-- ДОБАВЛЕНО: Импорт ColorPalette
import { fetchHabits, fetchCompletionsForDate, Habit, HabitCompletion, fetchCompletionsForMonth } from "../lib/habits";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import HabitCalendarItem from "../components/HabitCalendarItem";

// Определяем типы для навигации
type RootStackParamList = {
    HabitsStack: undefined; // Наш стек привычек
    EditHabit: { habit: Habit };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "HabitsStack">;


export default function CalendarScreen() {
    const { colors } = useContext(ThemeContext);
    const navigation = useNavigation<NavigationProp>();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Текущая дата
    const [habits, setHabits] = useState<Habit[]>([]);
    // const [completions, setCompletions] = useState<HabitCompletion[]>([]); // Это больше не нужно хранить отдельно, данные используются в habitsWithProgress
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [allMonthCompletions, setAllMonthCompletions] = useState<HabitCompletion[]>([]);
    const [markedDates, setMarkedDates] = useState<MarkedDates>({});


    // Функция для обработки нажатия на дату
    const onDayPress = useCallback((day: DateData) => {
        setSelectedDate(day.dateString);
    }, []);

    // Функция для формирования markedDates с кружками
    const generateMarkedDates = useCallback((
        selected: string,
        monthCompletions: HabitCompletion[],
        allHabits: Habit[],
        colors: ColorPalette // <-- ТИП ColorPalette ТЕПЕРЬ ИМПОРТИРОВАН
    ): MarkedDates => {
        const marks: MarkedDates = {
            [selected]: {
                selected: true,
                selectedColor: colors.accent,
                selectedTextColor: colors.text,
            },
        };

        const dailyCompletionsMap: { [date: string]: { [habitId: string]: number } } = {};

        monthCompletions.forEach(comp => {
            if (!dailyCompletionsMap[comp.completion_date]) {
                dailyCompletionsMap[comp.completion_date] = {};
            }
            dailyCompletionsMap[comp.completion_date][comp.habit_id] = comp.completed_count;
        });

        for (const dateString in dailyCompletionsMap) {
            if (dateString === selected) continue; // Не переопределяем выбранный день

            let totalExpectedForDay = 0;
            let totalCompletedForDay = 0;

            allHabits.forEach(habit => {
                // Учитываем только активные (неархивированные) привычки, если у вас есть такое поле
                // if (!habit.archived) { // Если у вас есть поле archived
                    const completedCount = dailyCompletionsMap[dateString][habit.id] || 0;
                    totalExpectedForDay += habit.target_completions || 1;
                    totalCompletedForDay += completedCount;
                // }
            });

            const completionPercentage = totalExpectedForDay > 0 ? (totalCompletedForDay / totalExpectedForDay) : 0;

            let dotColor = colors.progressRed;
            if (completionPercentage >= 1) {
                dotColor = colors.progressGreen;
            } else if (completionPercentage > 0) {
                dotColor = colors.progressYellow;
            } else {
                dotColor = colors.progressRed;
            }

            marks[dateString] = {
                marked: true,
                dotColor: dotColor,
                // Для стилизации кружка, если хотите, чтобы он был не точкой, а залитым кругом:
                customStyles: {
                    container: {
                        backgroundColor: dotColor,
                        borderRadius: 15, // Делаем круг
                        width: 25, // Размер кружка
                        height: 25, // Размер кружка
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    text: {
                        color: colors.text, // Цвет текста даты внутри кружка
                        fontWeight: 'bold'
                    }
                }
            };
        }
        return marks;
    }, [colors]);

    // Главная функция загрузки данных
    const fetchAllData = useCallback(async (dateToFetch: string, monthToFetch: number, yearToFetch: number) => {
        setLoading(true);
        try {
            const fetchedHabits = await fetchHabits();
            const fetchedCompletions = await fetchCompletionsForDate(dateToFetch);
            const monthCompletions = await fetchCompletionsForMonth(yearToFetch, monthToFetch);

            // Для отображения под календарем
            const habitsWithProgress = fetchedHabits.map(habit => {
                const completion = fetchedCompletions.find(comp => comp.habit_id === habit.id);
                return {
                    ...habit,
                    progress: completion ? completion.completed_count : 0,
                };
            });

            setHabits(habitsWithProgress);
            setAllMonthCompletions(monthCompletions);

            // Генерируем markedDates после получения всех данных
            setMarkedDates(generateMarkedDates(selectedDate, monthCompletions, fetchedHabits, colors));

        } catch (error) {
            console.error("Error fetching data for CalendarScreen:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedDate, generateMarkedDates, colors]);


    // Хук для фокуса на экране
    useFocusEffect(
        useCallback(() => {
            // Вызываем fetchAllData при фокусе, но только если изменилась дата, месяц или год
            fetchAllData(selectedDate, currentMonth, currentYear);
        }, [selectedDate, currentMonth, currentYear, fetchAllData])
    );

    // При изменении месяца в календаре
    const onMonthChange = useCallback((month: DateData) => {
        setCurrentMonth(month.month);
        setCurrentYear(month.year);
        // fetchAllData будет вызван через useFocusEffect при изменении currentMonth/currentYear
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllData(selectedDate, currentMonth, currentYear);
    }, [selectedDate, currentMonth, currentYear, fetchAllData]);

    // Обработчик для HabitCalendarItem
    const handleEditHabit = (habit: Habit) => {
        navigation.navigate("EditHabit", { habit: habit });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                onMonthChange={onMonthChange}
                // Настройка темы календаря
                theme={{
                    backgroundColor: colors.background,
                    calendarBackground: colors.cardBackground,
                    textSectionTitleColor: colors.textFaded,
                    selectedDayBackgroundColor: colors.accent,
                    selectedDayTextColor: colors.text,
                    todayTextColor: colors.accent,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.textFaded,
                    dotColor: colors.accent, // Это будет переопределено customStyles.container.backgroundColor
                    selectedDotColor: colors.text,
                    arrowColor: colors.accent,
                    monthTextColor: colors.text,
                    textMonthFontWeight: 'bold',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                }}
                // Стилизация недели теперь вне объекта theme, так как theme не поддерживает прямые стили stylesheet.*
                // Вместо этого используем пропс style для компонента Calendar
                style={[styles.calendar, { borderBottomColor: colors.border }]}
            />

            <Text style={[styles.dateTitle, { color: colors.text }]}>
                Привычки на {selectedDate}
            </Text>

            {loading ? (
                <ActivityIndicator size="large" color={colors.accent} style={styles.loadingIndicator} />
            ) : (
                <FlatList
                    data={habits}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <HabitCalendarItem
                            habit={item}
                            onPress={handleEditHabit}
                        />
                    )}
                    contentContainerStyle={styles.habitListContent}
                    ListEmptyComponent={() => (
                        <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                            Нет привычек за этот день.
                        </Text>
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    calendar: {
        // Мы удалили внутренние стили `borderBottomWidth` и `borderBottomColor`
        // из `theme` и перенесли их сюда.
        // week стили не применимы напрямую к Calendar компоненту,
        // они должны быть частью его внутренней темы, но поскольку это не работает,
        // можно убрать их и стилизовать через общие свойства темы или кастомные компоненты.
    },
    // В данном случае, стили для week (разделитель дней недели)
    // не могут быть применены напрямую через `style` компонента `Calendar`.
    // Если вам нужен разделитель, то это должно быть в `theme` объекта,
    // но react-native-calendars не поддерживает `stylesheet.calendar.header`.
    // Вы можете обернуть календарь в View и применить borderBottom к этому View,
    // или смириться с отсутствием этого разделителя.
    dateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        marginHorizontal: 16,
    },
    loadingIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    habitListContent: {
        paddingBottom: 20,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});
