// src/screens/HabitsScreen.tsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Modal, Pressable, RefreshControl, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ThemeContext } from "../components/ThemeProvider";
import { useHabitStore } from "../store/useHabitStore";
import { Habit, Category } from "../lib/habits";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as LucideIcons from "lucide-react-native";
import { format } from 'date-fns';
import HabitCard from "../components/HabitCard";
import { useAuth } from '../contexts/AuthContext';
import ModeToggle from '../components/ModeToggle';

const iconMap: any = LucideIcons;

type RootStackParamList = {
    Habits: undefined; AddHabit: undefined; EditHabit: { habit: Habit };
    SortCategories: undefined; SortHabits: { categoryId: string; categoryName: string };
};
type NavigationProp = StackNavigationProp<RootStackParamList, "Habits">;

// Компонент фильтра категорий
const CategoryFilter: React.FC<{
    categories: Category[]; selectedCategoryId: string;
    onSelectCategory: (id: string) => void;
    onDeleteCategory: (id: string, name: string) => void;
}> = ({ categories, selectedCategoryId, onSelectCategory, onDeleteCategory }) => {
    const { colors } = useContext(ThemeContext)!;

    // Оборонительная проверка, чтобы приложение не падало, если categories не массив
    if (!Array.isArray(categories) || categories.length === 0) {
        return <View style={styles.categoryFilterContainer}><ActivityIndicator color={colors.accent} /></View>;
    }

    return (
        <View style={styles.categoryFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {categories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;
                    const CategoryIcon = iconMap[category.icon] || LucideIcons.Tag;
                    const isStatic = category.id === 'All' || category.id === 'Uncategorized';
                    const chipColor = category.color || colors.accent;
                    return (
                        <TouchableOpacity key={category.id} style={[styles.categoryChip, { backgroundColor: isSelected ? chipColor : colors.cardBackground, borderColor: isSelected ? chipColor : colors.border }]}
                            onPress={() => onSelectCategory(category.id)} onLongPress={() => !isStatic && onDeleteCategory(category.id, category.name)} delayLongPress={300}>
                            <CategoryIcon size={16} color={isSelected ? "#FFFFFF" : chipColor} style={styles.categoryChipIcon} />
                            <Text style={[styles.categoryChipText, { color: isSelected ? "#FFFFFF" : colors.text }]}>{category.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default function HabitsScreen() {
    const { colors } = useContext(ThemeContext)!;
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();
    // Убедимся, что используем правильные имена из хранилища
    const { habits, categories, isLoading, fetchHabits, fetchCategories, archiveHabit, deleteCategory, updateHabitProgress } = useHabitStore();
    
    const [selectedCategoryId, setSelectedCategoryId] = useState('All');
    const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

    useFocusEffect(useCallback(() => { if (user?.id) { fetchHabits(user.id); fetchCategories(user.id); } }, [user?.id, fetchHabits, fetchCategories]));
    
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        if (user?.id) { await Promise.all([fetchHabits(user.id), fetchCategories(user.id)]); }
        setIsRefreshing(false);
    }, [user, fetchHabits, fetchCategories]);
    
    const handleUpdateProgress = useCallback(async (habitId: string, newProgress: number) => { await updateHabitProgress(habitId, newProgress, currentDate); }, [updateHabitProgress, currentDate]);
    
    const filteredHabits = useMemo(() => {
        if (selectedCategoryId === 'All' || !selectedCategoryId) return habits;
        if (selectedCategoryId === 'Uncategorized') return habits.filter(h => !h.categories || h.categories.length === 0);
        return habits.filter(h => h.categories.some(c => c.id === selectedCategoryId));
    }, [habits, selectedCategoryId]);
    
    const handleArchiveHabit = useCallback(async (habitId: string) => {
        Alert.alert("Архивировать привычку?", "Ее можно будет восстановить в настройках.",
            [{ text: "Отмена", style: "cancel" }, { text: "Архивировать", onPress: async () => { setIsModalVisible(false); await archiveHabit(habitId); }}]);
    }, [archiveHabit]);

    const handleDeleteCategory = useCallback(async (categoryId: string, categoryName: string) => {
        Alert.alert(`Удалить категорию "${categoryName}"?`, "Привычки в этой категории останутся без категории.",
            [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: async () => { await deleteCategory(categoryId); }}]);
    }, [deleteCategory]);

    const handleEditHabit = (habit: Habit) => { setIsModalVisible(false); navigation.navigate('EditHabit', { habit }); };
    const handleHabitLongPress = (habit: Habit) => { setSelectedHabit(habit); setIsModalVisible(true); };
    const handleHabitPress = (habit: Habit) => console.log("Habit pressed:", habit.name);

    const renderHabitItem = useCallback(({ item }: { item: Habit }) => (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <HabitCard habit={item} onUpdateProgress={handleUpdateProgress} onLongPress={handleHabitLongPress} onPress={handleHabitPress} currentDate={currentDate} />
        </Animated.View>
    ), [handleUpdateProgress, handleHabitLongPress, handleHabitPress, currentDate]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => navigation.navigate("SortCategories")} style={styles.headerButton}>
                     <LucideIcons.Menu size={26} color={colors.text} />
                 </TouchableOpacity>
                 <Text style={[styles.screenTitle, { color: colors.text }]}>Мои привычки</Text>
                 <View style={styles.headerRightContainer}>
                     <TouchableOpacity onPress={() => navigation.navigate("AddHabit")} style={styles.headerButton}>
                         <LucideIcons.Plus size={28} color={colors.text} />
                     </TouchableOpacity>
                     <ModeToggle />
                 </View>
            </View>

            <CategoryFilter categories={categories} selectedCategoryId={selectedCategoryId} onSelectCategory={setSelectedCategoryId} onDeleteCategory={handleDeleteCategory} />
            
            {isLoading && habits.length === 0 ? (
                <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.accent} /></View>
            ) : (
                <FlatList
                    data={filteredHabits}
                    keyExtractor={(item) => item.id}
                    renderItem={renderHabitItem}
                    contentContainerStyle={styles.flatListContent}
                    refreshControl={ <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} /> }
                    ListEmptyComponent={
                        <View style={styles.emptyListContainer}>
                            <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>{selectedCategoryId !== 'All' ? 'Нет привычек в этой категории' : 'У вас пока нет привычек'}</Text>
                        </View>
                    }
                />
            )}
            
            <Modal animationType="fade" transparent visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.modalHeader, { color: colors.text }]}>{selectedHabit?.name}</Text>
                        <TouchableOpacity onPress={() => { /* ... */ }} style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}>
                             <LucideIcons.ArrowUpDown size={20} color={colors.text} />
                             <Text style={[styles.modalButtonText, { color: colors.text }]}>Сортировать</Text>
                         </TouchableOpacity>
                        <TouchableOpacity onPress={() => selectedHabit && handleEditHabit(selectedHabit)} style={[styles.modalButton, { backgroundColor: colors.accent }]}>
                            <LucideIcons.Edit size={20} color={colors.buttonText} />
                            <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Редактировать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => selectedHabit && handleArchiveHabit(selectedHabit.id)} style={[styles.modalButton, { backgroundColor: colors.warning }]}>
                            <LucideIcons.Archive size={20} color="#FFFFFF" />
                            <Text style={styles.modalButtonText}>Архивировать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)} style={[styles.modalButton, { marginTop: 15, backgroundColor: 'transparent' }]}>
                            <LucideIcons.X size={20} color={colors.text} />
                            <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerButton: { padding: 8 },
    headerRightContainer: { flexDirection: 'row', alignItems: 'center', gap: 0 },
    screenTitle: { fontSize: 22, fontWeight: 'bold' },
    categoryFilterContainer: { borderBottomWidth: 1, borderBottomColor: '#EAEAEA', minHeight: 50, justifyContent: 'center' },
    categoryScroll: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, borderWidth: 1.5 },
    categoryChipIcon: { marginRight: 8 },
    categoryChipText: { fontSize: 14, fontWeight: '600' },
    flatListContent: { paddingBottom: 20 },
    emptyListContainer: { justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
    emptyListText: { fontSize: 16, textAlign: 'center' },
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)" },
    modalContent: { padding: 20, borderRadius: 15, width: "85%", alignItems: "center", borderWidth: 1 },
    modalHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
    modalButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, marginVertical: 5, width: "100%" },
    modalButtonText: { fontSize: 16, fontWeight: "600", marginLeft: 10 },
});
