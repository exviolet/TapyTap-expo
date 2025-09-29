import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { supabase } from "../supabase/supabaseClient"; // Добавьте эту строку
import {
    View,
    Text,
    TextInput,
    Alert,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    Platform,
    Pressable,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ThemeContext } from '../components/ThemeProvider';
import { IconPickerModal } from "../components/IconPickerModal"; 
import { addHabit, addCategory, fetchCategories, Category } from "../lib/habits";
import * as LucideIcons from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns"; // Добавляем для форматирования времени
import { useHabitStore } from "../store/useHabitStore";

// Маппинг иконок для выбора
const iconMap: any = LucideIcons;

// Список доступных иконок
const availableIcons = [
    "Book",
    "Activity",
    "GraduationCap",
    "Briefcase",
    "Music",
    "Coffee",
    "Sun",
    "Moon",
    "Star",
    "Heart",
    "Lightbulb",
    "Bell",
    "Archive",
    "Clock",
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
    time: string; // 'HH:mm'
    days: string[]; // ['mon', 'tue', ...]
}

type RootStackParamList = {
    Habits: undefined;
    AddHabit: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "AddHabit">;

const AddHabitScreen: React.FC<{ navigation: NavigationProp }> = ({ navigation }) => {
const themeContext = useContext(ThemeContext);

    if (!themeContext) {
        throw new Error('ThemeContext is undefined, please ensure ThemeProvider is present');
    }

    const { colors, isDark } = themeContext; // Деструктурируем после проверки
    const [isIconPickerVisible, setIconPickerVisible] = useState(false); // <-- Новое состояние для модалки

    const [habitType, setHabitType] = useState<"checkoff" | "quantitative">("checkoff");
    const [unit, setUnit] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]); // Для старого подхода, можно удалить, если не используется

    // Состояния для полей формы привычки
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [goalSeries, setGoalSeries] = useState("Ежедневно"); // 'Ежедневно', 'Неделя', 'Месяц'
    const [targetCompletions, setTargetCompletions] = useState(1);
    const [habitIcon, setHabitIcon] = useState("Book");
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    // Состояния для напоминаний
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isReminderModalVisible, setReminderModalVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentDays, setCurrentDays] = useState<string[]>([]);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Состояния для модального окна добавления категории
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("Book");
    const [newCategoryColor, setNewCategoryColor] = useState("#6A0DAD");

    const [loading, setLoading] = useState(false);

    // Опции цвета для категорий
    const colorOptions = [
        "#FF6F61",
        "#6A0DAD",
        "#00C4B4",
        "#FFD54F",
        "#3F51B5",
        "#E91E63",
        "#4CAF50",
        "#F44336",
        "#2196F3",
        "#FF9800",
        "#9C27B0",
        "#03A9F4",
    ];

    // Анимации для кнопок
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleToggleDay = (dayKey: string) => {
        setSelectedDays((prev) =>
            prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
        );
    };

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    // Загрузка категорий
    const loadCategories = useCallback(async () => {
        try {
            const fetchedCategories = await fetchCategories();
            const filtered = fetchedCategories.filter(
                (cat) => cat.id !== "All" && cat.id !== "Без категории"
            );
            setAllCategories(filtered);
        } catch (error) {
            console.error("Error loading categories:", error);
            Alert.alert("Ошибка", "Не удалось загрузить категории.");
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Обработчик изменения целевого количества выполнений
    const handleTargetCompletionsChange = (value: number) => {
        setTargetCompletions(Math.max(1, value));
    };

    // Обработчик добавления новой категории
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
            setNewCategoryName("");
            setNewCategoryColor("#6A0DAD");
            setNewCategoryIcon("Book");
            setShowAddCategoryModal(false);
            await loadCategories();
        } catch (error) {
            console.error("Error adding new category:", error);
            Alert.alert(
                "Ошибка",
                `Не удалось добавить категорию: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    };

    // Переключение категории
    const handleCategoryToggle = (category: Category) => {
        setSelectedCategories((prev) =>
            prev.some((c) => c.id === category.id)
                ? prev.filter((c) => c.id !== category.id)
                : [...prev, category]
        );
    };

    const isCategorySelected = (categoryId: string) => {
        return selectedCategories.some((c) => c.id === categoryId);
    };

    // Обработчики напоминаний
    const handleAddOrUpdateReminder = () => {
        if (currentDays.length === 0) {
            Alert.alert("Ошибка", "Выберите хотя бы один день недели для напоминания.");
            return;
        }
        const timeString = format(currentTime, "HH:mm");

        const existingReminderIndex = reminders.findIndex((r) => r.time === timeString);

        if (existingReminderIndex > -1) {
            const updatedReminders = [...reminders];
            updatedReminders[existingReminderIndex].days = [
                ...new Set([...updatedReminders[existingReminderIndex].days, ...currentDays]),
            ].sort();
            setReminders(updatedReminders);
        } else {
            setReminders(
                [...reminders, { time: timeString, days: currentDays }].sort((a, b) =>
                    a.time.localeCompare(b.time)
                )
            );
        }

        setReminderModalVisible(false);
        setCurrentDays([]);
    };

    const handleRemoveReminder = (timeToRemove: string) => {
        setReminders(reminders.filter((r) => r.time !== timeToRemove));
    };

    // Обработчик добавления привычки
const handleAddHabit = async () => {
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

    const goalSeriesValue =
        goalSeries === "Ежедневно" ? 1 : goalSeries === "Неделя" ? 7 : 30;
    const { data: { user } } = await supabase.auth.getUser(); // Получаем userId
    if (!user) {
        Alert.alert("Ошибка", "Пользователь не авторизован.");
        return;
    }

    setLoading(true);
    try {
        await addHabit(
            {
                name: name.trim(),
                description: description.trim(),
                frequency: { reminders: reminders },
                goal_series: goalSeriesValue,
                icon: habitIcon,
                target_completions: targetCompletions,
                is_archived: false,
                type: habitType,
                unit: habitType === "quantitative" ? unit.trim() : null,
            },
            selectedCategories.map((cat) => cat.id)
        );
        // Обновляем список привычек после добавления
        await useHabitStore.getState().fetchHabits(user.id);
        Alert.alert("Успех", "Привычка успешно добавлена!");
        navigation.goBack();
    } catch (error) {
        console.error("Error adding habit:", error);
        Alert.alert(
            "Ошибка",
            `Не удалось добавить привычку: ${error instanceof Error ? error.message : String(error)}`
        );
    } finally {
        setLoading(false);
    }
};

    const CurrentHabitIcon = iconMap[habitIcon || "Book"];
    const NewCategoryPreviewIcon = iconMap[newCategoryIcon || "Book"];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={[styles.title, { color: colors.text }]}>Добавить привычку</Text>

                <View
                    style={[
                        styles.inputGroup,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                    ]}
                >
                    <Text style={[styles.label, { color: colors.text }]}>Тип привычки</Text>
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[
                                styles.segmentButton,
                                habitType === "checkoff" && { backgroundColor: colors.accent },
                            ]}
                            onPress={() => setHabitType("checkoff")}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    { color: habitType === "checkoff" ? "#FFF" : colors.text },
                                ]}
                            >
                                Выполнено / Не выполнено
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.segmentButton,
                                habitType === "quantitative" && { backgroundColor: colors.accent },
                            ]}
                            onPress={() => setHabitType("quantitative")}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    { color: habitType === "quantitative" ? "#FFF" : colors.text },
                                ]}
                            >
                                Количественная
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View
                    style={[
                        styles.inputGroup,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                    ]}
                >
                    <Text style={[styles.label, { color: colors.text }]}>Название привычки</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Например, Читать 30 минут"
                        placeholderTextColor={colors.text + "80"}
                    />
                </View>

                <View
                    style={[
                        styles.inputGroup,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                    ]}
                >
                    <Text style={[styles.label, { color: colors.text }]}>Описание</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: colors.text }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Дополнительные детали о привычке"
                        placeholderTextColor={colors.text + "80"}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {habitType === "quantitative" && (
                    <>
                        <View
                            style={[
                                styles.inputGroup,
                                {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.inputBorder,
                                },
                            ]}
                        >
                            <Text style={[styles.label, { color: colors.text }]}>
                                Единица измерения
                            </Text>
                            <View style={styles.chipsContainer}>
                                {predefinedUnits.map((u) => (
                                    <TouchableOpacity
                                        key={u}
                                        style={[
                                            styles.iconOption, // Используем стиль иконок
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
                                                    color: isDark ? '#FFFFFF' : colors.text, // Белый текст на темной теме
                                                },
                                            ]}
                                        >
                                            {u}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View
                            style={[
                                styles.inputGroup,
                                {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.inputBorder,
                                },
                            ]}
                        >
                            <Text style={[styles.label, { color: colors.text }]}>
                                Целевое количество выполнений
                            </Text>
                            <View style={styles.targetCompletionsControl}>
                                <TouchableOpacity
                                    style={[styles.targetButton, { backgroundColor: colors.accent }]}
                                    onPress={() =>
                                        handleTargetCompletionsChange(targetCompletions - 1)
                                    }
                                >
                                    <LucideIcons.MinusCircle size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TextInput
                                    style={[
                                        styles.targetInput,
                                        { color: colors.text, borderColor: colors.inputBorder },
                                    ]}
                                    value={String(targetCompletions)}
                                    onChangeText={(text) => {
                                        const num = parseInt(text, 10);
                                        setTargetCompletions(
                                            isNaN(num) ? 1 : Math.max(1, num)
                                        );
                                    }}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    style={[styles.targetButton, { backgroundColor: colors.accent }]}
                                    onPress={() =>
                                        handleTargetCompletionsChange(targetCompletions + 1)
                                    }
                                >
                                    <LucideIcons.PlusCircle size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                <View
                    style={[
                        styles.inputGroup,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                    ]}
                >
                    <Text style={[styles.label, { color: colors.text }]}>Цель серии</Text>
                    <View style={styles.goalSeriesContainer}>
                        {["Ежедневно", "Неделя", "Месяц"].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.goalSeriesButton,
                                    {
                                        backgroundColor:
                                            goalSeries === option ? colors.accent : "transparent",
                                        borderColor: colors.inputBorder,
                                    },
                                ]}
                                onPress={() => setGoalSeries(option)}
                            >
                                <Text
                                    style={[
                                        styles.goalSeriesButtonText,
                                        {
                                            color:
                                                goalSeries === option
                                                    ? "#FFFFFF"
                                                    : colors.text,
                                        },
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Иконка привычки</Text>
                    <TouchableOpacity 
                        style={styles.iconSelectionContainer}
                        onPress={() => setIconPickerVisible(true)}
                    >
                        <View style={[styles.currentIconPreview, { backgroundColor: colors.inputBorder }]}>
                            <CurrentHabitIcon size={32} color={colors.accent} strokeWidth={2} />
                        </View>
                        <Text style={[styles.iconSelectText, {color: colors.text}]}>Нажмите, чтобы добавить</Text>
                        <LucideIcons.ChevronRight size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <IconPickerModal 
                    visible={isIconPickerVisible}
                    onClose={() => setIconPickerVisible(false)}
                    onSelectIcon={setHabitIcon}
                    currentIcon={habitIcon}
                />

                <View
                    style={[
                        styles.inputGroup,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                    ]}
                >
                    <Text
                        style={[styles.label, { color: colors.text, marginBottom: 10 }]}
                    >
                        Категории
                    </Text>
                    <View style={styles.categoriesContainer}>
                        {allCategories.map((category) => {
                            const CatIcon =
                                category.icon && iconMap[category.icon]
                                    ? iconMap[category.icon]
                                    : LucideIcons.Book;
                            return (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryChip,
                                        {
                                            backgroundColor: isCategorySelected(category.id)
                                                ? category.color
                                                : "rgba(255,255,255,0.1)",
                                            borderColor: category.color,
                                            borderWidth: isCategorySelected(category.id)
                                                ? 0
                                                : 1,
                                        },
                                    ]}
                                    onPress={() => handleCategoryToggle(category)}
                                >
                                    <CatIcon
                                        size={14}
                                        color={
                                            isCategorySelected(category.id)
                                                ? "#FFFFFF"
                                                : category.color
                                        }
                                        style={{ marginRight: 5 }}
                                    />
                                    <Text
                                        style={[
                                            styles.categoryChipText,
                                            {
                                                color: isCategorySelected(category.id)
                                                    ? "#FFFFFF"
                                                    : colors.text,
                                            },
                                        ]}
                                    >
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
                                    borderStyle: "dashed",
                                },
                            ]}
                            onPress={() => setShowAddCategoryModal(true)}
                        >
                            <LucideIcons.PlusCircle
                                size={14}
                                color={colors.text}
                                style={{ marginRight: 5 }}
                            />
                            <Text
                                style={[styles.categoryChipText, { color: colors.text }]}
                            >
                                Добавить категорию
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal
                    visible={showAddCategoryModal}
                    transparent
                    animationType="fade"
                >
                    <Animated.View style={[styles.modalOverlay, animatedStyle]}>
                        <View
                            style={[
                                styles.modalContent,
                                { backgroundColor: colors.inputBackground },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.modalHeader,
                                    { color: colors.text },
                                ]}
                            >
                                Добавить новую категорию
                            </Text>

                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors.inputBorder },
                                ]}
                                placeholder="Название категории"
                                placeholderTextColor={colors.text + "80"}
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                            />
                    <Text style={[styles.label, { color: colors.text }]}>Иконка привычки</Text>
                    <TouchableOpacity 
                        style={styles.iconSelectionContainer}
                        onPress={() => setIconPickerVisible(true)}
                    >
                        <View style={[styles.currentIconPreview, { backgroundColor: colors.inputBorder }]}>
                            <CurrentHabitIcon size={32} color={colors.accent} strokeWidth={2} />
                        </View>
                        <Text style={[styles.iconSelectText, {color: colors.text}]}>Нажмите, чтобы добавить</Text>
                        <LucideIcons.ChevronRight size={22} color={colors.textSecondary} />
                    </TouchableOpacity>

                <IconPickerModal 
                    visible={isIconPickerVisible}
                    onClose={() => setIconPickerVisible(false)}
                    onSelectIcon={setHabitIcon}
                    currentIcon={habitIcon}
                />

                            <Text style={[styles.label, { color: colors.text }]}>
                                Цвет категории:
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.colorList}
                            >
                                {colorOptions.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        onPress={() => setNewCategoryColor(item)}
                                        style={[styles.colorButton, { backgroundColor: item }]}
                                    >
                                        {newCategoryColor === item && (
                                            <LucideIcons.Check
                                                size={16}
                                                color="#FFFFFF"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Pressable
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                onPress={handleAddNewCategory}
                            >
                                <View
                                    style={[
                                        styles.modalButton,
                                        { backgroundColor: colors.accent },
                                    ]}
                                >
                                    <Text style={styles.modalButtonText}>Добавить</Text>
                                </View>
                            </Pressable>
                            <Pressable
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                onPress={() => setShowAddCategoryModal(false)}
                            >
                                <View
                                    style={[
                                        styles.modalButtonSecondary,
                                        { backgroundColor: colors.inputBorder },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.modalButtonText,
                                            { color: colors.text },
                                        ]}
                                    >
                                        Отмена
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Modal>

                <View
                    style={[
                        styles.inputGroup,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                    ]}
                >
                    <Text style={[styles.label, { color: colors.text }]}>
                        Напоминания
                    </Text>
                    {reminders.length === 0 ? (
                        <Text
                            style={[
                                styles.emptyReminderText,
                                { color: colors.textSecondary },
                            ]}
                        >
                            Нет добавленных напоминаний
                        </Text>
                    ) : (
                        reminders.map((reminder, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.reminderRow,
                                    { borderColor: colors.border },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.reminderTime,
                                        { color: colors.text },
                                    ]}
                                >
                                    {reminder.time}
                                </Text>
                                <Text
                                    style={[
                                        styles.reminderDays,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    {reminder.days
                                        .map((d) =>
                                            daysOfWeek.find((dw) => dw.key === d)?.label
                                        )
                                        .filter(Boolean)
                                        .join(", ") || "Дни не выбраны"}
                                </Text>
                                <TouchableOpacity
                                    onPress={() =>
                                        handleRemoveReminder(reminder.time)
                                    }
                                >
                                    <LucideIcons.X size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    <TouchableOpacity
                        style={styles.addReminderButton}
                        onPress={() => setReminderModalVisible(true)}
                    >
                        <LucideIcons.PlusCircle size={20} color={colors.accent} />
                        <Text
                            style={[
                                styles.addReminderText,
                                { color: colors.accent },
                            ]}
                        >
                            Добавить напоминание
                        </Text>
                    </TouchableOpacity>
                </View>

                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleAddHabit}
                    disabled={loading}
                >
                    <View
                        style={[
                            styles.saveButton,
                            { backgroundColor: colors.accent },
                            loading && { opacity: 0.7 },
                        ]}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? "Добавление..." : "Добавить привычку"}
                        </Text>
                    </View>
                </Pressable>

                <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.inputBorder }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text
                        style={[styles.cancelButtonText, { color: colors.text }]}
                    >
                        Отмена
                    </Text>
                </TouchableOpacity>
            </ScrollView>

<Modal
    visible={isReminderModalVisible}
    transparent
    animationType="fade"
>
    <Pressable
        style={styles.modalOverlay}
        onPress={() => setReminderModalVisible(false)}
    >
        <View
            style={[
                styles.modalContent,
                { backgroundColor: colors.cardBackground },
            ]}
        >
            <Text
                style={[
                    styles.modalHeader,
                    { color: colors.text },
                ]}
            >
                Настроить напоминание
            </Text>

            <Text
                style={[
                    styles.label,
                    { color: colors.text, marginTop: 0 },
                ]}
            >
                1. Выберите время
            </Text>
            <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
            >
                <Text
                    style={[
                        styles.timeText,
                        { 
                            color: isDark ? colors.accent : colors.accent, // Используем isDark из контекста
                        },
                    ]}
                >
                    {format(currentTime, "HH:mm")}
                </Text>
            </TouchableOpacity>

            {showTimePicker && (
                <DateTimePicker
                    value={currentTime}
                    mode="time"
                    display="spinner"
                    textColor={isDark ? colors.accent : colors.accent} // Попытка установить цвет текста для iOS
                    onChange={(event, date) => {
                        setShowTimePicker(Platform.OS === "ios");
                        if (date) setCurrentTime(date);
                    }}
                />
            )}

            <Text style={[styles.label, { color: colors.text }]}>
                2. Выберите дни
            </Text>
            <View style={styles.chipsContainer}>
                {daysOfWeek.map((day) => (
                    <TouchableOpacity
                        key={day.key}
                        style={[
                            styles.iconOption,
                            {
                                backgroundColor: currentDays.includes(day.key)
                                    ? colors.accent
                                    : colors.inputBackground,
                                borderColor: currentDays.includes(day.key)
                                    ? colors.accent
                                    : colors.inputBorder,
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
                <View
                    style={[
                        styles.modalButton,
                        { backgroundColor: colors.accent },
                    ]}
                >
                    <Text
                        style={styles.modalButtonText}
                    >
                        Сохранить напоминание
                    </Text>
                </View>
            </Pressable>
        </View>
    </Pressable>
</Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40,
        paddingTop: Platform.OS === "android" ? 20 : 0,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 30,
        textAlign: "center",
    },
    inputGroup: {
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        paddingVertical: 8,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    goalSeriesContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 10,
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    goalSeriesButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRightWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    goalSeriesButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    targetCompletionsControl: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },
    targetButton: {
        padding: 12,
        borderRadius: 10,
        marginHorizontal: 10,
    },
    targetInput: {
        width: 80,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    iconSelectionContainer: { // <-- Этот стиль уже есть, мы просто будем использовать его по-новому
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    currentIconPreview: {
        width: 52, // <-- Зададим фиксированный размер
        height: 52,
        borderRadius: 12,
        padding: 10,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSelectText: { // <-- Новый стиль
        fontSize: 16,
        fontWeight: '500',
    },
    iconScroll: {
        flexGrow: 1,
        alignItems: "center",
    },
    iconOption: {
        padding: 10,
        borderRadius: 12,
        marginHorizontal: 5,
        borderWidth: 2,
    },
    categoriesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: "500",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalContent: {
        padding: 20,
        borderRadius: 12,
        width: "85%",
        maxHeight: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    modalButton: {
        padding: 16,
        borderRadius: 15,
        alignItems: "center",
        marginTop: 20,
    },
    modalButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    modalButtonSecondary: {
        padding: 16,
        borderRadius: 15,
        alignItems: "center",
        marginTop: 15,
    },
    colorList: {
        marginVertical: 10,
        paddingHorizontal: 5,
    },
    colorButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginHorizontal: 5,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    saveButton: {
        padding: 16,
        borderRadius: 15,
        alignItems: "center",
        marginTop: 20,
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    cancelButton: {
        padding: 16,
        borderRadius: 15,
        alignItems: "center",
        marginTop: 15,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 18,
        fontWeight: "600",
    },
    segmentedControl: {
        flexDirection: "row",
        backgroundColor: "#7676801F",
        borderRadius: 8,
        padding: 2,
    },
    segmentText: { fontSize: 14, fontWeight: "600" },
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
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1.5,
    },
    chipText: {
        fontSize: 14,
        fontWeight: "600",
    },
    dayChip: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: "center",
        alignItems: "center",
        margin: 5,
        borderWidth: 1.5,
    },
    reminderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    reminderTime: {
        fontSize: 18,
        fontWeight: "600",
    },
    reminderDays: {
        flex: 1,
        marginLeft: 15,
        fontSize: 14,
    },
    addReminderButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 15,
    },
    addReminderText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    timeText: {
        fontSize: 48,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 10,
    },
    modalSaveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
    },
    emptyReminderText: {
        fontSize: 14,
        fontStyle: "italic",
        marginBottom: 10,
        marginRight: 10,
    },
});

export default AddHabitScreen;
