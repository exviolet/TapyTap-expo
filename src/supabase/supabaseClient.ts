// src/supabase/supabaseClient.ts
import 'react-native-url-polyfill/auto'; // Важно для React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ** ВСТАВЬ СЮДА СВОИ КЛЮЧИ Supabase **
const supabaseUrl = 'https://koukqwbiqarcgxrgyoyz.supabase.co'; // URL из Supabase Project Settings -> API
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWtxd2JpcWFyY2d4cmd5b3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTIyMDQsImV4cCI6MjA2NDU2ODIwNH0.T-1iJVvwaCvE02peFJzGTehyaHQwK35EMmlo_gAiA8M'; // anon public key из Supabase Project Settings -> API

// Инициализируем Supabase клиент
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Используем AsyncStorage для сохранения сессий
    autoRefreshToken: true, // Автоматическое обновление токенов
    persistSession: true, // Сохранение сессии между запусками приложения
    detectSessionInUrl: false, // Отключаем обнаружение сессии в URL (актуально для веба, но не для RN)
  },
});