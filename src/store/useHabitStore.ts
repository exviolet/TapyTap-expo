// src/store/useHabitStore.ts
import { create } from 'zustand';
import { supabase } from '../supabase/supabaseClient';
import { Habit, Category } from '../lib/habits'; // Убедитесь, что типы импортированы правильно
import { format } from 'date-fns';

export interface HabitCompletionRecord {
  id: string; habit_id: string; completion_date: string; completed_count: number;
  target_completions: number; user_id: string; created_at?: string; updated_at?: string;
}

interface HabitState {
  habits: Habit[];
  archivedHabits: Habit[]; // <-- НОВОЕ: для архива
  habitCompletions: HabitCompletionRecord[];
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  isLoadingHabits: boolean; // Отдельный флаг для привычек
  isLoadingCategories: boolean; // Отдельный флаг для категорий

  // Методы
  fetchHabits: (userId: string) => Promise<void>;
  fetchArchivedHabits: (userId: string) => Promise<void>; // <-- НОВОЕ
  fetchCategories: (userId: string) => Promise<void>;
  fetchHabitCompletions: (userId: string, startDate?: string, endDate?: string) => Promise<void>;
  updateHabitProgress: (habitId: string, newProgress: number, date: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;      // <-- НОВОЕ
  unarchiveHabit: (habitId: string) => Promise<void>;    // <-- НОВОЕ
  deleteHabitPermanently: (habitId: string) => Promise<void>; // <-- НОВОЕ
  deleteAllUserData: (userId: string) => Promise<void>;  // <-- НОВОЕ
  deleteCategory: (categoryId: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [], archivedHabits: [], habitCompletions: [], categories: [], isLoading: false, error: null,   isLoadingHabits: false,
  isLoadingCategories: false,

  fetchHabits: async (userId) => {
    set({ isLoadingHabits: true });
    try {
      const { data, error } = await supabase.from('habits')
        .select(`*, habit_categories(categories(*))`)
        .eq('user_id', userId)
        .eq('is_archived', false) // Загружаем только НЕ архивные
        .order('order_index', { ascending: true });
      if (error) throw error;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: completions } = await supabase.from('habit_completions').select('*').eq('user_id', userId).eq('completion_date', today);
      
      const habitsWithProgress = (data || []).map((h: any) => ({
        ...h,
        categories: h.habit_categories.map((hc: any) => hc.categories).flat().filter(Boolean),
        progress: completions?.find(c => c.habit_id === h.id)?.completed_count || 0,
      }));
      set({ habits: habitsWithProgress, isLoading: false });
    } catch (err: any) {
    set({ isLoadingHabits: false });
    }
  },

  fetchArchivedHabits: async (userId) => {
    set({ isLoading: true });
    try {
        const { data, error } = await supabase.from('habits')
            .select(`*, habit_categories(categories(*))`)
            .eq('user_id', userId)
            .eq('is_archived', true) // Загружаем только архивные
            .order('updated_at', { ascending: false });
        if(error) throw error;
        const archived = (data || []).map((h: any) => ({
            ...h,
            categories: h.habit_categories.map((hc: any) => hc.categories).flat().filter(Boolean),
        }));
        set({ archivedHabits: archived });
    } catch(err: any) {
        console.error("Error fetching archived habits", err);
    } finally {
        set({ isLoading: false });
    }
  },
  
  // Остальные fetch-функции без критических изменений...
  fetchCategories: async (userId: string) => {
    set({ isLoadingCategories: true }); // 1. Сообщаем, что загрузка НАЧАЛАСЬ
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('order_index', { ascending: true });

        if (error) {
            throw error;
        }

        const staticCategories: Category[] = [
            { id: 'All', name: 'Все', color: '#6A0DAD', icon: 'LayoutGrid', user_id: userId, created_at: '', updated_at: '' },
            { id: 'Uncategorized', name: 'Без категории', color: '#707070', icon: 'XSquare', user_id: userId, created_at: '', updated_at: '' }
        ];

        // 2. Обновляем состояние с полученными данными
        set({ categories: [...staticCategories, ...(data || [])] });

    } catch (err: any) {
        console.error("Error fetching categories:", err);
        set({ error: err });
    } finally {
        set({ isLoadingCategories: false }); // 3. Сообщаем, что загрузка ЗАВЕРШЕНА (в любом случае)
    }
  },
  fetchHabitCompletions: async (userId, startDate, endDate) => { /* ... */ },
  updateHabitProgress: async (habitId, newProgress, date) => { /* ... */ },
  deleteCategory: async (categoryId) => { /* ... */ },

  archiveHabit: async (habitId) => { /* ... */ },
  
  unarchiveHabit: async (habitId) => {
    const { error } = await supabase.from('habits').update({ is_archived: false }).eq('id', habitId);
    if(error) { console.error(error); return; }
    set(state => ({
        archivedHabits: state.archivedHabits.filter(h => h.id !== habitId)
    }));
  },

  deleteHabitPermanently: async (habitId) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if(error) { console.error(error); return; }
    set(state => ({
        archivedHabits: state.archivedHabits.filter(h => h.id !== habitId)
    }));
  },

  deleteAllUserData: async (userId) => {
    // Эта операция ОЧЕНЬ опасна. В реальном приложении лучше использовать Edge Function.
    console.log(`Deleting all data for user: ${userId}`);
    const { error: e1 } = await supabase.from('habit_completions').delete().eq('user_id', userId);
    const { error: e2 } = await supabase.from('habit_categories').delete().eq('user_id', userId);
    const { error: e3 } = await supabase.from('categories').delete().eq('user_id', userId);
    const { error: e4 } = await supabase.from('habits').delete().eq('user_id', userId);
    if(e1 || e2 || e3 || e4) console.error("Error deleting all data", {e1, e2, e3, e4});
    set({ habits: [], archivedHabits: [], categories: [], habitCompletions: [] });
  }
}));
