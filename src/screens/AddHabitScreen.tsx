// src/screens/AddHabitScreen.tsx
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Pressable,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ThemeContext } from "../components/ThemeProvider";
import { addHabit, addCategory, fetchCategories, Category } from "../lib/habits";
import {
  Book,
  Activity,
  GraduationCap,
  Briefcase,
  Music,
  Coffee,
  Sun,
  Moon,
  Star,
  Heart,
  Check,
} from "lucide-react-native"; // Импортируем конкретные иконки
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

// Маппинг иконок для выбора
const iconMap: { [key: string]: React.ComponentType<any> } = {
  Book,
  Activity,
  GraduationCap,
  Briefcase,
  Music,
  Coffee,
  Sun,
  Moon,
  Star,
  Heart,
};

type RootStackParamList = {
  Habits: undefined;
  AddHabit: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "AddHabit">;

const AddHabitScreen: React.FC<{ navigation: NavigationProp }> = ({ navigation }) => {
  const { colors = { background: "#1A1A2E", text: "#FFFFFF", accent: "#6A0DAD", inputBackground: "#2A2A3E", inputBorder: "#3A3A5C" } } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal_series, setGoalSeries] = useState("");
  const [completionsPerDay, setCompletionsPerDay] = useState(1);
  const [reminderDays, setReminderDays] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Book");
  const [newCategoryColor, setNewCategoryColor] = useState("#6A0DAD");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [habitIcon, setHabitIcon] = useState("Book");
  const [loading, setLoading] = useState(false);

  const goalOptions = ["Ежедневно", "Неделя", "Месяц"];
  const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const iconOptions = Object.keys(iconMap);
  const colorOptions = [
    "#FF6F61", "#6A0DAD", "#00C4B4", "#FFD54F", "#3F51B5", "#E91E63",
    "#4CAF50", "#F44336", "#2196F3", "#FF9800", "#9C27B0", "#03A9F4",
  ];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

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

const handleAddHabit = async () => {
    if (!name || !goal_series || reminderDays.length === 0) {
        Alert.alert("Ошибка", "Заполните обязательные поля: Название, Цель серий и Напоминания!");
        return;
    }

    setLoading(true);
    try {
        await addHabit(
            {
                name,
                description,
                frequency: { days: reminderDays.join(", "), time: reminderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                progress: 0,
                goal_series,
                icon: habitIcon,
                // Добавьте это новое поле
                target_completions: completionsPerDay, // <--- ВОТ ЧТО НУЖНО ДОБАВИТЬ
            },
            selectedCategories
        );
        navigation.goBack();
    } catch (error) {
        console.error("Error adding habit:", error); // Логируйте ошибку для отладки
        Alert.alert("Ошибка", "Не удалось добавить привычку");
    } finally {
        setLoading(false);
    }
};

  const toggleDay = (day: string) => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addNewCategory = async () => {
    if (!newCategoryName) {
      Alert.alert("Ошибка", "Введите название категории");
      return;
    }

    try {
      const newCategory = await addCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setNewCategoryIcon("Book");
      setNewCategoryColor("#6A0DAD");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось добавить категорию");
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Добавить привычку</Text>

        <Text style={styles.sectionHeader}>Название и описание</Text>
        <TextInput
          style={styles.input}
          placeholder="Название"
          placeholderTextColor="#A0A0C0"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Описание (необязательно)"
          placeholderTextColor="#A0A0C0"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.sectionHeader}>Иконка привычки</Text>
        <View style={styles.section}>
          <FlatList
            data={iconOptions}
            horizontal
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const LucideIcon = iconMap[item];
              return (
                <Animated.View style={habitIcon === item ? styles.selectedIcon : undefined}>
                  <TouchableOpacity onPress={() => setHabitIcon(item)} style={styles.iconButton}>
                    <LucideIcon size={28} color={habitIcon === item ? colors.accent : "#A0A0C0"} strokeWidth={2} />
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
            style={styles.iconList}
          />
        </View>

        <Text style={styles.sectionHeader}>Цель серий</Text>
        <View style={styles.rowContainer}>
          <TouchableOpacity style={[styles.optionButton, { flex: 1, marginRight: 8 }]} onPress={() => setShowGoalModal(true)}>
            <Text style={styles.optionText}>Цель серий: {goal_series || "Выберите"}</Text>
          </TouchableOpacity>
          <View style={[styles.optionButton, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.optionText}>Выполнений в день:</Text>
            <View style={styles.completionsContainer}>
              <TouchableOpacity 
                style={styles.completionButton} 
                onPress={() => setCompletionsPerDay(prev => Math.max(1, prev - 1))}
              >
                <Text style={styles.completionButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.completionText}>{completionsPerDay}</Text>
              <TouchableOpacity 
                style={styles.completionButton} 
                onPress={() => setCompletionsPerDay(prev => prev + 1)}
              >
                <Text style={styles.completionButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Modal visible={showGoalModal} transparent animationType="fade">
          <Animated.View style={[styles.modalOverlay, animatedStyle]}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Выберите цель серий</Text>
              {goalOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setGoalSeries(option);
                    setShowGoalModal(false);
                  }}
                  style={[styles.modalOption, goal_series === option && styles.selectedModalOption]}
                >
                  <Text style={[styles.modalText, goal_series === option && styles.selectedModalText]}>{option}</Text>
                </TouchableOpacity>
              ))}
              <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => setShowGoalModal(false)}>
                <View style={styles.modalButtonSecondary}>
                  <Text style={styles.modalButtonText}>Закрыть</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </Modal>

        <Text style={styles.sectionHeader}>Категории (необязательно)</Text>
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.optionText}>
            Категории: {selectedCategories.length > 0 ? selectedCategories.map((id) => categories.find((c) => c.id === id)?.name).join(", ") : "Выберите"}
          </Text>
        </TouchableOpacity>
        <Modal visible={showCategoryModal} transparent animationType="fade">
          <Animated.View style={[styles.modalOverlay, animatedStyle]}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Добавить категорию</Text>
              <TextInput
                style={styles.input}
                placeholder="Название категории"
                placeholderTextColor="#A0A0C0"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <Text style={styles.label}>Иконка категории:</Text>
              <FlatList
                data={iconOptions}
                horizontal
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const LucideIcon = iconMap[item];
                  return (
                    <Animated.View style={newCategoryIcon === item ? styles.selectedIcon : undefined}>
                      <TouchableOpacity onPress={() => setNewCategoryIcon(item)} style={styles.iconButton}>
                        <LucideIcon size={24} color={newCategoryIcon === item ? colors.accent : "#A0A0C0"} strokeWidth={2} />
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }}
                style={styles.iconList}
              />
              <Text style={styles.label}>Цвет категории:</Text>
              <FlatList
                data={colorOptions}
                horizontal
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setNewCategoryColor(item)} style={[styles.colorButton, { backgroundColor: item }]}>
                    {newCategoryColor === item && <Check size={16} color="#FFFFFF" strokeWidth={2} />}
                  </TouchableOpacity>
                )}
                style={styles.colorList}
              />
              <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={addNewCategory}>
                <View style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Добавить категорию</Text>
                </View>
              </Pressable>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const LucideIcon = iconMap[item.icon] || iconMap["Book"]; // Fallback на "Book", если иконка не найдена
                  return (
                    <TouchableOpacity
                      onPress={() => toggleCategory(item.id)}
                      style={[styles.categoryItem, selectedCategories.includes(item.id) && styles.selectedCategoryItem]}
                    >
                      <View style={[styles.categoryIndicator, { backgroundColor: selectedCategories.includes(item.id) ? "#FFFFFF" : item.color }]} />
                      <LucideIcon
                        size={18}
                        color={selectedCategories.includes(item.id) ? item.color : "#A0A0C0"}
                        strokeWidth={2}
                      />
                      <Text style={[styles.categoryText, selectedCategories.includes(item.id) && { color: item.color }]}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
              <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => setShowCategoryModal(false)}>
                <View style={styles.modalButtonSecondary}>
                  <Text style={styles.modalButtonText}>Закрыть</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </Modal>

        <Text style={styles.sectionHeader}>Напоминания</Text>
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowReminderModal(true)}>
          <Text style={styles.optionText}>
            Напоминания: {reminderDays.length > 0 ? `${reminderDays.join(", ")} в ${reminderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Выберите"}
          </Text>
        </TouchableOpacity>
        <Modal visible={showReminderModal} transparent animationType="fade">
          <Animated.View style={[styles.modalOverlay, animatedStyle]}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Выберите дни и время</Text>
              <FlatList
                data={daysOfWeek}
                horizontal
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Animated.View style={reminderDays.includes(item) ? styles.selectedDay : undefined}>
                    <TouchableOpacity onPress={() => toggleDay(item)} style={styles.dayButton}>
                      <Text style={[styles.dayText, { color: reminderDays.includes(item) ? colors.accent : "#A0A0C0" }]}>{item}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                contentContainerStyle={{ paddingHorizontal: 8 }}
              />
              <TouchableOpacity style={styles.optionButton} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.optionText}>Выберите время: {reminderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    display="spinner"
                    onChange={(event: any, selectedTime: Date | undefined) => {
                      setShowTimePicker(false);
                      if (selectedTime) setReminderTime(selectedTime);
                    }}
                    textColor="#FFFFFF"
                  />
                  <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.timePickerButton}>
                    <Text style={styles.timePickerButtonText}>Подтвердить</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => setShowReminderModal(false)}>
                <View style={styles.modalButtonSecondary}>
                  <Text style={styles.modalButtonText}>Закрыть</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </Modal>

        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleAddHabit} disabled={loading}>
          <View style={[styles.addButton, loading && { opacity: 0.7 }]}>
            <Text style={styles.addButtonText}>{loading ? "Добавление..." : "Добавить"}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
};

// Стили остаются без изменений
const styles = {
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#2A2A3E",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#3A3A5C",
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#A0A0C0",
    marginBottom: 8,
  },
  iconList: {
    paddingVertical: 4,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  optionButton: {
    backgroundColor: "#2A2A3E",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3A3A5C",
  },
  optionText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#2A2A3E",
    padding: 16,
    borderRadius: 12,
    width: "85%" as const,
    maxHeight: "80%" as const,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3A3A5C",
  },
  modalText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center" as const,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#6A0DAD",
    alignItems: "center" as const,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  dayButton: {
    padding: 8,
    margin: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dayText: {
    fontSize: 14,
    textAlign: "center" as const,
  },
  colorList: {
    marginVertical: 8,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  categoryItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#3A3A5C",
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#FFFFFF",
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#6A0DAD",
    alignItems: "center" as const,
    marginTop: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  selectedIcon: {
    borderWidth: 2,
    borderColor: "#FFD54F",
    borderRadius: 8,
  },
  selectedModalOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedModalText: {
    color: "#FFD54F",
  },
  modalButtonSecondary: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#6A0DAD",
    alignItems: "center" as const,
  },
  selectedCategoryItem: {
    display: "flex" as const,
    gap: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#3A3A5C",
  },
  selectedDay: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  timePickerContainer: {
    backgroundColor: "#2A2A3E",
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    alignItems: "center" as const,
  },
  timePickerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#6A0DAD",
    marginTop: 8,
  },
  timePickerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  rowContainer: {
    flexDirection: 'row' as const,
    marginBottom: 16,
  },
  completionsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  completionButton: {
    backgroundColor: '#6A0DAD',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  completionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600' as const,
  },
  completionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginHorizontal: 16,
  },
};

export default AddHabitScreen;
