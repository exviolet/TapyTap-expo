// src/screens/EditHabitScreen.tsx
import React, { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform, Modal, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../components/ThemeProvider';
import { Habit, updateHabit, fetchCategories, Category, addCategory } from '../lib/habits';
import {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart, Check,
    Lightbulb, Bell, Archive, PlusCircle, MinusCircle, X, Clock
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { format } from 'date-fns';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Типы для навигации
type RootStackParamList = {
    Habits: undefined;
    EditHabit: { habit: Habit };
};

type EditHabitScreenRouteProp = RouteProp<RootStackParamList, 'EditHabit'>;
type EditHabitScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditHabit'>;

// Маппинг иконок
const iconMap: { [key: string]: React.ComponentType<any> } = {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart,
    Lightbulb, Bell, Archive, Clock, PlusCircle, MinusCircle, X
};

const availableIcons = [
    'Book', 'Activity', 'GraduationCap', 'Briefcase', 'Music', 'Coffee', 'Sun', 'Moon', 'Star', 'Heart',
    'Lightbulb', 'Bell', 'Archive', 'Clock'
];

const predefinedUnits = ["раз", "минут", "стр.", "км"];
const daysOfWeek = [
    { key: "mon", label: "Пн" },
    { key: "tue", label: "Вт" },
    { key: "wed", label: "Ср" },
    { key: "thu", label: "Чт" },
    { key: "fri", label: "Пт" },
    { key: "sat", label: "Сб" },
    { key: "sun", label: "Вс" },
];

interface Reminder {
    time: string;
    days: string[];
}

export default function EditHabitScreen() {
    const theme = useContext(ThemeContext);
    const { colors, isDark } = theme || { colors: { background: "#1A1A2E", text: "#FFFFFF", accent: "#6A0DAD", inputBackground: "#2A2A3E", inputBorder: "#3A3A5C" } };
    const navigation = useNavigation<EditHabitScreenNavigationProp>();
    const route = useRoute<EditHabitScreenRouteProp>();
    const { user } = useAuth();

    const { habit: initialHabit } = route.params;

    // Состояния для полей формы
    const [name, setName] = useState(initialHabit.name);
    const [description, setDescription] = useState(initialHabit.description || '');
    const [habitType, setHabitType] = useState(initialHabit.type || 'checkoff'); // Только для отображения, изменение запрещено
    const [unit, setUnit] = useState(initialHabit.unit || '');
    const [targetCompletions, setTargetCompletions] = useState(initialHabit.target_completions || 1);
    const [selectedIcon, setSelectedIcon] = useState(initialHabit.icon);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialHabit.categories || []);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [goalSeries, setGoalSeries] = useState(initialHabit.goal_series === 1 ? 'Ежедневно' : initialHabit.goal_series === 7 ? 'Неделя' : initialHabit.goal_series === 30 ? 'Месяц' : 'Ежедневно');
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isReminderModalVisible, setReminderModalVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentDays, setCurrentDays] = useState<string[]>([]);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Состояния для модальных окон
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#6A0DAD');
    const [newCategoryIcon, setNewCategoryIcon] = useState('Book');

    // Анимации
    const scale = useSharedValue(1);
    const segmentScale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const segmentAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: segmentScale.value }],
    }));

    const handlePressIn = () => { scale.value = withSpring(0.95); };
    const handlePressOut = () => { scale.value = withSpring(1); };
    const handleSegmentPressIn = () => { segmentScale.value = withTiming(0.95, { duration: 100 }); };
    const handleSegmentPressOut = () => { segmentScale.value = withTiming(1, { duration: 100 }); };

    const colorOptions = [
        "#FF6F61", "#6A0DAD", "#00C4B4", "#FFD54F", "#3F51B5", "#E91E63",
        "#4CAF50", "#F44336", "#2196F3", "#FF9800", "#9C27B0", "#03A9F4",
    ];

    const loadCategories = useCallback(async () => {
        try {
            const fetchedCategories = await fetchCategories();
            const filtered = fetchedCategories.filter(cat => cat.id !== "All" && cat.id !== "Без категории");
            setAllCategories(filtered);
        } catch (error) {
            console.error("Error loading categories:", error);
            Alert.alert("Ошибка", "Не удалось загрузить категории.");
        }
    }, []);

    useEffect(() => {
        // Парсинг frequency как JSON с обработкой ошибок
        try {
            const parsedReminders = typeof initialHabit.frequency === 'string' 
                ? JSON.parse(initialHabit.frequency) 
                : initialHabit.frequency || [];
            setReminders(Array.isArray(parsedReminders) ? parsedReminders : []);
        } catch (e) {
            console.warn("Failed to parse frequency, using empty array:", e);
            setReminders([]);
        }
    }, [initialHabit.frequency]);

    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [loadCategories])
    );

    const handleCategoryToggle = (category: Category) => {
        setSelectedCategories((prev) =>
            prev.some((c) => c.id === category.id)
                ? prev.filter((c) => c.id !== category.id)
                : [...prev, category]
        );
    };

    const handleTargetCompletionsChange = (value: number) => {
        setTargetCompletions(Math.max(1, value));
    };

    const handleAddNewCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert("Ошибка", "Название новой категории не может быть пустым.");
            return;
        }
        try {
            const addedCategory = await addCategory({
                name: newCategoryName.trim(),
                color: newCategoryColor,
                icon: newCategoryIcon,
            });
            Alert.alert("Успех", `Категория "${addedCategory.name}" добавлена.`);
            setNewCategoryName('');
            setNewCategoryColor('#6A0DAD');
            setNewCategoryIcon('Book');
            setShowAddCategoryModal(false);
            await loadCategories();
        } catch (error) {
            console.error("Error adding new category:", error);
            Alert.alert("Ошибка", `Не удалось добавить категорию: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleAddOrUpdateReminder = () => {
        if (currentDays.length === 0) {
            Alert.alert("Ошибка", "Выберите хотя бы один день недели для напоминания.");
            return;
        }
        const timeString = format(currentTime, "HH:mm");
        const existingReminderIndex = reminders.findIndex((r) => r.time === timeString);

        if (existingReminderIndex > -1) {
            const updatedReminders = [...reminders];
            updatedReminders[existingReminderIndex].days = [...new Set([...updatedReminders[existingReminderIndex].days, ...currentDays])].sort();
            setReminders(updatedReminders);
        } else {
            setReminders([...reminders, { time: timeString, days: currentDays }].sort((a, b) => a.time.localeCompare(b.time)));
        }
        setReminderModalVisible(false);
        setCurrentDays([]);
    };

    const handleRemoveReminder = (timeToRemove: string) => {
        setReminders(reminders.filter((r) => r.time !== timeToRemove));
    };

    const handleSaveHabit = async () => {
        if (!name.trim()) {
            Alert.alert("Ошибка", "Название привычки не может быть пустым.");
            return;
        }
        if (habitType === "quantitative" && !unit.trim()) {
            Alert.alert("Ошибка", "Укажите единицу измерения (например, 'раз', 'стр.', 'км').");
            return;
        }
        if (targetCompletions <= 0) {
            Alert.alert("Ошибка", "Целевое количество выполнений должно быть больше 0.");
            return;
        }

        const goalSeriesValue = goalSeries === 'Ежедневно' ? 1 : goalSeries === 'Неделя' ? 7 : 30;
        const reminderData = JSON.stringify(reminders);

        const updatedFields: Partial<Habit> = {
            name: name.trim(),
            description: description.trim(),
            target_completions: targetCompletions,
            icon: selectedIcon,
            goal_series: goalSeriesValue,
            frequency: reminderData,
            type: initialHabit.type, // Используем исходный тип, изменение запрещено
            unit: habitType === "quantitative" ? unit.trim() : null,
        };

        const categoryIdsToUpdate = selectedCategories.map(cat => cat.id);

        try {
            await updateHabit(initialHabit.id, updatedFields, categoryIdsToUpdate);
            Alert.alert("Успех", "Привычка успешно обновлена!");
            navigation.goBack();
        } catch (error) {
            console.error("Error updating habit:", error);
            Alert.alert("Ошибка", `Не удалось обновить привычку: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const isCategorySelected = (categoryId: string) => {
        return selectedCategories.some((c) => c.id === categoryId);
    };

    const CurrentHabitIcon = iconMap[selectedIcon || 'Book'];
    const NewCategoryPreviewIcon = iconMap[newCategoryIcon || 'Book'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={[styles.title, { color: colors.text }]}>Редактировать привычку</Text>

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Тип привычки</Text>
                    <View style={[styles.readonlyField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                        <Text style={[styles.readonlyText, { color: colors.text }]}>
                            {habitType === 'checkoff' ? 'Выполнено / Не выполнено' : 'Количественная'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Название привычки</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Например, Читать 30 минут"
                        placeholderTextColor={colors.text + '80'}
                    />
                </View>

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Описание </Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: colors.text }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Дополнительные детали о привычке"
                        placeholderTextColor={colors.text + '80'}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Цель серии</Text>
                    <View style={styles.goalSeriesContainer}>
                        {['Ежедневно', 'Неделя', 'Месяц'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.goalSeriesButton,
                                    {
                                        backgroundColor: goalSeries === option ? colors.accent : 'transparent',
                                        borderColor: colors.inputBorder,
                                    },
                                ]}
                                onPress={() => setGoalSeries(option)}
                            >
                                <Text style={[styles.goalSeriesButtonText, { color: goalSeries === option ? '#FFFFFF' : colors.text }]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {habitType === "quantitative" && (
                    <>
                        <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Единица измерения</Text>
                            <View style={styles.chipsContainer}>
                                {predefinedUnits.map((u) => (
                                    <TouchableOpacity
                                        key={u}
                                        style={[
                                            styles.iconOption,
                                            {
                                                backgroundColor: unit === u ? colors.accent : colors.inputBackground,
                                                borderColor: unit === u ? colors.accent : colors.inputBorder,
                                                paddingVertical: 8,
                                                paddingHorizontal: 16,
                                                borderWidth: 2,
                                                borderRadius: 12,
                                                marginRight: 10,
                                                marginBottom: 10,
                                            },
                                        ]}
                                        onPress={() => setUnit(u)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                {
                                                    color: isDark ? '#FFFFFF' : colors.text,
                                                },
                                            ]}
                                        >
                                            {u}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Целевое количество выполнений</Text>
                            <View style={styles.targetCompletionsControl}>
                                <TouchableOpacity
                                    style={[styles.targetButton, { backgroundColor: colors.accent }]}
                                    onPress={() => handleTargetCompletionsChange(targetCompletions - 1)}
                                >
                                    <MinusCircle size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.targetInput, { color: colors.text, borderColor: colors.inputBorder }]}
                                    value={String(targetCompletions)}
                                    onChangeText={(text) => {
                                        const num = parseInt(text, 10);
                                        setTargetCompletions(isNaN(num) ? 1 : Math.max(1, num));
                                    }}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    style={[styles.targetButton, { backgroundColor: colors.accent }]}
                                    onPress={() => handleTargetCompletionsChange(targetCompletions + 1)}
                                >
                                    <PlusCircle size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text, marginBottom: 10 }]}>Иконка привычки</Text>
                    <View style={styles.iconSelectionContainer}>
                        <View style={[styles.currentIconPreview, { backgroundColor: colors.inputBorder }]}>
                            <CurrentHabitIcon size={32} color={colors.accent} strokeWidth={2} />
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                            {availableIcons.map((iconName) => {
                                const IconComponent = iconMap[iconName];
                                if (!IconComponent) return null;
                                return (
                                    <TouchableOpacity
                                        key={iconName}
                                        style={[
                                            styles.iconOption,
                                            {
                                                backgroundColor: selectedIcon === iconName ? colors.accent : colors.inputBackground,
                                                borderColor: selectedIcon === iconName ? colors.accent : colors.inputBorder,
                                            },
                                        ]}
                                        onPress={() => setSelectedIcon(iconName)}
                                    >
                                        <IconComponent size={24} color={selectedIcon === iconName ? '#FFFFFF' : colors.text} strokeWidth={2} />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text, marginBottom: 10 }]}>Категории </Text>
                    <View style={styles.categoriesContainer}>
                        {allCategories.map((category) => {
                            const CatIcon = category.icon && iconMap[category.icon] ? iconMap[category.icon] : Book;
                            return (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryChip,
                                        {
                                            backgroundColor: isCategorySelected(category.id) ? category.color : 'rgba(255,255,255,0.1)',
                                            borderColor: category.color,
                                            borderWidth: isCategorySelected(category.id) ? 0 : 1,
                                        },
                                    ]}
                                    onPress={() => handleCategoryToggle(category)}
                                >
                                    <CatIcon size={14} color={isCategorySelected(category.id) ? '#FFFFFF' : category.color} style={{ marginRight: 5 }} />
                                    <Text style={[styles.categoryChipText, { color: isCategorySelected(category.id) ? '#FFFFFF' : colors.text }]}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.inputBorder,
                                    borderWidth: 1,
                                    borderStyle: 'dashed',
                                },
                            ]}
                            onPress={() => setShowAddCategoryModal(true)}
                        >
                            <PlusCircle size={14} color={colors.text} />
                            <Text style={[styles.categoryChipText, { color: colors.text }]}>Добавить категорию</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal visible={showAddCategoryModal} transparent animationType="fade">
                    <Animated.View style={[styles.modalOverlay, animatedStyle]}>
                        <View style={[styles.modalContent, { backgroundColor: colors.inputBackground }]}>
                            <Text style={[styles.modalHeader, { color: colors.text }]}>Добавить новую категорию</Text>

                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.inputBorder }]}
                                placeholder="Название категории"
                                placeholderTextColor={colors.text + '80'}
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                            />
                            <Text style={[styles.label, { color: colors.text }]}>Иконка категории:</Text>
                            <View style={styles.iconSelectionContainer}>
                                <View style={[styles.currentIconPreview, { backgroundColor: colors.inputBorder }]}>
                                    <NewCategoryPreviewIcon size={32} color={colors.accent} strokeWidth={2} />
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                                    {availableIcons.map((iconName) => {
                                        const IconComponent = iconMap[iconName];
                                        if (!IconComponent) return null;
                                        return (
                                            <TouchableOpacity
                                                key={iconName}
                                                style={[
                                                    styles.iconOption,
                                                    {
                                                        backgroundColor: newCategoryIcon === iconName ? colors.accent : colors.inputBackground,
                                                        borderColor: newCategoryIcon === iconName ? colors.accent : colors.inputBorder,
                                                    },
                                                ]}
                                                onPress={() => setNewCategoryIcon(iconName)}
                                            >
                                                <IconComponent size={24} color={newCategoryIcon === iconName ? '#FFFFFF' : colors.text} strokeWidth={2} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            <Text style={[styles.label, { color: colors.text }]}>Цвет категории:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
                                {colorOptions.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        onPress={() => setNewCategoryColor(item)}
                                        style={[styles.colorButton, { backgroundColor: item }]}
                                    >
                                        {newCategoryColor === item && <Check size={16} color="#FFFFFF" strokeWidth={2} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleAddNewCategory}>
                                <View style={[styles.modalButton, { backgroundColor: colors.accent }]}>
                                    <Text style={styles.modalButtonText}>Добавить</Text>
                                </View>
                            </Pressable>
                            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => setShowAddCategoryModal(false)}>
                                <View style={[styles.modalButtonSecondary, { backgroundColor: colors.inputBorder }]}>
                                    <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
                                </View>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Modal>

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Напоминания</Text>
                    {reminders.length === 0 ? (
                        <Text style={[styles.emptyReminderText, { color: colors.textSecondary }]}>Нет добавленных напоминаний</Text>
                    ) : (
                        reminders.map((reminder, index) => (
                            <View key={index} style={[styles.reminderRow, { borderColor: colors.border }]}>
                                <Text style={[styles.reminderTime, { color: colors.text }]}>{reminder.time}</Text>
                                <Text style={[styles.reminderDays, { color: colors.textSecondary }]}>
                                    {reminder.days.map((d) => daysOfWeek.find((dw) => dw.key === d)?.label).filter(Boolean).join(", ") || "Дни не выбраны"}
                                </Text>
                                <TouchableOpacity onPress={() => handleRemoveReminder(reminder.time)}>
                                    <X size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    <TouchableOpacity style={styles.addReminderButton} onPress={() => setReminderModalVisible(true)}>
                        <PlusCircle size={20} color={colors.accent} />
                        <Text style={[styles.addReminderText, { color: colors.accent }]}>Добавить напоминание</Text>
                    </TouchableOpacity>
                </View>

                <Modal visible={isReminderModalVisible} transparent animationType="fade">
                    <Pressable style={styles.modalOverlay} onPress={() => setReminderModalVisible(false)}>
                        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                            <Text style={[styles.modalHeader, { color: colors.text }]}>Настроить напоминание</Text>

                            <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>1. Выберите время</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                                <Text style={[styles.timeText, { color: isDark ? colors.accent : '#333333' }]}>
                                    {format(currentTime, "HH:mm")}
                                </Text>
                            </TouchableOpacity>

                            {showTimePicker && (
                                <DateTimePicker
                                    value={currentTime}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    textColor={isDark ? '#FFFFFF' : '#000000'}
                                    onChange={(event, date) => {
                                        setShowTimePicker(Platform.OS === "ios");
                                        if (date) setCurrentTime(date);
                                    }}
                                />
                            )}

                            <Text style={[styles.label, { color: colors.text }]}>2. Выберите дни</Text>
                            <View style={styles.chipsContainer}>
                                {daysOfWeek.map((day) => (
                                    <TouchableOpacity
                                        key={day.key}
                                        style={[
                                            styles.iconOption,
                                            {
                                                backgroundColor: currentDays.includes(day.key) ? colors.accent : colors.inputBackground,
                                                borderColor: currentDays.includes(day.key) ? colors.accent : colors.inputBorder,
                                                width: 42,
                                                height: 42,
                                                borderWidth: 2,
                                                borderRadius: 12,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                margin: 5,
                                            },
                                        ]}
                                        onPress={() => {
                                            setCurrentDays((prev) =>
                                                prev.includes(day.key)
                                                    ? prev.filter((d) => d !== day.key)
                                                    : [...prev, day.key]
                                            );
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                {
                                                    color: currentDays.includes(day.key) ? "#FFF" : colors.text,
                                                },
                                            ]}
                                        >
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Pressable
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                onPress={handleAddOrUpdateReminder}
                            >
                                <View style={[styles.modalButton, { backgroundColor: colors.accent }]}>
                                    <Text style={styles.modalButtonText}>Сохранить напоминание</Text>
                                </View>
                            </Pressable>
                        </View>
                    </Pressable>
                </Modal>

                <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleSaveHabit}>
                    <View style={[styles.saveButton, { backgroundColor: colors.accent }]}>
                        <Text style={styles.saveButtonText}>Сохранить изменения</Text>
                    </View>
                </Pressable>

                <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.inputBorder }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Отмена</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    inputGroup: { padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { fontSize: 16, paddingVertical: 8 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    goalSeriesContainer: {
        flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
    },
    goalSeriesButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    goalSeriesButtonText: { fontSize: 16, fontWeight: '600' },
    targetCompletionsControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    targetButton: { padding: 12, borderRadius: 10, marginHorizontal: 10 },
    targetInput: { width: 80, textAlign: 'center', fontSize: 20, fontWeight: 'bold', paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    iconSelectionContainer: { flexDirection: 'row', alignItems: 'center' },
    currentIconPreview: { borderRadius: 12, padding: 10, marginRight: 15, alignItems: 'center', justifyContent: 'center' },
    iconScroll: { flexGrow: 1, alignItems: 'center' },
    iconOption: { padding: 10, borderRadius: 12, marginHorizontal: 5, borderWidth: 2 },
    categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 10, marginBottom: 10 },
    categoryChipText: { fontSize: 14, fontWeight: '500' },
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)" },
    modalContent: { padding: 20, borderRadius: 12, width: "85%", maxHeight: "80%", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 10 },
    modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalButton: { padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 20 },
    modalButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    modalButtonSecondary: { padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 15 },
    colorList: { marginVertical: 10, paddingHorizontal: 5 },
    colorButton: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 5, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.3)" },
    saveButton: { padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    cancelButton: { padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 15, borderWidth: 1 },
    cancelButtonText: { fontSize: 18, fontWeight: '600' },
    reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    reminderTime: { fontSize: 18, fontWeight: '600' },
    reminderDays: { flex: 1, marginLeft: 15, fontSize: 14 },
    addReminderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 15 },
    addReminderText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
    readonlyField: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
    readonlyText: { fontSize: 16, fontWeight: '500' },
    segmentedControl: {
            flexDirection: "row",
            backgroundColor: "#7676801F",
            borderRadius: 8,
            padding: 2,
        },
        segmentText: { fontSize: 14, fontWeight: '600' },
        segmentButton: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
        },
        chipsContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 10,
            justifyContent: "center",
        },
        chipText: {
            fontSize: 14,
            fontWeight: "600",
        },
        timeText: {
            fontSize: 48,
            fontWeight: "bold",
            textAlign: "center",
            marginVertical: 10,
        },
        emptyReminderText: {
            fontSize: 14,
            fontStyle: 'italic',
            marginBottom: 10,
            marginRight: 10,
        },
});
