// src/screens/SortHabitsScreen.tsx
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { useHabitStore } from '../store/useHabitStore';
import { Habit } from '../lib/habits';
import { X, CheckCircle, Menu } from 'lucide-react-native';

export default function SortHabitsScreen() {
    const { colors } = useContext(ThemeContext)!;
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { categoryId, categoryName } = route.params;

    const { habits: allHabits, updateHabitOrder } = useHabitStore();
    const [habitsToSort, setHabitsToSort] = useState<Habit[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let filtered: Habit[];
        if (categoryId === "All") {
            filtered = allHabits;
        } else if (categoryId === "Uncategorized") {
            filtered = allHabits.filter(h => !h.categories || h.categories.length === 0);
        } else {
            filtered = allHabits.filter(h => h.categories.some(cat => cat.id === categoryId));
        }
        setHabitsToSort(filtered);
    }, [allHabits, categoryId]);

    const handleSaveOrder = async () => {
        setIsSaving(true);
        // Создаем новый полный список привычек с обновленным порядком
        const otherHabits = allHabits.filter(h => !habitsToSort.find(sorted => sorted.id === h.id));
        const newFullHabitList = [...habitsToSort, ...otherHabits];

        try {
            await updateHabitOrder(newFullHabitList);
            Alert.alert("Успех", "Порядок сохранен!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось сохранить порядок.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => (
        <ScaleDecorator>
            <TouchableOpacity onLongPress={drag} disabled={isActive} style={[styles.habitItem, { backgroundColor: colors.cardBackground }, isActive && { backgroundColor: colors.accent }]}>
                <Text style={[styles.habitItemText, { color: isActive ? "#FFFFFF" : colors.text }]}>{item.name}</Text>
                <TouchableOpacity onPressIn={drag} style={styles.dragHandle}><Menu size={24} color={isActive ? "#FFFFFF" : colors.text} /></TouchableOpacity>
            </TouchableOpacity>
        </ScaleDecorator>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><X size={24} color={colors.text} /></TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Сортировка в "{categoryName}"</Text>
                <View style={{ width: 24 }} />
            </View>

            <DraggableFlatList
                data={habitsToSort}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => setHabitsToSort(data)}
                renderItem={renderItem}
            />

            <TouchableOpacity onPress={handleSaveOrder} style={[styles.saveButton, { backgroundColor: colors.accent }]} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <><CheckCircle size={24} color="#FFFFFF" style={{ marginRight: 10 }} /><Text style={styles.saveButtonText}>Сохранить порядок</Text></>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    draggableListContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    habitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    habitItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    dragHandle: {
        padding: 10,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        paddingVertical: 15,
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 60,
        lineHeight: 24,
    },
});
