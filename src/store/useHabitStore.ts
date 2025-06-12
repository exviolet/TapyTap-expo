// src/store/useHabitStore.ts
import { create } from 'zustand';
import { supabase } from '../supabase/supabaseClient';
import { Habit, Category } from '../lib/habits'; // Убедитесь, что Habit и Category экспортируются из habits.ts

// Интерфейс для записи о ежедневном прогрессе
export interface HabitCompletionRecord { // <-- ИСПРАВЛЕНО: DailyProgressRecord на HabitCompletionRecord
    id: string;
    habit_id: string;
    completion_date: string; // 'YYYY-MM-DD' <-- ИСПРАВЛЕНО: date на completion_date
    completed_count: number; // <-- ИСПРАВЛЕНО: current_progress на completed_count
    target_completions: number;
    user_id: string;
    created_at?: string; // Добавил, так как оно есть в БД
    updated_at?: string; // Добавил, так как оно есть в БД
}

// Интерфейс для состояния хранилища
interface HabitStore {
    habits: Habit[];
    dailyRecords: HabitCompletionRecord[]; // <-- ИСПРАВЛЕНО: DailyProgressRecord[] на HabitCompletionRecord[]
    categories: Category[];
    isLoading: boolean;
    fetchHabits: (userId: string) => Promise<void>;
    fetchDailyRecords: (userId: string, startDate?: string, endDate?: string) => Promise<void>;
    fetchCategories: () => Promise<void>;
    // Обновляем signature updateHabitProgress, чтобы она соответствовала нашей логике с completion_date
    updateHabitProgress: (habitId: string, newProgress: number, targetCompletions: number, date: string) => Promise<void>; // <-- ДОБАВЛЕНА date
    // Дополнительные экшены, если понадобятся (например, для добавления/удаления привычек/категорий)
    addHabit: (habit: Habit) => void;
    deleteHabit: (habitId: string) => void;
    updateHabit: (habitId: string, updates: Partial<Habit>) => void;
    addCategory: (category: Category) => void;
    deleteCategory: (categoryId: string) => void;
    updateCategory: (categoryId: string, updates: Partial<Category>) => void;
}

// Создаем хранилище Zustand
export const useHabitStore = create<HabitStore>((set, get) => ({
    habits: [],
    dailyRecords: [],
    categories: [],
    isLoading: false,

    // --- Функции для загрузки данных ---

    fetchHabits: async (userId: string) => {
        set({ isLoading: true });
        // Убедимся, что здесь нет комментариев внутри select
        const { data, error } = await supabase
            .from('habits')
            .select(`
                id, user_id, name, description, frequency, progress, created_at, updated_at,
                goal_series, icon, target_completions, order_index,
                habit_categories (
                    category_id,
                    categories (
                        id, name, icon, color, created_at, updated_at, order_index
                    )
                )
            `)
            .eq('user_id', userId);

        if (error) {
            console.error("Error fetching habits:", error);
        } else {
            // Преобразование данных для Habit, если это необходимо (как в fetchHabits в lib/habits.ts)
            const transformedHabits = (data || []).map((habit: any) => ({
                ...habit,
                categories: habit.habit_categories ? habit.habit_categories.map((hc: any) => hc.categories).filter(Boolean) : [],
                target_completions: habit.target_completions === null ? 1 : Number(habit.target_completions),
                goal_series: habit.goal_series === null ? 1 : Number(habit.goal_series),
                progress: Number(habit.progress),
                frequency: habit.frequency || '',
            }));
            set({ habits: transformedHabits });
        }
        set({ isLoading: false });
    },

    fetchDailyRecords: async (userId: string, startDate?: string, endDate?: string) => {
        set({ isLoading: true });
        const query = supabase
            .from('habit_completions') // <-- ИСПРАВЛЕНО: daily_progress на habit_completions
            .select('*')
            .eq('user_id', userId);

        if (startDate) query.gte('completion_date', startDate); // <-- ИСПРАВЛЕНО: date на completion_date
        if (endDate) query.lte('completion_date', endDate);     // <-- ИСПРАВЛЕНО: date на completion_date

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching daily records:", error);
        } else {
            set({ dailyRecords: data || [] });
        }
        set({ isLoading: false });
    },

    fetchCategories: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('order_index', { ascending: true }); // Предполагаем, что есть order_index

        if (error) {
            console.error("Error fetching categories:", error);
        } else {
            const allAndNoCategory = [
                { id: "All", name: "Все", color: "#6A0DAD", icon: 'Star', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, // Добавил created_at/updated_at для согласованности
                { id: "Без категории", name: "Без категории", color: "#707070", icon: 'X', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ];
            set({ categories: [...allAndNoCategory, ...(data || [])] as Category[] });
        }
        set({ isLoading: false });
    },

    // --- Функции для обновления данных ---

    updateHabitProgress: async (habitId: string, newProgress: number, targetCompletions: number, date: string) => { // <-- ДОБАВЛЕНА date
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            console.error("Failed to get user session:", userError);
            return;
        }
        const userId = userData.user.id;
        // const today = new Date().toISOString().split('T')[0]; // Теперь используем переданную дату

        // 1. Обновляем habits.progress (это "сегодняшний" прогресс).
        // Возможно, эту часть нужно удалить или изменить логику,
        // если прогресс для главного экрана должен браться из dailyRecords за сегодня.
        // Оставляю пока, чтобы не ломать текущее поведение главного экрана.
        const { error: habitUpdateError } = await supabase
            .from('habits')
            .update({ progress: newProgress })
            .eq('id', habitId)
            .eq('user_id', userId);

        if (habitUpdateError) {
            console.error("Error updating habit progress in 'habits' table:", habitUpdateError);
            return;
        }

        // 2. Обновляем/создаем запись в habit_completions (история)
        const { data: existingRecord, error: fetchCompletionError } = await supabase
            .from('habit_completions') // <-- ИСПРАВЛЕНО: daily_progress на habit_completions
            .select('*')
            .eq('user_id', userId)
            .eq('habit_id', habitId)
            .eq('completion_date', date) // <-- ИСПРАВЛЕНО: date на completion_date
            .single();

        if (fetchCompletionError && fetchCompletionError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error("Error fetching habit completion record:", fetchCompletionError);
            return;
        }

        if (existingRecord) {
            // Обновляем существующую запись
            const { error: updateCompletionError } = await supabase
                .from('habit_completions') // <-- ИСПРАВЛЕНО: daily_progress на habit_completions
                .update({ completed_count: newProgress, updated_at: new Date().toISOString() }) // <-- ИСПРАВЛЕНО: current_progress на completed_count
                .eq('id', existingRecord.id);

            if (updateCompletionError) {
                console.error("Error updating habit completion record:", updateCompletionError);
            }
        } else {
            // Создаем новую запись
            const { error: insertCompletionError } = await supabase
                .from('habit_completions') // <-- ИСПРАВЛЕНО: daily_progress на habit_completions
                .insert({
                    user_id: userId,
                    habit_id: habitId,
                    completion_date: date, // <-- ИСПРАВЛЕНО: date на completion_date
                    completed_count: newProgress, // <-- ИСПРАВЛЕНО: current_progress на completed_count
                    target_completions: targetCompletions,
                });

            if (insertCompletionError) {
                console.error("Error inserting habit completion record:", insertCompletionError);
            }
        }

        // Обновляем состояние в Zustand
        set((state) => ({
            habits: state.habits.map(h =>
                h.id === habitId ? { ...h, progress: h.progress } : h // Прогресс здесь не обновляем, он будет взят из fetchDailyRecords
            ),
            dailyRecords: existingRecord
                ? state.dailyRecords.map(rec =>
                    rec.habit_id === habitId && rec.completion_date === date // <-- ИСПРАВЛЕНО: date на completion_date
                        ? { ...rec, completed_count: newProgress } // <-- ИСПРАВЛЕНО: current_progress на completed_count
                        : rec
                )
                : [...state.dailyRecords, { id: 'temp-id-' + Date.now(), user_id: userId, habit_id: habitId, completion_date: date, completed_count: newProgress, target_completions: targetCompletions, created_at: new Date().toISOString() }] // <-- ИСПРАВЛЕНО + добавил created_at
        }));
    },

    // --- Дополнительные функции для CRUD привычек и категорий через Zustand ---
    addHabit: (newHabit) => set((state) => ({ habits: [...state.habits, newHabit] })),
    deleteHabit: (habitId) => set((state) => ({ habits: state.habits.filter((h) => h.id !== habitId) })),
    updateHabit: (habitId, updates) =>
        set((state) => ({
            habits: state.habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)),
        })),
    addCategory: (newCategory) => set((state) => ({ categories: [...state.categories, newCategory] })),
    deleteCategory: (categoryId) =>
        set((state) => ({
            categories: state.categories.filter((c) => c.id !== categoryId),
            habits: state.habits.map(h => ({
                ...h,
                categories: h.categories?.filter(cat => cat.id !== categoryId) || []
            }))
        })),
    updateCategory: (categoryId, updates) =>
        set((state) => ({
            categories: state.categories.map((c) => (c.id === categoryId ? { ...c, ...updates } : c)),
        })),
}));
