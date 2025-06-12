// src/screens/HabitsScreen.tsx
import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Modal, Pressable } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ThemeContext } from "../components/ThemeProvider";
import { Habit, Category } from "../lib/habits"; // Теперь Habits, Category берутся отсюда
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import ModeToggle from '../components/ModeToggle';
import {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart, Check,
    Lightbulb, Bell, Archive, PlusCircle, MinusCircle, X, Clock,
    Menu, Trash2, Edit
} from "lucide-react-native";

import HabitCard from "../components/HabitCard";
import { useHabitStore } from "../store/useHabitStore"; // Импортируем наше хранилище Zustand
import { supabase } from "../supabase/supabaseClient"; // Для получения user_id

type RootStackParamList = {
    Habits: undefined;
    AddHabit: undefined;
    SortCategories: undefined;
    SortHabits: { categoryId: string; categoryName: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "Habits">;

const iconMap: { [key: string]: React.ComponentType<any> } = {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart,
    Lightbulb, Bell, Archive, Clock, PlusCircle, MinusCircle, X, Menu, Trash2, Edit
};

export default function HabitsScreen() {
    const { colors, theme } = useContext(ThemeContext);
    const navigation = useNavigation<NavigationProp>();

    // Используем состояние из Zustand
    const { 
        habits, 
        categories, 
        isLoading, 
        fetchHabits, 
        fetchCategories, 
        updateHabitProgress,
        deleteHabit, // Используем функцию из Zustand
        deleteCategory, // Используем функцию из Zustand
        updateHabit // Добавим если нужно будет обновлять HabitCard напрямую
    } = useHabitStore();

    const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const [selectedCategoryForMenu, setSelectedCategoryForMenu] = useState<Category | null>(null);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);

    // Анимации для кнопок (остаются, они UI-специфичны)
    const addButtonScale = useSharedValue(1);
    const deleteButtonScale = useSharedValue(1);
    const sortButtonScale = useSharedValue(1);
    const cancelButtonScale = useSharedValue(1);
    const sortHabitsButtonScale = useSharedValue(1);

    const animatedAddButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: addButtonScale.value }] }));
    const animatedDeleteButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: deleteButtonScale.value }] }));
    const animatedSortButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: sortButtonScale.value }] }));
    const animatedCancelButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: cancelButtonScale.value }] }));
    const animatedSortHabitsButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: sortHabitsButtonScale.value }] }));

    const handleAddPressIn = () => { addButtonScale.value = withSpring(0.95); };
    const handleAddPressOut = () => { addButtonScale.value = withSpring(1); };
    const handleDeletePressIn = () => { deleteButtonScale.value = withSpring(0.95); };
    const handleDeletePressOut = () => { deleteButtonScale.value = withSpring(1); };
    const handleSortPressIn = () => { sortButtonScale.value = withSpring(0.95); };
    const handleSortPressOut = () => { sortButtonScale.value = withSpring(1); };
    const handleCancelPressIn = () => { cancelButtonScale.value = withSpring(0.95); };
    const handleCancelPressOut = () => { cancelButtonScale.value = withSpring(1); };
    const handleSortHabitsPressIn = () => { sortHabitsButtonScale.value = withSpring(0.95); };
    const handleSortHabitsPressOut = () => { sortHabitsButtonScale.value = withSpring(1); };

    // Загрузка данных при фокусировке экрана
    useFocusEffect(
        React.useCallback(() => {
            const loadInitialData = async () => {
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                    await fetchHabits(userData.user.id);
                    await fetchCategories();
                }
            };
            loadInitialData();
        }, [fetchHabits, fetchCategories]) // Зависимости теперь функции из Zustand
    );

    // Фильтрация привычек при изменении выбранной категории или самих привычек
    useEffect(() => {
        const filterHabits = () => {
            if (selectedCategory === "All") {
                setFilteredHabits(habits);
            } else if (selectedCategory === "Без категории") {
                setFilteredHabits(habits.filter((habit) => !habit.categories || habit.categories.length === 0));
            } else {
                setFilteredHabits(
                    habits.filter((habit) =>
                        habit.categories?.some((cat) => cat.id === selectedCategory)
                    )
                );
            }
        };
        filterHabits();
    }, [selectedCategory, habits]);

    // Обновляем выбранную категорию, если она была удалена
    useEffect(() => {
        if (!categories.some(cat => cat.id === selectedCategory) && selectedCategory !== "All" && selectedCategory !== "Без категории") {
            setSelectedCategory("All");
        }
    }, [categories, selectedCategory]);


    // Обработчик удаления привычки (теперь использует deleteHabit из Zustand)
    const handleDeleteHabit = (habitId: string) => {
        Alert.alert(
            "Удалить привычку?",
            "Вы уверены, что хотите удалить эту привычку? Это действие нельзя отменить.",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteHabit(habitId); // Вызываем функцию из Zustand
                            Alert.alert("Успех", "Привычка удалена.");
                            // Zustand сам обновит `habits`, no need to call `loadData()` here.
                        } catch (error) {
                            console.error("Error deleting habit:", error);
                            Alert.alert("Ошибка", "Не удалось удалить привычку.");
                        }
                    },
                },
            ]
        );
    };

    // Обработчик обновления прогресса (теперь использует updateHabitProgress из Zustand)
    const handleUpdateHabitProgress = async (habitId: string, newProgress: number) => {
        try {
            const habitToUpdate = habits.find(h => h.id === habitId);
            if (!habitToUpdate) {
                console.warn("Habit not found for update progress:", habitId);
                return;
            }
            // Передаем target_completions для записи в daily_progress
            await updateHabitProgress(habitId, newProgress, habitToUpdate.target_completions);
            // Zustand сам обновит `habits`
        } catch (error) {
            console.error("Error updating habit progress:", error);
            Alert.alert("Ошибка", "Не удалось обновить прогресс привычки.");
        }
    };

    const renderRightActions = (habitId: string) => {
        return (
            <TouchableOpacity
                style={[styles.swipeAction, styles.deleteButton]}
                onPress={() => handleDeleteHabit(habitId)}
            >
                <Trash2 size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.swipeButtonText}>Удалить</Text>
            </TouchableOpacity>
        );
    };

    const renderLeftActions = (habit: Habit) => {
        return (
            <TouchableOpacity
                style={[styles.swipeAction, styles.sortButton]} // Добавляем swipeAction
                // Здесь будет логика для перехода на экран сортировки
                onPress={() => {
                    // Переходим на экран сортировки для текущей выбранной категории
                    // или для "Всех" / "Без категории"
                    navigation.navigate("SortHabits", { 
                        categoryId: selectedCategory, // Использовать selectedCategory, чтобы сортировать то, что сейчас показывается
                        categoryName: categories.find(cat => cat.id === selectedCategory)?.name || "Все привычки"
                    });
                }}
            >
                <Menu size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.swipeButtonText}>Сортировать</Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Habit }) => {
        return (
            <Swipeable
                renderRightActions={() => renderRightActions(item.id)}
                renderLeftActions={() => renderLeftActions(item)}
                overshootRight={false}
                overshootLeft={false}
                containerStyle={styles.swipeableContainer}
            >
                <HabitCard
                    habit={item}
                    onUpdateProgress={handleUpdateHabitProgress}
                    onDeleteHabit={() => { /* Удаление происходит через свайп, поэтому здесь ничего не делаем */ }}
                />
            </Swipeable>
        );
    };

    const handleLongPressCategory = (category: Category) => {
        if (category.id === "All" || category.id === "Без категории") {
            return;
        }
        setSelectedCategoryForMenu(category);
        setShowCategoryMenu(true);
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategoryForMenu) return;

        Alert.alert(
            "Удалить категорию",
            `Вы уверены, что хотите удалить категорию "${selectedCategoryForMenu.name}"? Привычки, привязанные к этой категории, останутся, но будут без категории.`,
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    onPress: async () => {
                        try {
                            await deleteCategory(selectedCategoryForMenu.id); // Вызываем функцию из Zustand
                            setShowCategoryMenu(false);
                            setSelectedCategoryForMenu(null);
                            Alert.alert("Успех", "Категория удалена.");
                            // Zustand сам обновит `categories` и привычки
                        } catch (error) {
                            console.error("Error deleting category:", error);
                            Alert.alert("Ошибка", "Не удалось удалить категорию.");
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    const handleSortCategories = () => {
        setShowCategoryMenu(false);
        navigation.navigate("SortCategories");
    };

    const handleSortHabits = () => {
        if (!selectedCategoryForMenu) return;
        setShowCategoryMenu(false);

        navigation.navigate("SortHabits", {
            categoryId: selectedCategoryForMenu.id,
            categoryName: selectedCategoryForMenu.name
        });
    };

    const renderCategory = (item: Category) => {
        const isSelected = selectedCategory === item.id;
        const CatIcon = item.icon && iconMap[item.icon] ? iconMap[item.icon] : Book;

        return (
            <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedCategory(item.id)}
                onLongPress={() => handleLongPressCategory(item)}
                style={styles.categoryButtonWrapper}
            >
                <Animated.View
                    style={[
                        styles.categoryButton,
                        { backgroundColor: isSelected ? colors.accent : "rgba(255,255,255,0.08)" },
                        isSelected && { borderColor: item.color || colors.accent, borderWidth: 2 },
                    ]}
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                >
                    {item.id !== "All" && item.id !== "Без категории" && (
                        <CatIcon size={16} color={isSelected ? "#FFFFFF" : item.color || colors.accent} style={{ marginRight: 6 }} />
                    )}
                    <Text
                        style={[
                            styles.categoryText,
                            { color: isSelected ? "#FFFFFF" : colors.text },
                            isSelected && styles.selectedCategoryText,
                        ]}
                    >
                        {item.name}
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    // Устанавливаем опции заголовка, включая кнопку переключения темы
    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: "Мои привычки",
            headerStyle: {
                backgroundColor: colors.background,
                shadowColor: 'transparent',
                elevation: 0,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
                fontWeight: 'bold',
            },
            headerRight: () => (
                <View style={styles.headerRightContainer}>
                    <ModeToggle />
                    <TouchableOpacity
                        onPressIn={handleAddPressIn}
                        onPressOut={handleAddPressOut}
                        onPress={() => navigation.navigate("AddHabit")}
                        style={[styles.addButtonTop, { backgroundColor: colors.accent }]}
                    >
                        <Animated.Text style={[styles.addButtonText, animatedAddButtonStyle]}>+</Animated.Text>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, colors, handleAddPressIn, handleAddPressOut]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ color: colors.text, marginTop: 10 }}>Загрузка данных...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.categoryFilterBar, { backgroundColor: colors.inputBackground }]}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={categories}
                    renderItem={({ item }) => renderCategory(item)}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.categoryList}
                />
            </View>
            {filteredHabits.length === 0 ? (
                <View style={styles.centerContent}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        {selectedCategory === "All"
                            ? "У вас пока нет привычек.\nНажмите '+' чтобы добавить первую привычку!"
                            : `Нет привычек в категории "${categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}"`}
                    </Text>
                </View>
            ) : (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={{ flex: 1 }}>
                    <FlatList
                        data={filteredHabits}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.habitList}
                    />
                </Animated.View>
            )}

            <Modal
                visible={showCategoryMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCategoryMenu(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryMenu(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.inputBackground }]}>
                        <Text style={[styles.modalHeader, { color: colors.text }]}>
                            {selectedCategoryForMenu?.name}
                        </Text>

                        <Pressable
                            onPressIn={handleSortPressIn}
                            onPressOut={handleSortPressOut}
                            onPress={handleSortCategories}
                            style={{ width: '100%' }}
                        >
                            <Animated.View style={[styles.modalButton, { backgroundColor: colors.accent }, animatedSortButtonStyle]}>
                                <Edit size={20} color="#FFFFFF" />
                                <Text style={styles.modalButtonText}>Перемещать категории</Text>
                            </Animated.View>
                        </Pressable>


                        {selectedCategoryForMenu && (
                            <Pressable
                                onPressIn={handleSortHabitsPressIn}
                                onPressOut={handleSortHabitsPressOut}
                                onPress={handleSortHabits}
                                style={{ width: '100%' }}
                            >
                                <Animated.View style={[styles.modalButton, { backgroundColor: colors.accent }, animatedSortHabitsButtonStyle]}>
                                    <Menu size={20} color="#FFFFFF" />
                                    <Text style={styles.modalButtonText}>Сортировать привычки</Text>
                                </Animated.View>
                            </Pressable>
                        )}

                        <Pressable
                            onPressIn={handleDeletePressIn}
                            onPressOut={handleDeletePressOut}
                            onPress={handleDeleteCategory}
                            style={{ width: '100%' }}
                        >
                            <Animated.View style={[styles.modalButton, { backgroundColor: '#FF6F61' }, animatedDeleteButtonStyle]}>
                                <Trash2 size={20} color="#FFFFFF" />
                                <Text style={styles.modalButtonText}>Удалить</Text>
                            </Animated.View>
                        </Pressable>

                        <Pressable
                            onPressIn={handleCancelPressIn}
                            onPressOut={handleCancelPressOut}
                            onPress={() => setShowCategoryMenu(false)}
                            style={{ width: '100%' }}
                        >
                            <Animated.View style={[styles.modalButtonSecondary, { borderColor: colors.inputBorder }, animatedCancelButtonStyle]}>
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
                            </Animated.View>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
    },
    addButtonTop: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 6,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "600",
    },
    categoryFilterBar: {
        paddingVertical: 12,
        marginBottom: 20,
        borderRadius: 20,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryList: {
        paddingHorizontal: 12,
    },
    categoryButtonWrapper: {
        marginRight: 12,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    categoryText: {
        fontSize: 15,
        fontWeight: "500",
    },
    selectedCategoryText: {
        fontWeight: "700",
    },
    habitList: {
        paddingHorizontal: 4,
        paddingBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 60,
        lineHeight: 24,
    },
    centerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    swipeableContainer: {
        marginVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    swipeAction: {
        justifyContent: "center",
        alignItems: "center",
        width: 90,
        height: '100%',
        paddingHorizontal: 10,
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        marginLeft: 0,
    },
    sortButton: { // Изменен на "Edit"
        backgroundColor: "#007AFF",
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        marginRight: 0,
    },
    swipeButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalContent: {
        padding: 20,
        borderRadius: 15,
        width: "80%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 8,
        width: "100%",
    },
    modalButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    modalButtonSecondary: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 8,
        width: "100%",
        borderWidth: 1,
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
