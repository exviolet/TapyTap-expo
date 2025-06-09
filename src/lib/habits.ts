// src/lib/habits.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase/supabaseClient";

const HABITS_KEY = "habits";
const CATEGORIES_KEY = "categories";

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
    order_index?: number;
}

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    frequency: string; // Используется для напоминаний (например, "10:00, 14:30")
    progress: number;
    created_at: string;
    updated_at: string;
    goal_series: number; // 1 (ежедневно), 7 (неделя), 30 (месяц)
    icon: string;
    categories: Category[]; // Список объектов Category
    target_completions: number;
    order_index?: number;
}

// --- ФУНКЦИИ ДЛЯ КАТЕГОРИЙ ---

export const updateCategoryOrder = async (categories: Category[]): Promise<void> => {
    try {
        const updatePromises = categories.map(async (category, index) => {
            const { error } = await supabase
                .from("categories")
                .update({ order_index: index })
                .eq("id", category.id);

            if (error) {
                console.error(`Error updating category ${category.id} order:`, error);
                throw error;
            }
        });

        await Promise.all(updatePromises);
        console.log("Category order updated successfully.");
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
        console.error("Error updating category order:", error);
        throw error;
    }
};

export const deleteCategory = async (id: string): Promise<void> => {
    try {
        // Удаляем связи привычек с этой категорией
        const { error: habitCategoryError } = await supabase
            .from("habit_categories")
            .delete()
            .eq("category_id", id);

        if (habitCategoryError) {
            console.error("Error deleting habit category links:", habitCategoryError);
        }

        // Удаляем саму категорию
        const { error: categoryError } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);

        if (categoryError) throw categoryError;

        // Обновляем кэш категорий
        const updatedCategories = await fetchCategories();
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

export const fetchCategories = async (): Promise<Category[]> => {
    try {
        const { data, error } = await supabase
            .from("categories")
            .select("id, name, color, icon, order_index, created_at, updated_at")
            .order("order_index", { ascending: true });

        if (error) {
            console.error("Error fetching categories from DB:", error);
            throw error;
        }

        const categories = (data || []).map(category => ({
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon,
            order_index: category.order_index,
            created_at: category.created_at,
            updated_at: category.updated_at,
        })) as Category[];
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        return categories;
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        const cachedCategories = await AsyncStorage.getItem(CATEGORIES_KEY);
        if (cachedCategories) {
            console.log("Returning cached categories.");
            return JSON.parse(cachedCategories);
        }
        return [];
    }
};

export const addCategory = async (category: Omit<Category, "id" | "created_at" | "updated_at" | "order_index">): Promise<Category> => {
    const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

    if (maxOrderError) throw maxOrderError;

    const nextOrderIndex = (maxOrderData && maxOrderData.length > 0 && maxOrderData[0].order_index !== null)
        ? maxOrderData[0].order_index + 1
        : 0;

    const { data, error } = await supabase
        .from("categories")
        .insert({
            name: category.name,
            icon: category.icon,
            color: category.color,
            order_index: nextOrderIndex,
        })
        .select()
        .single();

    if (error || !data) throw error || new Error("Failed to add category");

    const updatedCategories = await fetchCategories();
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));

    return data;
};

// --- ФУНКЦИИ ДЛЯ ПРИВЫЧЕК ---

export const fetchHabits = async (): Promise<Habit[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn("User not authenticated for fetching habits.");
            return [];
        }

        const { data: habits, error: habitError } = await supabase
            .from("habits")
            .select(`
                *,
                habit_categories (
                    category_id,
                    categories (
                        id,
                        name,
                        icon,
                        color,
                        created_at,
                        updated_at,
                        order_index
                    )
                )
            `)
            .eq("user_id", user.id)
            .order("order_index", { ascending: true })
            .order("created_at", { ascending: false });

        if (habitError) throw habitError;

        const transformedHabits = habits?.map((habit: any) => ({
            ...habit,
            categories: habit.habit_categories.map((hc: any) => hc.categories).filter(Boolean),
            target_completions: habit.target_completions === null ? 1 : Number(habit.target_completions),
            goal_series: habit.goal_series === null ? 1 : Number(habit.goal_series),
            progress: Number(habit.progress),
            frequency: habit.frequency || '', // Убедимся, что frequency всегда строка
        })) || [];

        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(transformedHabits));
        return transformedHabits;
    } catch (error) {
        console.error("Error fetching habits:", error);
        const localHabits = await AsyncStorage.getItem(HABITS_KEY);
        return localHabits ? JSON.parse(localHabits) : [];
    }
};

export const addHabit = async (
    habitData: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at" | "categories" | "order_index">,
    categoryIds: string[] = []
): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data: maxOrderData, error: maxOrderError } = await supabase
            .from('habits')
            .select('order_index')
            .eq("user_id", user.id)
            .order('order_index', { ascending: false })
            .limit(1);

        if (maxOrderError) throw maxOrderError;

        const nextOrderIndex = (maxOrderData && maxOrderData.length > 0 && maxOrderData[0].order_index !== null)
            ? maxOrderData[0].order_index + 1
            : 0;

        const { data: newHabit, error: habitError } = await supabase
            .from("habits")
            .insert({
                user_id: user.id,
                name: habitData.name,
                description: habitData.description,
                frequency: habitData.frequency,
                progress: habitData.progress,
                goal_series: habitData.goal_series,
                icon: habitData.icon,
                target_completions: habitData.target_completions,
                order_index: nextOrderIndex,
            })
            .select()
            .single();

        if (habitError || !newHabit) throw habitError;

        if (categoryIds.length > 0) {
            const relations = categoryIds.map((categoryId) => ({
                habit_id: newHabit.id,
                category_id: categoryId,
            }));
            const { error: relationError } = await supabase.from("habit_categories").insert(relations);
            if (relationError) throw relationError;
        }

        const updatedHabits = await fetchHabits();
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
    } catch (error) {
        console.error("Error adding habit:", error);
        throw error;
    }
};

export const updateHabit = async (id: string, updatedFields: Partial<Habit>, categoryIds?: string[]): Promise<void> => {
    try {
        const { error: habitError } = await supabase
            .from("habits")
            .update({
                name: updatedFields.name,
                description: updatedFields.description,
                frequency: updatedFields.frequency,
                progress: updatedFields.progress,
                goal_series: updatedFields.goal_series,
                icon: updatedFields.icon,
                target_completions: updatedFields.target_completions,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (habitError) throw habitError;

        if (categoryIds !== undefined) {
            // Удаляем все текущие связи, затем добавляем новые
            await supabase.from("habit_categories").delete().eq("habit_id", id);
            if (categoryIds.length > 0) {
                const relations = categoryIds.map((categoryId) => ({
                    habit_id: id,
                    category_id: categoryId,
                }));
                const { error: relationError } = await supabase.from("habit_categories").insert(relations);
                if (relationError) throw relationError;
            }
        }

        const updatedHabits = await fetchHabits();
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
    } catch (error) {
        console.error("Error updating habit:", error);
        throw error;
    }
};

export const deleteHabit = async (id: string): Promise<void> => {
    try {
        // Удаляем сначала связи привычки с категориями
        const { error: relationError } = await supabase
            .from("habit_categories")
            .delete()
            .eq("habit_id", id);
        if (relationError) {
            console.error("Error deleting habit categories relations:", relationError);
        }

        // Затем удаляем саму привычку
        const { error } = await supabase.from("habits").delete().eq("id", id);
        if (error) throw error;


        const updatedHabits = await fetchHabits();
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
    } catch (error) {
        console.error("Error deleting habit:", error);
        throw error;
    }
};

export const updateHabitOrder = async (habits: Habit[]): Promise<void> => {
    try {
        const updatePromises = habits.map(async (habit, index) => {
            const { error } = await supabase
                .from("habits")
                .update({ order_index: index })
                .eq("id", habit.id);

            if (error) {
                console.error(`Error updating habit ${habit.id} order:`, error);
                throw error;
            }
        });

        await Promise.all(updatePromises);
        console.log("Habit order updated successfully.");
        const updatedHabits = await fetchHabits();
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));

    } catch (error) {
        console.error("Error updating habit order in DB:", error);
        throw error;
    }
};
