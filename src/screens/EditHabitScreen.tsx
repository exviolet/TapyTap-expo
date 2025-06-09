// src/screens/EditHabitScreen.tsx
import React, { useContext } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ThemeContext } from "../components/ThemeProvider";
import { Habit, updateHabit } from "../lib/habits";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { Book, Check } from "lucide-react-native";

type RootStackParamList = {
  Habits: undefined;
  EditHabit: { habit: Habit };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "EditHabit">;
type RouteProps = RouteProp<RootStackParamList, "EditHabit">;

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Book,
  Activity: () => null,
  GraduationCap: () => null,
  Briefcase: () => null,
  Music: () => null,
  Coffee: () => null,
  Sun: () => null,
  Moon: () => null,
  Star: () => null,
  Heart: () => null,
};

export default function EditHabitScreen() {
  const { colors = { background: "#1A1A2E", text: "#FFFFFF", accent: "#6A0DAD" } } = useContext(ThemeContext);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { habit } = route.params;
  const goalSeries = parseInt(habit.goal_series || "1");

  const progressWidth = useSharedValue((habit.progress / goalSeries) * 100);
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

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

  const updateProgress = async (newProgress: number) => {
    try {
      await updateHabit(habit.id, { progress: newProgress });
      progressWidth.value = withTiming((newProgress / goalSeries) * 100, {
        duration: 300,
      });
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось обновить прогресс");
    }
  };

  const handleDecrement = () => {
    const newProgress = Math.max(0, habit.progress - 1);
    updateProgress(newProgress);
  };

  const handleIncrement = () => {
    const newProgress = habit.progress + 1;
    updateProgress(newProgress);
  };

  const handleComplete = () => {
    updateProgress(goalSeries);
  };

  const LucideIcon = iconMap[habit.icon || "Book"];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <LucideIcon size={32} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
        <Text style={styles.title}>{habit.name}</Text>
        {habit.description && (
          <Text style={styles.description}>{habit.description}</Text>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {habit.progress} / {goalSeries}
          </Text>
        </View>
        <View style={styles.progressButtons}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleDecrement}
            style={[styles.progressButton, animatedStyle]}
          >
            <Text style={styles.progressButtonText}>-1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleIncrement}
            style={[styles.progressButton, animatedStyle]}
          >
            <Text style={styles.progressButtonText}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleComplete}
            style={[styles.completeButton, animatedStyle]}
          >
            <Check size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.completeButtonText}>Выполнено</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: "center" as const,
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBg: {
    backgroundColor: "#23233a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#6A0DAD",
  },
  title: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#A0A0C0",
    textAlign: "center" as const,
  },
  progressSection: {
    backgroundColor: "#23233a",
    borderRadius: 16,
    padding: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%" as const,
    backgroundColor: "#6A0DAD",
    borderRadius: 3,
  },
  progressInfo: {
    marginTop: 8,
    alignItems: "center" as const,
  },
  progressText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500" as const,
  },
  progressButtons: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    marginTop: 16,
    gap: 12,
  },
  progressButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#6A0DAD",
    minWidth: 60,
    alignItems: "center" as const,
  },
  progressButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  completeButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    gap: 8,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
};
