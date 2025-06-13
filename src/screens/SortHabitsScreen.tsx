// src/screens/SortHabitsScreen.tsx

import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { Habit, fetchHabits, updateHabitOrder, Category } from '../lib/habits';
import { X, CheckCircle, Menu } from 'lucide-react-native';

// Ваши RootStackParamList
type RootStackParamList = {
    HabitsStack: undefined;
    SortCategories: undefined;
    SortHabits: { categoryId: string; categoryName: string }; // Добавляем новый экран для сортировки привычек
};

type SortHabitsScreenRouteProp = RouteProp<RootStackParamList, 'SortHabits'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'SortHabits'>;

export default function SortHabitsScreen() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('SortHabitsScreen must be used within a ThemeProvider');
    }
    const { colors } = context;
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<SortHabitsScreenRouteProp>();
    const { categoryId, categoryName } = route.params;

    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadHabits = useCallback(async () => {
        setLoading(true);
        try {
            const allHabits = await fetchHabits();
            let habitsToSort: Habit[] = [];

            if (categoryId === "All") {
                // Если "Все", то сортируем все привычки (можно ограничить, если их очень много)
                habitsToSort = allHabits;
            } else if (categoryId === "Без категории") {
                // Привычки без категорий
                habitsToSort = allHabits.filter(habit => !habit.categories || habit.categories.length === 0);
            } else {
                // Привычки конкретной категории
                habitsToSort = allHabits.filter(habit =>
                    habit.categories?.some(cat => cat.id === categoryId)
                );
            }
            
            // Важно: сортируем по order_index при загрузке, чтобы начать с текущего порядка
            habitsToSort.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

            setHabits(habitsToSort);
        } catch (error) {
            console.error("Error loading habits for sorting:", error);
            Alert.alert("Ошибка", "Не удалось загрузить привычки для сортировки.");
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useFocusEffect(
        useCallback(() => {
            loadHabits();
        }, [loadHabits])
    );

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            await updateHabitOrder(habits); // Отправляем отсортированный массив привычек
            Alert.alert("Успех", "Порядок привычек сохранен!");
            navigation.navigate("HabitsStack"); // Возвращаемся на главный экран привычек
        } catch (error) {
            console.error("Error saving habit order:", error);
            Alert.alert("Ошибка", "Не удалось сохранить порядок привычек.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => {
        // Здесь можно добавить иконку привычки, если она есть, или отобразить название
        // Для простоты пока просто отобразим название привычки
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    activeOpacity={0.8}
                    style={[
                        styles.habitItem,
                        { backgroundColor: colors.inputBackground },
                        isActive && { backgroundColor: colors.accent, opacity: 0.8 },
                    ]}
                >
                    <View style={styles.habitInfo}>
                        <Text style={[styles.habitItemText, { color: isActive ? "#FFFFFF" : colors.text }]}>
                            {item.name}
                        </Text>
                    </View>
                    <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
                        <Menu size={24} color={isActive ? "#FFFFFF" : colors.text} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    Сортировка привычек{"\n"}в "{categoryName}"
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {habits.length === 0 ? (
                <View style={styles.centerContent}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        В этой категории нет привычек для сортировки.
                    </Text>
                </View>
            ) : (
                <DraggableFlatList
                    data={habits}
                    keyExtractor={(item) => item.id}
                    onDragEnd={({ data }) => setHabits(data)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.draggableListContent}
                />
            )}

            <TouchableOpacity
                onPress={handleSaveOrder}
                style={[styles.saveButton, { backgroundColor: colors.accent }]}
                disabled={isSaving}
            >
                {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <CheckCircle size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                        <Text style={styles.saveButtonText}>Готово</Text>
                    </>
                )}
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
