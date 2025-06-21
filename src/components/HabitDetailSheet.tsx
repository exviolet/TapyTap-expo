// src/components/HabitDetailSheet.tsx
import React, { useMemo, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { ThemeContext } from './ThemeProvider';
import { Habit } from '../lib/habits';
import { useHabitStore } from '../store/useHabitStore';
import * as LucideIcons from 'lucide-react-native';
import Heatmap from './Heatmap';
import { format, subDays, startOfDay, isWithinInterval, parseISO, differenceInCalendarDays } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const iconMap: any = LucideIcons;

type RootStackParamList = {
    EditHabit: { habit: Habit };
    HabitDetailScreen: { habitId: string; habitName: string };
};
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
    habit: Habit | null;
    onClose: () => void;
}

const HabitDetailSheet: React.FC<Props> = ({ habit, onClose }) => {
    const { colors } = useContext(ThemeContext)!;
    const { allCompletions, streaks, archiveHabit } = useHabitStore();
    const navigation = useNavigation<NavigationProp>();
    const bottomSheetRef = useRef<BottomSheet>(null);

    const sheetIndex = useMemo(() => (habit ? 0 : -1), [habit]);
    const snapPoints = useMemo(() => ['80%', '90%'], []);

    // --- Расчеты KPI и Цели ---
    const { totalCompletions, thirtyDayPercentage, goalSeriesText } = useMemo(() => {
        if (!habit) return { totalCompletions: 0, thirtyDayPercentage: 0, goalSeriesText: '' };

        // Всего выполнений (без изменений)
        const completionsCount = allCompletions.filter(c => c.habit_id === habit.id && c.completed_count >= habit.target_completions).length;

        // **ИСПРАВЛЕННАЯ ЛОГИКА ПРОЦЕНТА ЗА 30 ДНЕЙ**
        const today = startOfDay(new Date());
        const thirtyDaysAgo = subDays(today, 29);
        
        // Определяем, сколько дней из последних 30 привычка вообще существовала
        const habitCreationDate = parseISO(habit.created_at);
        const firstPossibleDay = habitCreationDate > thirtyDaysAgo ? habitCreationDate : thirtyDaysAgo;
        
        // Считаем общее количество дней, когда привычку можно было выполнить
        // (от даты создания или от начала 30-дневного окна)
        const totalPossibleDays = differenceInCalendarDays(today, firstPossibleDay) + 1;

        // Считаем дни, когда привычка была выполнена в этом окне
        const completedDaysInWindow = allCompletions.filter(c => {
            const completionDate = parseISO(c.completion_date);
            return c.habit_id === habit.id && 
                   c.completed_count >= habit.target_completions &&
                   isWithinInterval(completionDate, { start: firstPossibleDay, end: today });
        }).length;
        
        const percentage = totalPossibleDays > 0 ? Math.round((completedDaysInWindow / totalPossibleDays) * 100) : 0;
        
        // Текст для цели серии (без изменений)
        let seriesText = 'Ежедневно';
        if (habit.goal_series === 7) seriesText = 'Еженедельно';
        if (habit.goal_series === 30) seriesText = 'Ежемесячно';

        return { 
            totalCompletions: completionsCount, 
            thirtyDayPercentage: percentage,
            goalSeriesText: seriesText
        };
    }, [habit, allCompletions]);

    const currentStreak = habit ? streaks.get(habit.id) || 0 : 0;
    
    // Обработчики кнопок
    const handleEdit = () => {
        if (!habit) return;
        bottomSheetRef.current?.close();
        navigation.navigate('EditHabit', { habit });
    };

    const handleFullStats = () => {
        if (!habit) return;
        bottomSheetRef.current?.close();
        navigation.navigate('HabitDetailScreen', { habitId: habit.id, habitName: habit.name });
    };

    const handleArchive = () => {
        if (!habit) return;
        onClose();
        archiveHabit(habit.id);
    };

    const renderBackdrop = useCallback(
        (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />,
        []
    );

    const HabitIcon = habit ? (iconMap[habit.icon] || LucideIcons.Star) : LucideIcons.Star;

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={sheetIndex}
            snapPoints={snapPoints}
            onClose={onClose}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={{ backgroundColor: colors.textFaded }}
            backgroundStyle={{ backgroundColor: colors.cardBackground }}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {habit && (
                <>
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: habit.categories[0]?.color || colors.accent }]}>
                            <HabitIcon size={24} color="#FFF" />
                        </View>
                        <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                    </View>

                    <View style={styles.kpiContainer}>
                        <View style={styles.kpiBox}>
                            <LucideIcons.Flame size={20} color="#FF9500" />
                            <Text style={[styles.kpiValue, { color: colors.text }]}>{currentStreak}</Text>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Серия</Text>
                        </View>
                        <View style={styles.kpiBox}>
                            <LucideIcons.CheckCircle size={20} color={colors.success} />
                            <Text style={[styles.kpiValue, { color: colors.text }]}>{totalCompletions}</Text>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Выполнено</Text>
                        </View>
                         <View style={styles.kpiBox}>
                            <LucideIcons.PieChart size={20} color={colors.accent} />
                            <Text style={[styles.kpiValue, { color: colors.text }]}>{thirtyDayPercentage}%</Text>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>За 30 дней</Text>
                        </View>
                    </View>
                    
                    <View style={[styles.section, { backgroundColor: colors.background, paddingVertical: 0 }]}>
                        <View style={[styles.infoRow, {borderBottomColor: colors.border}]}>
                            <LucideIcons.Target size={20} color={colors.textSecondary} />
                            <Text style={[styles.infoText, {color: colors.text}]}>Цель</Text>
                            <Text style={[styles.infoValue, {color: colors.text}]}>{goalSeriesText}</Text>
                        </View>
                        <View style={[styles.infoRow, {borderBottomColor: colors.border}]}>
                            <LucideIcons.FolderKanban size={20} color={colors.textSecondary} />
                             <Text style={[styles.infoText, {color: colors.text}]}>Категории</Text>
                             <View style={styles.categoriesContainer}>
                                {habit.categories.length > 0 ? habit.categories.map(cat => {
                                    const CategoryIcon = iconMap[cat.icon] || LucideIcons.Tag;
                                    return (
                                        <View key={cat.id} style={[styles.categoryChip, {backgroundColor: cat.color + '33'}]}>
                                            <CategoryIcon size={12} color={cat.color} style={{marginRight: 5}} />
                                            <Text style={[styles.categoryChipText, {color: cat.color}]}>{cat.name}</Text>
                                        </View>
                                    )
                                }) : (
                                    <Text style={[styles.infoValue, {color: colors.text}]}>Без категории</Text>
                                )}
                             </View>
                        </View>
                    </View>

                    {habit.description && (
                         <View style={[styles.section, { backgroundColor: colors.background }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ОПИСАНИЕ</Text>
                            <Text style={[styles.descriptionText, { color: colors.text }]}>{habit.description}</Text>
                        </View>
                    )}

                    <View style={[styles.section, { backgroundColor: colors.background, marginTop: 10 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>АКТИВНОСТЬ ЗА ГОД</Text>
                        <Heatmap habit={habit} completions={allCompletions} />
                    </View>
                </>
                )}
            </ScrollView>
            <View style={[styles.actionsContainer, { borderTopColor: colors.border, backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                    <LucideIcons.Edit3 size={22} color={colors.text} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Изменить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleArchive}>
                    <LucideIcons.Archive size={22} color={colors.warning} />
                    <Text style={[styles.actionButtonText, { color: colors.warning }]}>Архив</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    habitName: {
        fontSize: 22,
        fontWeight: 'bold',
        flex: 1,
    },
    closeButton: {
        padding: 8,
    },
    kpiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    kpiBox: {
        alignItems: 'center',
        minWidth: 80,
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    kpiLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    section: {
        borderRadius: 16,
        padding: 16, 
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    infoText: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 12,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 'auto',
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        flex: 1,
        marginLeft: 12,
    },
    categoryChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 6,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingBottom: 30,
        borderTopWidth: 1,
    },
    actionButton: {
        alignItems: 'center',
        padding: 8,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    }
});

export default HabitDetailSheet;
