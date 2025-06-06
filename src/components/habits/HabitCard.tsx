// src/components/habits/HabitCard.tsx
import React, { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ThemeContext } from "../../components/ThemeProvider";
import { Habit, updateHabit } from "../../lib/habits";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

type Props = {
  habit: Habit;
  onPress: () => void;
};

export default function HabitCard({ habit, onPress }: Props) {
  const { colors = { background: "#1A1A2E", text: "#FFFFFF", accent: "#6A0DAD", inputBackground: "#2A2A3E", inputBorder: "#3A3A5C" } } = useContext(ThemeContext);
  const localStyles = getStyles(colors);

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

  const incrementProgress = () => {
    updateHabit(habit.id, { progress: habit.progress + 1 });
  };

  const decrementProgress = () => {
    if (habit.progress > 0) updateHabit(habit.id, { progress: habit.progress - 1 });
  };

  return (
    <Animated.View style={[localStyles.card, animatedStyle]}>
      <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} activeOpacity={0.9}>
        <View style={localStyles.cardContent}>
          <View style={localStyles.iconContainer}>
            <View style={localStyles.iconBg}>
              <Icon name={habit.icon} size={28} color={colors.accent} />
            </View>
          </View>
          <View style={localStyles.content}>
            <Text style={localStyles.title}>{habit.name}</Text>
            <Text style={localStyles.subtitle}>Описание: {habit.description}</Text>
            <Text style={localStyles.subtitle}>Категория: {habit.category || "Без категории"}</Text>
            <Text style={localStyles.subtitle}>Частота: {habit.frequency.days} в {habit.frequency.time}</Text>
            <Text style={localStyles.subtitle}>Прогресс: {habit.progress}</Text>
            <View style={localStyles.buttonContainer}>
              <TouchableOpacity onPress={decrementProgress} style={localStyles.actionButton}>
                <Text style={localStyles.buttonText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={incrementProgress} style={localStyles.actionButton}>
                <Text style={localStyles.buttonText}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getStyles(colors: any) {
  return {
    card: {
      marginVertical: 12,
      marginHorizontal: 16,
      borderRadius: 16,
      backgroundColor: "#23233a",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    cardContent: {
      flexDirection: "row" as const,
      padding: 20,
      borderRadius: 16,
      alignItems: "center" as const,
    },
    iconContainer: {
      justifyContent: "center" as const,
      marginRight: 18,
    },
    iconBg: {
      backgroundColor: "#1A1A2E",
      borderRadius: 12,
      padding: 10,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: "#FFFFFF",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: "#A0A0C0",
      marginBottom: 2,
    },
    buttonContainer: {
      flexDirection: "row" as const,
      marginTop: 8,
      justifyContent: "flex-end" as const,
    },
    actionButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
      marginLeft: 8,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "500" as const,
    },
  };
}