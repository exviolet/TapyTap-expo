// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged, User } from 'firebase/auth';

// Импортируем инициализированный auth объект
import { auth } from '../firebase/firebaseConfig'; // Теперь импортируем auth напрямую

// Импортируем наши новые экраны аутентификации
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegistrationScreen from "../screens/RegistrationScreen";

// Импортируем существующие экраны приложения
import HabitsScreen from "../screens/HabitsScreen";
import CalendarScreen from "../screens/CalendarScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddHabitScreen from "../screens/AddHabitScreen";
import EditHabitScreen from "../screens/EditHabitScreen";
import ArchivedHabitsScreen from "../screens/ArchivedHabitsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Определяем тип пропсов для AppNavigator
// Больше не нужен firebaseApp в пропсах
type AppNavigatorProps = {}; 

// ... (Оставляем HabitsStack, SettingsStack, AppTabs без изменений) ...
function HabitsStack() { /* ... */ return (<Stack.Navigator><Stack.Screen name="Habits" component={HabitsScreen} options={{ title: "Привычки" }} /><Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ title: "Добавить привычку" }} /><Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ title: "Редактировать привычку" }} /></Stack.Navigator>); }
function SettingsStack() { /* ... */ return (<Stack.Navigator><Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Настройки" }} /><Stack.Screen name="ArchivedHabits" component={ArchivedHabitsScreen} options={{ title: "Архивные привычки" }} /></Stack.Navigator>); }
function AppTabs() { /* ... */ return (<Tab.Navigator screenOptions={{ headerShown: false }}><Tab.Screen name="HabitsStack" component={HabitsStack} options={{ tabBarLabel: "Привычки" }} /><Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: "Календарь" }} /><Tab.Screen name="SettingsStack" component={SettingsStack} options={{ tabBarLabel: "Настройки" }} /></Tab.Navigator>); }

// --- Стек для аутентификации (AuthStack) ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegistrationScreen} />
    </Stack.Navigator>
  );
}

// --- Главный навигатор приложения ---
const AppNavigator: React.FC<AppNavigatorProps> = () => { // Удаляем firebaseApp из пропсов
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Убедимся, что auth инициализирован. Он инициализируется в App.tsx
    if (!auth) { // Проверяем, инициализирован ли auth
      console.warn("Firebase Auth is not initialized yet in AppNavigator. Waiting...");
      // Можно добавить задержку или попробовать повторно
      // Если это происходит, значит App.tsx еще не закончил инициализацию.
      // Обычно, если App.tsx корректно ждет, эта ветка не должна срабатывать.
      setInitializing(false); // Для предотвращения бесконечного ожидания
      return;
    }

    // Слушаем изменения состояния аутентификации
    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    return subscriber; // Отписываемся от слушателя
  }, [initializing]); // Зависимость только от initializing

  if (initializing) {
    // Можно показывать загрузочный экран, пока проверяется состояние аутентификации
    return null; // Или <ActivityIndicator />
  }

  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default AppNavigator;
