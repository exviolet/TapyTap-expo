// src/supabase/supabaseClient.ts
import 'react-native-url-polyfill/auto'; // Важно для React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://koukqwbiqarcgxrgyoyz.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWtxd2JpcWFyY2d4cmd5b3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTIyMDQsImV4cCI6MjA2NDU2ODIwNH0.T-1iJVvwaCvE02peFJzGTehyaHQwK35EMmlo_gAiA8M'; // anon public key из Supabase Project Settings -> API

// Supabase клиентін инициализациялау 
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Сеанстарды сақтау үшін AsyncStorage пайдаланыңыз
    autoRefreshToken: true, // Токенді автоматты жаңарту 
    persistSession: true, // Қолданбаны іске қосу арасындағы сеанс тұрақтылығы
    detectSessionInUrl: false, // Отключаем обнаружение сессии в URL (актуально для веба, но не для RN)
  },
});
