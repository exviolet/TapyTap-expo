// src/screens/AddHabitScreen.tsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    Alert,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet, // Используем StyleSheet для стилей
    Platform,
    Pressable, // Для анимаций кнопок
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ThemeContext } from "../components/ThemeProvider";
import { addHabit, addCategory, fetchCategories, Category } from "../lib/habits";
import {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart, Check,
    Lightbulb, Bell, Archive, PlusCircle, MinusCircle, X, Clock // Добавим необходимые иконки
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

// Маппинг иконок для выбора (расширьте, если нужно)
const iconMap: { [key: string]: React.ComponentType<any> } = {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart,
    Lightbulb, Bell, Archive, PlusCircle, MinusCircle, Clock
};

// Список доступных иконок для выбора (для категорий и привычек)
const availableIcons = [
    'Book', 'Activity', 'GraduationCap', 'Briefcase', 'Music', 'Coffee', 'Sun', 'Moon', 'Star', 'Heart',
    'Lightbulb', 'Bell', 'Archive', 'Clock'
];

type RootStackParamList = {
    Habits: undefined;
    AddHabit: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "AddHabit">;
const AddHabitScreen: React.FC<{ navigation: NavigationProp }> = ({ navigation }) => {
    const theme = useContext(ThemeContext);
    const colors = theme?.colors || { 
        background: "#1A1A2E", 
        text: "#FFFFFF", 
        accent: "#6A0DAD", 
        inputBackground: "#2A2A3E", 
        inputBorder: "#3A3A5C" 
    };

    // Состояния для полей формы привычки
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [goalSeries, setGoalSeries] = useState('Ежедневно'); // Теперь 'Ежедневно', 'Неделя', 'Месяц'
    const [targetCompletions, setTargetCompletions] = useState(1); // Теперь число
    const [habitIcon, setHabitIcon] = useState("Book");
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]); // Все категории
    const [reminders, setReminders] = useState<Date[]>([]); // Список объектов Date для напоминаний

    // Состояния для модального окна добавления категории
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("Book");
    const [newCategoryColor, setNewCategoryColor] = useState("#6A0DAD");

    // Состояния для модального окна выбора времени напоминания
    const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
    const [currentReminderTime, setCurrentReminderTime] = useState(new Date()); // Временная переменная для выбора времени

    const [loading, setLoading] = useState(false);

    // Опции цвета для категорий
    const colorOptions = [
        "#FF6F61", "#6A0DAD", "#00C4B4", "#FFD54F", "#3F51B5", "#E91E63",
        "#4CAF50", "#F44336", "#2196F3", "#FF9800", "#9C27B0", "#03A9F4",
    ];

    // Анимации для кнопок
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    // Загрузка категорий при загрузке экрана и при добавлении новой категории
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
        loadCategories();
    }, [loadCategories]);

    // Обработчик изменения целевого количества выполнений
    const handleTargetCompletionsChange = (value: number) => {
        setTargetCompletions(Math.max(1, value)); // Минимум 1
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
            setNewCategoryName('');
            setNewCategoryColor('#6A0DAD'); // Сброс цвета
            setNewCategoryIcon('Book'); // Сброс иконки
            setShowAddCategoryModal(false); // Закрыть модальное окно
            await loadCategories(); // Перезагрузить категории
        } catch (error) {
            console.error("Error adding new category:", error);
            Alert.alert("Ошибка", `Не удалось добавить категорию: ${error instanceof Error ? error.message : String(error)}`);
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
    const handleAddReminder = () => {
        setReminders(prev => {
            // Проверяем, существует ли уже напоминание с таким временем
            const timeExists = prev.some(r =>
                r.getHours() === currentReminderTime.getHours() &&
                r.getMinutes() === currentReminderTime.getMinutes()
            );
            if (timeExists) {
                Alert.alert("Ошибка", "Напоминание с таким временем уже существует.");
                return prev;
            }
            return [...prev, currentReminderTime].sort((a, b) => a.getTime() - b.getTime()); // Сортируем по времени
        });
        setCurrentReminderTime(new Date()); // Сброс для следующего напоминания
    };

    const handleRemoveReminder = (indexToRemove: number) => {
        setReminders(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const onTimeSelected = (event: any, selectedTime: Date | undefined) => {
        setShowReminderTimePicker(false);
        if (selectedTime) {
            setCurrentReminderTime(selectedTime);
        }
    };

    // Обработчик добавления привычки
    const handleAddHabit = async () => {
        if (!name.trim()) {
            Alert.alert("Ошибка", "Название привычки не может быть пустым.");
            return;
        }
        if (targetCompletions <= 0) {
            Alert.alert("Ошибка", "Целевое количество выполнений должно быть больше 0.");
            return;
        }

        const goalSeriesValue = goalSeries === 'Ежедневно' ? 1 : goalSeries === 'Неделя' ? 7 : 30;
        const reminderTimes = reminders.map(r => r.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })).join(', ');

        setLoading(true);
        try {
            await addHabit(
                {
                    name: name.trim(),
                    description: description.trim(),
                    frequency: reminderTimes, // Используем отформатированные напоминания
                    progress: 0, // Добавляем обязательное поле progress
                    goal_series: goalSeriesValue,
                    icon: habitIcon,
                    target_completions: targetCompletions,
                },
                selectedCategories.map(cat => cat.id) // Передаем только ID категорий
            );
            Alert.alert("Успех", "Привычка успешно добавлена!");
            navigation.goBack();
        } catch (error) {
            console.error("Error adding habit:", error);
            Alert.alert("Ошибка", `Не удалось добавить привычку: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const CurrentHabitIcon = iconMap[habitIcon || 'Book'];
    const NewCategoryPreviewIcon = iconMap[newCategoryIcon || 'Book'];


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={[styles.title, { color: colors.text }]}>Добавить привычку</Text>

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
                                                backgroundColor: habitIcon === iconName ? colors.accent : colors.inputBackground,
                                                borderColor: habitIcon === iconName ? colors.accent : colors.inputBorder,
                                            },
                                        ]}
                                        onPress={() => setHabitIcon(iconName)}
                                    >
                                        <IconComponent size={24} color={habitIcon === iconName ? '#FFFFFF' : colors.text} strokeWidth={2} />
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
                                    borderStyle: 'dashed', // Обозначаем как добавление
                                },
                            ]}
                            onPress={() => setShowAddCategoryModal(true)}
                        >
                            <PlusCircle size={14} color={colors.text} style={{ marginRight: 5 }} />
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
                    <View style={styles.remindersContainer}>
                        {reminders.length === 0 ? (
                            <Text style={[styles.emptyReminderText, { color: colors.text + '80' }]}>Нет напоминаний</Text>
                        ) : (
                            reminders.map((r, index) => (
                                <View key={index} style={[styles.reminderChip, { backgroundColor: colors.inputBorder }]}>
                                    <Text style={[styles.reminderChipText, { color: colors.text }]}>
                                        {r.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <TouchableOpacity onPress={() => handleRemoveReminder(index)} style={styles.removeReminderButton}>
                                        <X size={16} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                        <TouchableOpacity
                            style={[styles.addReminderButton, { backgroundColor: colors.accent }]}
                            onPress={() => setShowReminderTimePicker(true)}
                        >
                            <Clock size={20} color="#FFFFFF" style={{ marginRight: 5 }} />
                            <Text style={styles.addReminderButtonText}>Добавить время</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showReminderTimePicker && (
                    <DateTimePicker
                        value={currentReminderTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onTimeSelected}
                        textColor={colors.text} // Для iOS
                    />
                )}
                {Platform.OS === 'android' && showReminderTimePicker && (
                    <TouchableOpacity
                        style={[styles.timePickerConfirmButton, { backgroundColor: colors.accent }]}
                        onPress={() => {
                            setShowReminderTimePicker(false);
                            handleAddReminder(); // Добавляем напоминание после выбора на Android
                        }}
                    >
                        <Text style={styles.timePickerConfirmButtonText}>Подтвердить время</Text>
                    </TouchableOpacity>
                )}


                <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleAddHabit} disabled={loading}>
                    <View style={[styles.saveButton, { backgroundColor: colors.accent }, loading && { opacity: 0.7 }]}>
                        <Text style={styles.saveButtonText}>{loading ? "Добавление..." : "Добавить привычку"}</Text>
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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputGroup: {
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        paddingVertical: 8,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    goalSeriesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    goalSeriesButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    goalSeriesButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    targetCompletionsControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    targetButton: {
        padding: 12,
        borderRadius: 10,
        marginHorizontal: 10,
    },
    targetInput: {
        width: 80,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    iconSelectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentIconPreview: {
        borderRadius: 12,
        padding: 10,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconScroll: {
        flexGrow: 1,
        alignItems: 'center',
    },
    iconOption: {
        padding: 10,
        borderRadius: 12,
        marginHorizontal: 5,
        borderWidth: 2,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
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
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    modalButtonSecondary: {
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
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
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    cancelButton: {
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 15,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    // Стили для напоминаний
    remindersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    reminderChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    reminderChipText: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 5,
    },
    removeReminderButton: {
        marginLeft: 5,
        padding: 2,
    },
    addReminderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    addReminderButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyReminderText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 10,
        marginRight: 10,
    },
    timePickerConfirmButton: {
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginHorizontal: 20, // Центрируем кнопку
    },
    timePickerConfirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default AddHabitScreen;
