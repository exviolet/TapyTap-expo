// src/lib/habits.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase/supabaseClient";

const HABITS_KEY = "habits";

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
    order_index?: number; // Добавили order_index
}

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    frequency: { days: string; time: string };
    progress: number;
    created_at: string;
    updated_at: string;
    goal_series: string; // 'Ежедневно', 'Неделя', 'Месяц'
    icon: string;
    categories: Category[]; // Добавлено, если не было
    target_completions: number; // <--- ДОБАВЛЕНО: Целевое количество выполнений в день
    order_index?: number; // ДОБАВЛЕНО: Порядок сортировки привычек
}

// Новая функция для обновления порядка категорий
export const updateCategoryOrder = async (categories: Category[]): Promise<void> => {
    try {
        // Создаем массив промисов, каждый из которых - это операция обновления для одной категории
        const updatePromises = categories.map(async (category, index) => {
            const { error } = await supabase
                .from("categories")
                .update({ order_index: index }) // Обновляем только order_index
                .eq("id", category.id); // Для конкретной категории по ID

            if (error) {
                console.error(`Error updating category ${category.id} order:`, error);
                throw error; // Бросаем ошибку, чтобы Promise.all поймал её
            }
        });

        // Ждем выполнения всех промисов (обновлений)
        await Promise.all(updatePromises);

        console.log("Category order updated successfully.");
        // После успешного обновления, обновите локальный кэш
        const updatedCategories = await fetchCategories();
        await AsyncStorage.setItem("categories", JSON.stringify(updatedCategories)); // Предполагаем, что у вас есть кэш для категорий
    } catch (error) {
        console.error("Error updating category order:", error);
        throw error;
    }
};

// Удаление категории
export const deleteCategory = async (id: string): Promise<void> => {
    try {
        // Сначала удаляем все связи привычек с этой категорией
        const { error: habitCategoryError } = await supabase
            .from("habit_categories")
            .delete()
            .eq("category_id", id);

        if (habitCategoryError) {
            console.error("Error deleting habit category links:", habitCategoryError);
            // Если возникла ошибка при удалении связей, можно бросить её или просто залогировать
            // В данном случае, мы хотим, чтобы категория удалилась, даже если связи не удалились
            // Поэтому просто логируем и продолжаем
        }

        const { error: categoryError } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);

        if (categoryError) throw categoryError;

        // Обновляем локальный кэш категорий после удаления
        const updatedCategories = await fetchCategories();
        // ВАЖНО: Если вы кэшируете привычки с категориями, вам также может понадобиться
        // переполучить привычки, чтобы обновить их категории.
        // await fetchHabits(); // Раскомментируйте, если привычки сильно зависят от кэша категорий
        await AsyncStorage.setItem("categories", JSON.stringify(updatedCategories)); // Предполагаем, что у вас есть кэш для категорий
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

// ОБНОВЛЕНИЕ: Измените fetchCategories, чтобы он сортировал по order_index
export const fetchCategories = async (): Promise<Category[]> => {
    try {
        const { data, error } = await supabase
            .from("categories")
            .select("id, name, color, icon, order_index") // Убедитесь, что выбираете order_index
            .order("order_index", { ascending: true }); // Сортируем по order_index

        if (error) {
            console.error("Error fetching categories from DB:", error);
            throw error;
        }

        const categories = (data || []).map(category => ({
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon,
            order_index: category.order_index
        })) as Category[];
        await AsyncStorage.setItem("categories", JSON.stringify(categories));
        return categories;
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        const cachedCategories = await AsyncStorage.getItem("categories");
        if (cachedCategories) {
            console.log("Returning cached categories.");
            return JSON.parse(cachedCategories);
        }
        return [];
    }
};

// Получение привычек с категориями
export const fetchHabits = async (): Promise<Habit[]> => {
    try {
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
                        updated_at
                    )
                )
            `)
            .eq("user_id", (await supabase.auth.getSession()).data.session?.user.id)
            .order("order_index", { ascending: true }) // ДОБАВЛЕНО: Сортируем по order_index
            .order("created_at", { ascending: false }); // Дополнительная сортировка, если order_index одинаковый

        if (habitError) throw habitError;

        // Преобразуем данные, чтобы категории были в поле categories
        const transformedHabits = habits?.map((habit: any) => ({
            ...habit,
            categories: habit.habit_categories.map((hc: any) => hc.categories).filter(Boolean),
            // Убеждаемся, что target_completions всегда является числом, по умолчанию 1
            target_completions: habit.target_completions === null ? 1 : Number(habit.target_completions),
        })) || [];

        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(transformedHabits));
        return transformedHabits;
    } catch (error) {
        console.error("Error fetching habits:", error);
        const localHabits = await AsyncStorage.getItem(HABITS_KEY);
        // Возвращаем пустой массив, если локальные привычки не найдены
        return localHabits ? JSON.parse(localHabits) : [];
    }
};

// Добавление новой привычки с категориями
export const addHabit = async (
    habit: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at" | "categories" | "order_index">, // Исключаем order_index
    categoryIds: string[] = []
): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Получаем максимальный order_index для текущего пользователя, чтобы новая привычка была в конце
        const { data: maxOrderData, error: maxOrderError } = await supabase
            .from('habits')
            .select('order_index')
            .eq("user_id", user.id) // Убедитесь, что запрос учитывает пользователя
            .order('order_index', { ascending: false })
            .limit(1);

        if (maxOrderError) throw maxOrderError;

        const nextOrderIndex = (maxOrderData && maxOrderData.length > 0 && maxOrderData[0].order_index !== null)
            ? maxOrderData[0].order_index + 1
            : 0; // Начинаем с 0, если привычек нет или order_index null

        const { data: newHabit, error: habitError } = await supabase
            .from("habits")
            .insert({
                user_id: user.id,
                name: habit.name,
                description: habit.description,
                frequency: habit.frequency,
                progress: habit.progress,
                goal_series: habit.goal_series,
                icon: habit.icon,
                target_completions: habit.target_completions,
                order_index: nextOrderIndex, // Присваиваем order_index
            })
            .select()
            .single();

        if (habitError || !newHabit) throw habitError;

        // Добавляем связи с категориями
        if (categoryIds.length > 0) {
            const relations = categoryIds.map((categoryId) => ({
                habit_id: newHabit.id,
                category_id: categoryId,
            }));
            const { error: relationError } = await supabase.from("habit_categories").insert(relations);
            if (relationError) throw relationError;
        }

        // Обновляем локальный кэш после добавления
        const updatedHabits = await fetchHabits();
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
    } catch (error) {
        console.error("Error adding habit:", error);
        throw error;
    }
};

// Обновление привычки
export const updateHabit = async (id: string, updatedHabit: Partial<Habit>, categoryIds?: string[]): Promise<void> => {
    try {
        const { error: habitError } = await supabase
            .from("habits")
            .update({
                name: updatedHabit.name,
                description: updatedHabit.description,
                frequency: updatedHabit.frequency,
                progress: updatedHabit.progress,
                goal_series: updatedHabit.goal_series,
                icon: updatedHabit.icon,
                target_completions: updatedHabit.target_completions,
                updated_at: new Date().toISOString(),
                // order_index не обновляем здесь, так как для этого есть отдельная функция
            })
            .eq("id", id);

        if (habitError) throw habitError;

        // Обновляем связи с категориями, если они переданы
        if (categoryIds !== undefined) { // Проверяем, что categoryIds был передан
            // Удаляем старые связи
            await supabase.from("habit_categories").delete().eq("habit_id", id);
            // Добавляем новые связи
            if (categoryIds.length > 0) {
                const relations = categoryIds.map((categoryId) => ({
                    habit_id: id,
                    category_id: categoryId,
                }));
                const { error: relationError } = await supabase.from("habit_categories").insert(relations);
                if (relationError) throw relationError;
            }
        }

        // Обновляем локальный кэш после обновления
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

        // Также удаляем связанные записи из habit_categories
        const { error: relationError } = await supabase
            .from("habit_categories")
            .delete()
            .eq("habit_id", id);
        if (relationError) {
            console.error("Error deleting habit categories relations:", relationError);
            // Можно проигнорировать эту ошибку, если привычка все равно удалилась
        }

        const updatedHabits = await fetchHabits();
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
    } catch (error) {
        console.error("Error deleting habit:", error);
        throw error;
    }
};

// Добавление новой категории
export const addCategory = async (category: Omit<Category, "id" | "created_at" | "updated_at" | "order_index">): Promise<Category> => {
    // Получаем максимальный order_index для категорий, чтобы новая категория была в конце
    const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

    if (maxOrderError) throw maxOrderError;

    const nextOrderIndex = (maxOrderData && maxOrderData.length > 0 && maxOrderData[0].order_index !== null)
        ? maxOrderData[0].order_index + 1
        : 0; // Начинаем с 0, если категорий нет или order_index null


    const { data, error } = await supabase
        .from("categories")
        .insert({
            name: category.name,
            icon: category.icon,
            color: category.color,
            order_index: nextOrderIndex, // Присваиваем order_index
        })
        .select()
        .single();

    if (error || !data) throw error || new Error("Failed to add category");

    // После добавления новой категории, обновите локальный кэш категорий
    const updatedCategories = await fetchCategories();
    await AsyncStorage.setItem("categories", JSON.stringify(updatedCategories));

    return data;
};


// НОВАЯ ФУНКЦИЯ: Обновление порядка привычек
export const updateHabitOrder = async (habits: Habit[]): Promise<void> => {
    try {
        const updatePromises = habits.map(async (habit, index) => {
            const { error } = await supabase
                .from("habits")
                .update({ order_index: index }) // Обновляем только order_index
                .eq("id", habit.id); // Для конкретной привычки по ID

            if (error) {
                console.error(`Error updating habit ${habit.id} order:`, error);
                throw error;
            }
        });

        await Promise.all(updatePromises);

        console.log("Habit order updated successfully.");
        // После успешного обновления, обновите локальный кэш привычек
        const updatedHabits = await fetchHabits();
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));

    } catch (error) {
        console.error("Error updating habit order in DB:", error);
        throw error;
    }
};
