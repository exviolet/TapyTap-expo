// src/screens/JournalScreen.tsx
import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { useHabitStore, HabitNote } from '../store/useHabitStore';
import { useAuth } from '../contexts/AuthContext';
import * as LucideIcons from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Habit } from '@/lib/habits';
import { RootStackParamList } from '../navigation/AppNavigator'; // Импортируем типы

const iconMap: any = LucideIcons;

const JournalEntry: React.FC<{ item: HabitNote; showMonth: boolean; navigation: any }> = ({ item, showMonth, navigation }) => {
    const { colors } = useContext(ThemeContext)!;
    const habit = item.habit;
    if (!habit) return null;

    const HabitIcon = iconMap[habit.icon] || LucideIcons.Star;
    const categoryColor = habit.categories?.[0]?.color || colors.accent;

    return (
        <TouchableOpacity onPress={() => navigation.navigate('AddEditNote', { note: item })}>
            <View style={styles.entryContainer}>
                {showMonth && (
                    <Text style={[styles.monthHeader, { color: colors.text }]}>
                        {format(parseISO(item.note_date), 'MMMM yyyy', { locale: ru })}
                    </Text>
                )}
                <View style={styles.entryRow}>
                    <View style={styles.dateBlock}>
                        <Text style={[styles.dayOfWeek, { color: colors.textSecondary }]}>
                            {format(parseISO(item.note_date), 'EEE', { locale: ru }).toUpperCase()}
                        </Text>
                        <Text style={[styles.dayOfMonth, { color: colors.text }]}>
                            {format(parseISO(item.note_date), 'd')}
                        </Text>
                    </View>
                    <View style={styles.contentBlock}>
                        <Text style={[styles.noteContent, { color: colors.text }]}>{item.content}</Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                                {format(parseISO(item.created_at), 'HH:mm')}
                            </Text>
                            <View style={[styles.habitChip, { backgroundColor: categoryColor + '20' || colors.accent + '20' }]}>
                                <HabitIcon size={12} color={categoryColor} />
                                <Text style={[styles.habitChipText, { color: categoryColor }]}>{habit.name}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function JournalScreen() {
    const { colors } = useContext(ThemeContext)!;
    const navigation = useNavigation<any>(); // Можно использовать тип из RootStackParamList для точности
    const { user } = useAuth();
    const { notes, fetchAllNotes, habits, fetchHabits } = useHabitStore();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [isSelectorVisible, setSelectorVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (user?.id) {
                setIsLoading(true);
                Promise.all([fetchAllNotes(user.id), fetchHabits(user.id)])
                    .finally(() => setIsLoading(false));
            }
        }, [user?.id])
    );

    const filteredNotes = useMemo(() => {
        if (!selectedHabit) {
            return notes;
        }
        return notes.filter(note => note.habit_id === selectedHabit.id);
    }, [notes, selectedHabit]);

    const processedNotes = useMemo(() => {
        let lastMonth = '';
        return filteredNotes.map(note => {
            const currentMonth = format(parseISO(note.note_date), 'yyyy-MM');
            const showMonth = currentMonth !== lastMonth;
            lastMonth = currentMonth;
            return { ...note, showMonth };
        });
    }, [filteredNotes]);

    const handleSelectHabit = (habit: Habit | null) => {
        setSelectedHabit(habit);
        setSelectorVisible(false);
    };

    const HabitIcon = selectedHabit ? (iconMap[selectedHabit.icon] || LucideIcons.Star) : LucideIcons.LayoutGrid;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <LucideIcons.ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Журнал</Text>
                <TouchableOpacity 
                    style={styles.headerButton} 
                    onPress={() => navigation.navigate('AddEditNote', { habitId: selectedHabit?.id })}
                >
                    <LucideIcons.Plus size={28} color={colors.text} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.filterContainer} onPress={() => setSelectorVisible(true)}>
                <View style={[styles.filterIcon, { backgroundColor: selectedHabit?.categories?.[0]?.color || colors.accent }]}>
                    <HabitIcon size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.filterText, { color: colors.text }]}>
                    {selectedHabit ? selectedHabit.name : "Все привычки"}
                </Text>
                <LucideIcons.ChevronDown size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            {isLoading ? (
                <View style={[styles.container, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : (
                <FlatList
                    data={processedNotes}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <JournalEntry item={item} showMonth={item.showMonth} navigation={navigation} />}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <LucideIcons.BookText size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {selectedHabit ? "Для этой привычки еще нет заметок." : "Ваши заметки по привычкам будут появляться здесь."}
                            </Text>
                        </View>
                    }
                />
            )}

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
                            data={[null, ...habits]}
                            keyExtractor={item => item?.id || 'all'}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectHabit(item)}>
                                    <Text style={[styles.modalItemText, { color: colors.text }]}>
                                        {item ? item.name : "Все привычки"}
                                    </Text>
                                    {(selectedHabit?.id === item?.id) && <LucideIcons.CheckCircle size={20} color={colors.success} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    headerButton: { padding: 4 },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 12,
        backgroundColor: 'rgba(128,128,128,0.1)',
        borderRadius: 12,
    },
    filterIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    filterText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    entryContainer: { marginBottom: 16 },
    monthHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textTransform: 'capitalize',
    },
    entryRow: { flexDirection: 'row' },
    dateBlock: {
        alignItems: 'center',
        marginRight: 16,
        width: 40,
    },
    dayOfWeek: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
    dayOfMonth: { fontSize: 18, fontWeight: 'bold' },
    contentBlock: { flex: 1 },
    noteContent: { fontSize: 16, lineHeight: 24, marginBottom: 8 },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timestamp: { fontSize: 13 },
    habitChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    habitChipText: { marginLeft: 6, fontSize: 13, fontWeight: '600' },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '30%',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
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
});
