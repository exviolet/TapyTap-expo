// src/screens/HabitsScreen.tsx
import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ThemeContext } from "../components/ThemeProvider";
import { Habit, fetchHabits } from "../lib/habits";
import HabitCard from "../components/habits/HabitCard";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn, FadeOut } from "react-native-reanimated";

type RootStackParamList = {
  Habits: undefined;
  AddHabit: undefined;
  EditHabit: { habit: Habit };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "Habits">;

export default function HabitsScreen() {
  const { colors = { background: "#1A1A2E", text: "#FFFFFF", accent: "#6A0DAD", inputBackground: "#2A2A3E", inputBorder: "#3A3A5C" } } = useContext(ThemeContext);
  const navigation = useNavigation<NavigationProp>();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Без категории');
  const [categoryList, setCategoryList] = useState<string[]>([]);

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

  useFocusEffect(
    React.useCallback(() => {
      const loadHabits = async () => {
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);
        // Extract unique categories from habits
        const categories = Array.from(new Set(fetchedHabits.flatMap(h => (h.category ? h.category.split(',').map(c => c.trim()) : []))));
        setCategoryList(categories);
        // Default filter: 'Без категории'
        setSelectedCategory('Без категории');
      };
      loadHabits();
    }, [])
  );

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredHabits(habits);
    } else if (selectedCategory === 'Без категории') {
      setFilteredHabits(habits.filter(habit => !habit.category || habit.category.trim() === ''));
    } else {
      setFilteredHabits(habits.filter(habit => habit.category && habit.category.split(',').map(c => c.trim()).includes(selectedCategory)));
    }
  }, [selectedCategory, habits]);

  const renderCategory = (name: string) => (
    <TouchableOpacity key={name} onPress={() => setSelectedCategory(name)}>
      <Animated.View style={[styles.categoryButton, selectedCategory === name && styles.selectedCategory]}
        entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
        <Text style={styles.categoryText}>{name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Habit }) => (
    <HabitCard habit={item} onPress={() => navigation.navigate("EditHabit", { habit: item })} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мои привычки</Text>
      <View style={styles.categoryFilterBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {renderCategory('All')}
          {renderCategory('Без категории')}
          {categoryList.map(cat => renderCategory(cat))}
        </View>
      </View>
      {filteredHabits.length === 0 ? (
        <Text style={styles.emptyText}>У вас пока нет привычек.</Text>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <FlatList
            data={filteredHabits}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.habitList}
          />
        </Animated.View>
      )}
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => navigation.navigate("AddHabit")}
        >
          <View style={styles.addButton}>
            <Text style={styles.addButtonText}>Добавить привычку</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    marginBottom: 16,
  },
  categoryFilterBar: {
    paddingHorizontal: 8,
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: "#23233a",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryList: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategory: {
    borderWidth: 2,
    borderColor: "#FFD54F",
    backgroundColor: "rgba(255, 213, 79, 0.15)",
  },
  categoryText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  habitList: {
    paddingBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#A0A0C0",
    textAlign: "center" as const,
    marginTop: 40,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#6A0DAD",
    alignItems: "center" as const,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
};