// src/store/useHabitStore.ts
import { create } from 'zustand';
import { supabase } from '../supabase/supabaseClient';
import { Habit, Category } from '../lib/habits';
import { format, subDays, differenceInCalendarDays  } from 'date-fns';

export interface HabitCompletionRecord {
  id?: string; habit_id: string; completion_date: string; completed_count: number;
  target_completions: number; user_id: string;
}

export interface HabitNote {
  id: string;
  user_id: string;
  habit_id: string;
  note_date: string; // 'YYYY-MM-DD'
  content: string;
  created_at: string;
  updated_at: string;
  habit?: Habit; // Для хранения связанной привычки
}

interface HabitState {
  habits: Habit[];
  archivedHabits: Habit[];
  habitCompletions: HabitCompletionRecord[];
  categories: Category[];
  isLoadingHabits: boolean;
  isLoadingCategories: boolean; 
  allCompletions: HabitCompletionRecord[]; // <-- НОВОЕ: для хранения всей истории
  streaks: Map<string, number>; // <-- Новое состояние для хранения стриков
  notes: HabitNote[]; // НОВОЕ СОСТОЯНИЕ ДЛЯ ЗАМЕТОК

  fetchHabits: (userId: string) => Promise<void>;
  fetchArchivedHabits: (userId: string) => Promise<void>;
  fetchCategories: (userId: string) => Promise<void>;
  fetchHabitCompletions: (userId: string, startDate?: string, endDate?: string) => Promise<void>; // <-- ВОТ ЭТА ФУНКЦИЯ
  updateHabitProgress: (habitId: string, newProgress: number, date: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  unarchiveHabit: (habitId: string) => Promise<void>;
  deleteHabitPermanently: (habitId: string) => Promise<void>;
  deleteAllUserData: (userId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  updateHabitOrder: (habits: Habit[]) => Promise<void>;
  calculateStreaks: (userId: string) => Promise<void>; // <-- Новая функция
  fetchAllCompletions: (userId: string) => Promise<void>; // <-- НОВАЯ ФУНКЦИЯ
  fetchAllNotes: (userId: string) => Promise<void>;
  fetchNotesForHabit: (habitId: string) => Promise<void>;
  addOrUpdateNote: (habitId: string, date: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [], archivedHabits: [], habitCompletions: [], categories: [],
  isLoadingHabits: false, isLoadingCategories: false, error: null, 
  streaks: new Map(),
  allCompletions: [],
  notes: [],

  fetchHabits: async (userId) => {
    set({ isLoadingHabits: true });
    try {
        const { data } = await supabase.from('habits').select(`*, habit_categories(categories(*))`).eq('user_id', userId).eq('is_archived', false).order('order_index');
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: completions } = await supabase.from('habit_completions').select('*').eq('user_id', userId).eq('completion_date', today);
        const habitsWithProgress = (data || []).map((h: any) => ({
        ...h,
        categories: h.habit_categories.map((hc: any) => hc.categories).flat().filter(Boolean),
        progress: completions?.find(c => c.habit_id === h.id)?.completed_count || 0,
        }));
        set({ habits: habitsWithProgress });
    } finally {
        set({ isLoadingHabits: false });
    }
  },

  // НОВАЯ ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ВСЕЙ ИСТОРИИ
  fetchAllCompletions: async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;

        set({ allCompletions: data || [] });

    } catch (err: any) {
        console.error("Error fetching all completions:", err);
    }
  },

  fetchArchivedHabits: async (userId) => {
    set({ isLoadingHabits: true });
    try {
        const { data } = await supabase.from('habits').select(`*, habit_categories(categories(*))`).eq('user_id', userId).eq('is_archived', true).order('updated_at', { ascending: false });
        const archived = (data || []).map((h: any) => ({ ...h, categories: h.habit_categories.map((hc: any) => hc.categories).flat().filter(Boolean) }));
        set({ archivedHabits: archived });
    } finally {
        set({ isLoadingHabits: false });
    }
  },

  fetchCategories: async (userId) => {
    set({ isLoadingCategories: true });
    try {
        const { data } = await supabase.from('categories').select('*').eq('user_id', userId).order('order_index');
        const staticCategories: Category[] = [
            { id: 'All', name: 'Все', color: '#6A0DAD', icon: 'LayoutGrid', user_id: userId, created_at: '', updated_at: '' },
            { id: 'Uncategorized', name: 'Без категории', color: '#707070', icon: 'XSquare', user_id: userId, created_at: '', updated_at: '' }
        ];
        set({ categories: [...staticCategories, ...(data || [])] });
    } finally {
        set({ isLoadingCategories: false });
    }
  },

  // ВОТ РЕАЛИЗАЦИЯ НЕДОСТАЮЩЕЙ ФУНКЦИИ
  fetchHabitCompletions: async (userId, startDate, endDate) => {
    try {
      let query = supabase.from('habit_completions').select('*').eq('user_id', userId);
      if (startDate) query = query.gte('completion_date', startDate);
      if (endDate) query = query.lte('completion_date', endDate);
      const { data, error } = await query;
      if (error) throw error;
      
      const existingCompletions = get().habitCompletions;
      const newCompletionsMap = new Map(existingCompletions.map(c => [`${c.habit_id}_${c.completion_date}`, c]));
      (data || []).forEach(c => newCompletionsMap.set(`${c.habit_id}_${c.completion_date}`, c));
      
      set({ habitCompletions: Array.from(newCompletionsMap.values()) });
    } catch (err: any) {
      console.error("Error fetching completions:", err);
    }
  },

    // НОВАЯ ФУНКЦИЯ ДЛЯ РАСЧЕТА СТРИКОВ
calculateStreaks: async (userId: string) => {
    const { data: completions } = await supabase
        .from('habit_completions')
        .select('habit_id, completion_date, completed_count')
        .eq('user_id', userId)
        .order('completion_date', { ascending: false });

    if (!completions) return;

    const habits = get().habits;
    const newStreaks = new Map<string, number>();

    for (const habit of habits) {
        const habitCompletions = completions
            .filter(c => c.habit_id === habit.id && c.completed_count >= habit.target_completions)
            .map(c => new Date(c.completion_date));
        
        if (habitCompletions.length === 0) {
            newStreaks.set(habit.id, 0);
            continue;
        }

        let currentStreak = 0;
        let today = new Date();
        let lastDate = habitCompletions[0];

        const diffFromToday = differenceInCalendarDays(today, lastDate);
        if (diffFromToday > 1) {
            newStreaks.set(habit.id, 0);
            continue;
        }

        currentStreak = 1;
        lastDate = habitCompletions[0];

        for (let i = 1; i < habitCompletions.length; i++) {
            const currentDate = habitCompletions[i];
            if (differenceInCalendarDays(lastDate, currentDate) === 1) {
                currentStreak++;
                lastDate = currentDate;
            } else {
                break;
            }
        }
        newStreaks.set(habit.id, currentStreak);
    }
    set((state) => ({ streaks: new Map(newStreaks) })); // Устанавливаем все значения сразу
},

  updateHabitProgress: async (habitId, newProgress, date) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return;
    set(state => ({
        habits: state.habits.map(h => h.id === habitId ? { ...h, progress: newProgress } : h)
    }));
    await supabase.from('habit_completions').upsert({
        habit_id: habitId, completion_date: date, user_id: habit.user_id,
        completed_count: newProgress, target_completions: habit.target_completions
    }, { onConflict: 'habit_id,completion_date,user_id' });

    // Обновляем не только текущие привычки, но и полную историю
    set(state => {
        const existingIndex = state.allCompletions.findIndex(c => c.habit_id === habitId && c.completion_date === date);
        const newCompletions = [...state.allCompletions];
        
        if(existingIndex > -1) {
            newCompletions[existingIndex] = { ...newCompletions[existingIndex], completed_count: newProgress };
        } else {
            const habit = state.habits.find(h => h.id === habitId);
            if(habit) {
                 newCompletions.push({ habit_id: habitId, completion_date: date, completed_count: newProgress, target_completions: habit.target_completions, user_id: habit.user_id });
            }
        }
        
        return {
            habits: state.habits.map(h => h.id === habitId ? { ...h, progress: newProgress } : h),
            allCompletions: newCompletions
        };
    });

  },

  archiveHabit: async (habitId) => {
    set(state => ({ habits: state.habits.filter(h => h.id !== habitId) }));
    await supabase.from('habits').update({ is_archived: true }).eq('id', habitId);
  },

  unarchiveHabit: async (habitId) => {
    set(state => ({ archivedHabits: state.archivedHabits.filter(h => h.id !== habitId) }));
    await supabase.from('habits').update({ is_archived: false }).eq('id', habitId);
    get().fetchHabits(get().habits[0]?.user_id);
  },

  deleteHabitPermanently: async (habitId) => {
    set(state => ({ archivedHabits: state.archivedHabits.filter(h => h.id !== habitId) }));
    await supabase.from('habits').delete().eq('id', habitId);
  },

  deleteCategory: async (categoryId) => {
    await supabase.from('habit_categories').delete().eq('category_id', categoryId);
    await supabase.from('categories').delete().eq('id', categoryId);
    set(state => ({ categories: state.categories.filter(c => c.id !== categoryId) }));
    get().fetchHabits(get().habits[0]?.user_id);
  },

  updateHabitOrder: async (habits) => {
    set({ habits });
    const updates = habits.map((habit, index) => supabase.from('habits').update({ order_index: index }).eq('id', habit.id));
    await Promise.all(updates);
  },
  
  deleteAllUserData: async (userId: string) => {
      console.log(`Deleting all data for user: ${userId}`);
      await supabase.from('habit_completions').delete().eq('user_id', userId);
      await supabase.from('habit_categories').delete().eq('user_id', userId);
      await supabase.from('categories').delete().eq('user_id', userId);
      await supabase.from('habits').delete().eq('user_id', userId);
      set({ habits: [], archivedHabits: [], categories: [], habitCompletions: [] });
  },

fetchAllNotes: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('habit_notes')
                .select(`
                    *,
                    habits (
                        id, user_id, name, icon,
                        habit_categories (
                            category_id,
                            categories (id, name, color, icon)
                        )
                    )
                `)
                .eq('user_id', userId)
                .order('note_date', { ascending: false });

            if (error) throw error;

            const notesWithHabits = (data || []).map(note => ({
                ...note,
                habit: {
                    ...note.habits,
                    categories: note.habits?.habit_categories?.map((hc: { categories: any; }) => hc.categories).filter(Boolean) || [],
                },
            }));

            set({ notes: notesWithHabits });
        } catch (err) {
            console.error('Error fetching all notes:', err);
        }
    },

  fetchNotesForHabit: async (habitId) => {
    try {
      const { data, error } = await supabase
        .from('habit_notes')
        .select('*')
        .eq('habit_id', habitId)
        .order('note_date', { ascending: false });

      if (error) throw error;
      set({ notes: data || [] });
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  },

  addOrUpdateNote: async (habitId, date, content) => {
    const { auth } = supabase;
    const { data: { user } } = await auth.getUser();
    if (!user) return;

    // Ищем заметку на эту дату прямо в базе данных для надежности
    const { data: existingNoteData } = await supabase
        .from('habit_notes')
        .select('id')
        .eq('habit_id', habitId)
        .eq('note_date', date)
        .single();

    if (existingNoteData) {
      // Обновляем существующую заметку
      const { data, error } = await supabase
        .from('habit_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', existingNoteData.id)
        .select()
        .single();
      
      if (error) throw error;
      set(state => ({
        notes: state.notes.map(n => n.id === existingNoteData.id ? data : n)
      }));
    } else {
      // Создаем новую заметку
      const { data, error } = await supabase
        .from('habit_notes')
        .insert({ habit_id: habitId, user_id: user.id, note_date: date, content })
        .select()
        .single();

      if (error) throw error;
      set(state => ({ notes: [...state.notes, data].sort((a,b) => b.note_date.localeCompare(a.note_date)) }));
    }
  },

  deleteNote: async (noteId) => {
    const { error } = await supabase
        .from('habit_notes')
        .delete()
        .eq('id', noteId);

    if (error) throw error;
    set(state => ({ notes: state.notes.filter(n => n.id !== noteId) }));
  },
}));
