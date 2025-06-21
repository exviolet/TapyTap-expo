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
import HabitDetailSheet from '../components/HabitDetailSheet'; // <-- Добавь

const iconMap: any = LucideIcons;

type RootStackParamList = {
    Habits: undefined;
    AddHabit: undefined;
    EditHabit: { habit: Habit };
    SortCategories: undefined;
    SortHabits: { categoryId: string; categoryName: string };
    HabitOverviewScreen: { habitId: string; habitName: string }; // ← Добавить
};
type NavigationProp = StackNavigationProp<RootStackParamList, "Habits">;

// --- НОВЫЙ КОМПОНЕНТ ДЛЯ МОДАЛЬНОГО ОКНА КАТЕГОРИЙ ---
const CategoryActionModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    category: Category | null;
    onSortHabits: () => void;
    onSortCategories: () => void;
    onDelete: (categoryId: string, categoryName: string) => void;
}> = ({ visible, onClose, category, onSortHabits, onSortCategories, onDelete }) => {
    const { colors } = useContext(ThemeContext)!;
    if (!category) return null;
    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.modalHeader, { color: colors.text }]}>{category.name}</Text>
                    <TouchableOpacity onPress={onSortHabits} style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}>
                        <LucideIcons.ListOrdered size={20} color={colors.text} /> 
                        <Text style={[styles.modalButtonText, { color: colors.text }]}>Сортировать привычки</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onSortCategories} style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}>
                        <LucideIcons.FolderKanban size={20} color={colors.text} /> 
                        <Text style={[styles.modalButtonText, { color: colors.text }]}>Сортировать категории</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(category.id, category.name)} style={[styles.modalButton, { backgroundColor: colors.danger }]}>
                        <LucideIcons.Trash2 size={20} color="#FFFFFF" />
                        <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Удалить категорию</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={[styles.modalButton, { marginTop: 15, backgroundColor: 'transparent' }]}>
                        <LucideIcons.X size={20} color={colors.text} />
                        <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

// Компонент фильтра категорий
const CategoryFilter: React.FC<{
    categories: Category[];
    selectedCategoryId: string;
    onSelectCategory: (id: string) => void;
    onLongPressCategory: (category: Category) => void;
}> = ({ categories, selectedCategoryId, onSelectCategory, onLongPressCategory }) => {
    const { colors } = useContext(ThemeContext)!;

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
                        <TouchableOpacity
                            key={category.id}
                            style={[styles.categoryChip, { backgroundColor: isSelected ? chipColor : colors.cardBackground, borderColor: isSelected ? chipColor : colors.border }]}
                            onPress={() => onSelectCategory(category.id)}
                            onLongPress={() => !isStatic && onLongPressCategory(category)}
                            delayLongPress={300}
                        >
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
    const { habits, categories, isLoadingHabits, fetchHabits, fetchCategories, archiveHabit, deleteCategory, updateHabitProgress, streaks, calculateStreaks } = useHabitStore();
    
    const [selectedCategoryId, setSelectedCategoryId] = useState('All');
    const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isActionModalVisible, setActionModalVisible] = useState(false);
    const [selectedHabitForAction, setSelectedHabitForAction] = useState<Habit | null>(null);
    const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<Habit | null>(null); // <-- Добавь это

    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [selectedCategoryForAction, setSelectedCategoryForAction] = useState<Category | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (user?.id) {
                fetchHabits(user.id).then(() => {
                    calculateStreaks(user.id);
                });
                fetchCategories(user.id);
            }
        }, [user?.id, fetchHabits, fetchCategories, calculateStreaks])
    );

    const handleLongPressCategory = (category: Category) => {
        setSelectedCategoryForAction(category);
        setCategoryModalVisible(true);
    };

    const handleSortCategoryHabits = () => {
        if (!selectedCategoryForAction) return;
        setCategoryModalVisible(false);
        navigation.navigate('SortHabits', { 
            categoryId: selectedCategoryForAction.id,
            categoryName: selectedCategoryForAction.name
        });
    };

    const handleSortCategories = () => {
        setCategoryModalVisible(false);
        navigation.navigate('SortCategories');
    };

    const handleDeleteCategory = useCallback(async (categoryId: string, categoryName: string) => {
        Alert.alert(`Удалить категорию "${categoryName}"?`, "Привычки в этой категории останутся без категории.",
            [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: async () => { await deleteCategory(categoryId); setCategoryModalVisible(false); }}]);
    }, [deleteCategory]);

    const handleSortHabits = () => {
        setActionModalVisible(false);
        const category = categories.find(c => c.id === selectedCategoryId);
        navigation.navigate('SortHabits', { 
            categoryId: selectedCategoryId,
            categoryName: category ? category.name : 'Все'
        });
    };

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
            [{ text: "Отмена", style: "cancel" }, { text: "Архивировать", onPress: async () => { setActionModalVisible(false); await archiveHabit(habitId); }}]);
    }, [archiveHabit]);

    const handleEditHabit = (habit: Habit) => { setActionModalVisible(false); navigation.navigate('EditHabit', { habit }); };
    const handleHabitLongPress = (habit: Habit) => {
        setSelectedHabitForAction(habit);
        setActionModalVisible(true);
    };
    const handleHabitPress = (habit: Habit) => {
        setSelectedHabitForDetail(habit);
    };

const renderHabitItem = useCallback(({ item }: { item: Habit }) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
        <HabitCard habit={item} onUpdateProgress={handleUpdateProgress} onLongPress={handleHabitLongPress} onPress={handleHabitPress} streak={streaks.get(item.id) || 0} />
    </Animated.View>
), [handleUpdateProgress, handleHabitLongPress, handleHabitPress, currentDate, streaks]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View style={styles.headerSide} /> 
                <Text style={[styles.screenTitle, { color: colors.text }]}>Мои привычки</Text>
                <View style={[styles.headerSide, { justifyContent: 'flex-end' }]}>
                    <ModeToggle />
                </View>
            </View>

            <CategoryFilter
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onLongPressCategory={handleLongPressCategory}
            />
            
            {isLoadingHabits && habits.length === 0 ? (
                <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.accent} /></View>
            ) : (
                <FlatList
                    data={filteredHabits}
                    keyExtractor={(item) => item.id}
                    renderItem={renderHabitItem}
                    contentContainerStyle={styles.flatListContent}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
                    ListEmptyComponent={
                        <View style={styles.emptyListContainer}>
                            <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>{selectedCategoryId !== 'All' ? 'Нет привычек в этой категории' : 'У вас пока нет привычек'}</Text>
                        </View>
                    }
                />
            )}

            <CategoryActionModal 
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                category={selectedCategoryForAction}
                onSortHabits={handleSortCategoryHabits}
                onSortCategories={handleSortCategories}
                onDelete={handleDeleteCategory}
            />
            
            <Modal animationType="fade" transparent visible={isActionModalVisible} onRequestClose={() => setActionModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setActionModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.modalHeader, { color: colors.text }]}>{selectedHabitForAction?.name}</Text>
                        <TouchableOpacity onPress={handleSortHabits} style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}>
                            <LucideIcons.ArrowUpDown size={20} color={colors.text} />
                            <Text style={[styles.modalButtonText, { color: colors.text }]}>Сортировать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => selectedHabitForAction && handleEditHabit(selectedHabitForAction)} style={[styles.modalButton, { backgroundColor: colors.accent }]}>
                            <LucideIcons.Edit size={20} color={colors.buttonText} />
                            <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Редактировать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => selectedHabitForAction && handleArchiveHabit(selectedHabitForAction.id)} style={[styles.modalButton, { backgroundColor: colors.warning }]}>
                            <LucideIcons.Archive size={20} />
                            <Text style={styles.modalButtonText}>Архивировать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActionModalVisible(false)} style={[styles.modalButton, { marginTop: 15, backgroundColor: 'transparent' }]}>
                            <LucideIcons.X size={20} color={colors.text} />
                            <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
            <HabitDetailSheet 
                habit={selectedHabitForDetail}
                onClose={() => setSelectedHabitForDetail(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerSide: { flex: 1, flexDirection: 'row' },
    headerButton: { padding: 8 },
    headerRightContainer: { flexDirection: 'row', alignItems: 'center', gap: 0 },
    screenTitle: { fontSize: 22, fontWeight: 'bold' },
    categoryFilterContainer: { borderBottomColor: '#EAEAEA', minHeight: 50, justifyContent: 'center' },
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
