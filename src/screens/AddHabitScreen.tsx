// src/screens/AddHabitScreen.tsx
import React, { useState, useContext } from "react";
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
import { addHabit } from "../lib/habits";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

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
  const [reminderDays, setReminderDays] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string; icon: string; color: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("category");
  const [newCategoryColor, setNewCategoryColor] = useState("#6A0DAD");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [habitIcon, setHabitIcon] = useState("book");
  const [loading, setLoading] = useState(false);

  const goalOptions = ["Ежедневно", "Неделя", "Месяц"];
  const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const iconOptions = ["book", "directions_run", "school", "work", "library_music", "fastfood"];
  const colorOptions = ["#FF6F61", "#6A0DAD", "#00C4B4", "#FFD54F", "#3F51B5", "#E91E63"];

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
    if (!name || !description || !goal_series || reminderDays.length === 0) {
      Alert.alert("Ошибка", "Заполните все обязательные поля!");
      return;
    }
  
    setLoading(true);
    try {
      await addHabit({
        name,
        description,
        category: selectedCategories.join(", "),
        frequency: { days: reminderDays.join(", "), time: reminderTime.toLocaleTimeString() },
        progress: 0,
        goal_series: goal_series,
        icon: habitIcon,
      });
      navigation.goBack();
    } catch (error) {
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

  const addCategory = () => {
    if (newCategoryName && newCategoryIcon && newCategoryColor) {
      const newCategory = { id: Date.now().toString(), name: newCategoryName, icon: newCategoryIcon, color: newCategoryColor };
      setCustomCategories([...customCategories, newCategory]);
      setNewCategoryName("");
      setNewCategoryIcon("category");
      setNewCategoryColor("#6A0DAD");
      setShowCategoryModal(false);
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
          placeholder="Описание"
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
            renderItem={({ item }) => (
              <Animated.View style={habitIcon === item ? styles.selectedIcon : undefined}>
                <TouchableOpacity onPress={() => setHabitIcon(item)} style={styles.iconButton}>
                  <Icon name={item} size={28} color={habitIcon === item ? colors.accent : "#A0A0C0"} />
                </TouchableOpacity>
              </Animated.View>
            )}
            style={styles.iconList}
          />
        </View>

        <Text style={styles.sectionHeader}>Цель серий</Text>
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowGoalModal(true)}>
          <Text style={styles.optionText}>Цель серий: {goal_series || "Выберите"}</Text>
        </TouchableOpacity>
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

        <Text style={styles.sectionHeader}>Категории</Text>
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.optionText}>
            Категории: {selectedCategories.length > 0 ? selectedCategories.map((id) => customCategories.find((c) => c.id === id)?.name).join(", ") : "Выберите"}
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
                renderItem={({ item }) => (
                  <Animated.View style={newCategoryIcon === item ? styles.selectedIcon : undefined}>
                    <TouchableOpacity onPress={() => setNewCategoryIcon(item)} style={styles.iconButton}>
                      <Icon name={item} size={24} color={newCategoryIcon === item ? colors.accent : "#A0A0C0"} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                style={styles.iconList}
              />
              <Text style={styles.label}>Цвет категории:</Text>
              <FlatList
                data={colorOptions}
                horizontal
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setNewCategoryColor(item)} style={[styles.colorButton, { backgroundColor: item }]}> 
                    {newCategoryColor === item && <Icon name="check" size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                )}
                style={styles.colorList}
              />
              <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={addCategory}>
                <View style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Добавить категорию</Text>
                </View>
              </Pressable>
              <FlatList
                data={customCategories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => toggleCategory(item.id)} style={[styles.categoryItem, selectedCategories.includes(item.id) && styles.selectedCategoryItem]}>
                    <View style={[styles.categoryIndicator, { backgroundColor: item.color }]} />
                    <Icon name={item.icon} size={18} color={selectedCategories.includes(item.id) ? colors.accent : "#A0A0C0"} />
                    <Text style={styles.categoryText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
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
            Напоминания: {reminderDays.length > 0 ? `${reminderDays.join(", ")} в ${reminderTime.toLocaleTimeString()}` : "Выберите"}
          </Text>
        </TouchableOpacity>
        <Modal visible={showReminderModal} transparent animationType="fade">
          <Animated.View style={[styles.modalOverlay, animatedStyle]}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Выберите дни и время</Text>
              <FlatList
                data={daysOfWeek}
                numColumns={4}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Animated.View style={reminderDays.includes(item) ? styles.selectedDay : undefined}>
                    <TouchableOpacity onPress={() => toggleDay(item)} style={styles.dayButton}>
                      <Text style={[styles.dayText, { color: reminderDays.includes(item) ? colors.accent : "#A0A0C0" }]}>{item}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              />
              <TouchableOpacity style={styles.optionButton} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.optionText}>Выберите время: {reminderTime.toLocaleTimeString()}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display="default"
                  onChange={(event: any, selectedTime: Date | undefined) => {
                    setShowTimePicker(false);
                    if (selectedTime) setReminderTime(selectedTime);
                  }}
                />
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
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#2A2A3E",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 18,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedDay: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
};

export default AddHabitScreen;