// src/types.ts
// Общие доменные типы. 'All' и 'Uncategorized' в списке категорий — синтетические
// клиентские записи (их добавляет useHabitStore.fetchCategories), в БД их нет.

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
    frequency: any; // jsonb, сейчас { reminders: [...] }
    progress: number; // выполнение за сегодня, подмешивается из habit_completions
    created_at: string;
    updated_at: string;
    goal_series: number;
    icon: string;
    categories: Category[];
    target_completions: number;
    is_archived: boolean;
    order_index?: number;
    type: 'checkoff' | 'quantitative';
    unit: string | null;
}

// Поля привычки, которые задаёт пользователь в форме добавления/редактирования
export type HabitInput = Pick<
    Habit,
    'name' | 'description' | 'frequency' | 'goal_series' | 'icon' | 'target_completions' | 'type' | 'unit'
>;

export type CategoryInput = Pick<Category, 'name' | 'icon' | 'color'>;
