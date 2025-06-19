// src/lib/habits.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase/supabaseClient";

const HABITS_KEY = "habits";
const CATEGORIES_KEY = "categories";
const HABIT_COMPLETIONS_KEY = "habit_completions";

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    order_index?: number;
}

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    frequency: any;
    progress: number;
    created_at: string;
    updated_at: string;
    goal_series: number;
    icon: string;
    categories: Category[];
    target_completions: number;
    is_archived: boolean;
    order_index?: number;
    type: 'checkoff' | 'quantitative'; // <-- НОВОЕ ПОЛЕ
    unit: string | null;              // <-- НОВОЕ ПОЛЕ
}

// Новый интерфейс для отметок о выполнении привычек
export interface HabitCompletion {
    id: string;
    habit_id: string;
    user_id: string;
    completion_date: string; // Формат 'YYYY-MM-DD'
    completed_count: number;
    created_at: string;
    updated_at: string;
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

export const addCategory = async (category: Omit<Category, "id" | "created_at" | "updated_at" | "order_index" | "user_id">): Promise<Category> => {
    // 1. Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated to add category");

    const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('categories')
        .select('order_index')
        .eq('user_id', user.id) // Учитываем пользователя при поиске последнего индекса
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
            user_id: user.id, // <-- ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ
            order_index: nextOrderIndex,
        })
        .select()
        .single();

    if (error || !data) throw error || new Error("Failed to add category");
    
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
                id, user_id, name, description, frequency, created_at, updated_at,
                goal_series, icon, target_completions, order_index,
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
            // progress: Number(habit.progress), // <--- УДАЛЯЕМ ЭТУ СТРОКУ
            frequency: habit.frequency || '',
        })) || [];

        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(transformedHabits));
        return transformedHabits;
    } catch (error) {
        console.error("Error fetching habits:", error);
        const localHabits = await AsyncStorage.getItem(HABITS_KEY);
        return localHabits ? JSON.parse(localHabits) : [];
    }
};

// ОБНОВЛЕННАЯ ФУНКЦИЯ ДОБАВЛЕНИЯ ПРИВЫЧКИ
export const addHabit = async (
    // Тип Omit теперь включает новые поля `type` и `unit`
    habitData: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at" | "categories" | "progress" | "order_index">,
    categoryIds: string[] = []
): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data: maxOrderData } = await supabase
            .from('habits')
            .select('order_index')
            .eq("user_id", user.id)
            .order('order_index', { ascending: false })
            .limit(1);

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
                goal_series: habitData.goal_series,
                icon: habitData.icon,
                target_completions: habitData.target_completions,
                is_archived: false,
                order_index: nextOrderIndex,
                type: habitData.type, // <-- ДОБАВЛЕНО
                unit: habitData.unit,   // <-- ДОБАВЛЕНО
            })
            .select()
            .single();
            
        if (habitError || !newHabit) throw habitError || new Error("Failed to create habit");

        if (categoryIds.length > 0) {
            const relations = categoryIds.map((categoryId) => ({
                habit_id: newHabit.id,
                category_id: categoryId,
            }));
            const { error: relationError } = await supabase.from("habit_categories").insert(relations);
            if (relationError) throw relationError;
        }

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
                // progress: updatedFields.progress, // <--- УДАЛЯЕМ ЭТУ СТРОКУ
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

        // Также удаляем все записи о выполнении этой привычки
        // <--- УБЕДИТЕСЬ, ЧТО У ВАС ЕСТЬ ОГРАНИЧЕНИЕ ON DELETE CASCADE В БАЗЕ ДАННЫХ
        // НА `habit_id` В ТАБЛИЦЕ `habit_completions`, ИНАЧЕ ЭТА СТРОКА НУЖНА.
        // Если ON DELETE CASCADE есть, то эта строка не нужна, но я оставлю ее для безопасности.
        const { error: completionsError } = await supabase
            .from("habit_completions")
            .delete()
            .eq("habit_id", id);
        if (completionsError) {
            console.error("Error deleting habit completions:", completionsError);
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



/**
 * Обновляет или создает запись о выполнении привычки на определенную дату.
 * @param habitId ID привычки.
 * @param date Строка даты в формате 'YYYY-MM-DD'.
 * @param count Количество выполнений.
 * @returns Обновленная или созданная запись HabitCompletion.
 */
export const updateCompletion = async (habitId: string, date: string, count: number): Promise<HabitCompletion> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Попытка обновить существующую запись
        const { data, error } = await supabase
            .from("habit_completions")
            .upsert(
                {
                    habit_id: habitId,
                    user_id: user.id,
                    completion_date: date,
                    completed_count: count,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'habit_id, completion_date, user_id' // Указываем поля для конфликта (уникальные поля)
                }
            )
            .select()
            .single();

        if (error || !data) throw error || new Error("Failed to update/create habit completion");

        console.log(`Habit ${habitId} completion updated to ${count} for date ${date}.`);
        return data as HabitCompletion;
    } catch (error) {
        console.error("Error updating habit completion:", error);
        throw error;
    }
};


// Функция для получения текущей даты в формате YYYY-MM-DD
export const getTodayDateString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};
