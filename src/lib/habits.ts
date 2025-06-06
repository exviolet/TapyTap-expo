// src/lib/habits.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase/supabaseClient";

const HABITS_KEY = "habits";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  frequency: { days: string; time: string };
  progress: number;
  created_at: string;
  updated_at: string;
  description?: string;
  goal_series?: string; // Убедитесь, что это поле есть
  icon: string;
}

// Получение привычек
export const fetchHabits = async (): Promise<Habit[]> => {
  try {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data) {
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(data));
      return data;
    }

    const localHabits = await AsyncStorage.getItem(HABITS_KEY);
    return localHabits ? JSON.parse(localHabits) : [];
  } catch (error) {
    console.error("Error fetching habits:", error);
    const localHabits = await AsyncStorage.getItem(HABITS_KEY);
    return localHabits ? JSON.parse(localHabits) : [];
  }
};

// Добавление новой привычки
export const addHabit = async (habit: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at">): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      name: habit.name,
      description: habit.description,
      category: habit.category,
      frequency: habit.frequency,
      progress: habit.progress,
      goal_series: habit.goal_series,
      icon: habit.icon,
    });

    if (error) throw error;

    const updatedHabits = await fetchHabits();
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
  } catch (error) {
    console.error("Error adding habit:", error);
    throw error;
  }
};

// Обновление привычки
export const updateHabit = async (id: string, updatedHabit: Partial<Habit>): Promise<void> => {
  try {
    const { error } = await supabase
      .from("habits")
      .update(updatedHabit)
      .eq("id", id);

    if (error) throw error;

    const updatedHabits = await fetchHabits();
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
  } catch (error) {
    console.error("Error updating habit:", error);
    throw error;
  }
};

// Удаление привычки
export const deleteHabit = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (error) throw error;

    const updatedHabits = await fetchHabits();
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
  } catch (error) {
    console.error("Error deleting habit:", error);
    throw error;
  }
};