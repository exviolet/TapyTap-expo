// src/navigation/AppNavigator.tsx
import React, { useState, useEffect, useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import * as LucideIcons from "lucide-react-native";
import { supabase } from "../supabase/supabaseClient";
import { ThemeContext } from "../components/ThemeProvider";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import HabitsScreen from "../screens/HabitsScreen";
import CalendarScreen from "../screens/CalendarScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddHabitScreen from "../screens/AddHabitScreen";
import EditHabitScreen from "../screens/EditHabitScreen";
import ArchivedHabitsScreen from "../screens/ArchivedHabitsScreen";
import SortCategoriesScreen from "../screens/SortCategoriesScreen"; 
import SortHabitsScreen from "../screens/SortHabitsScreen"; // ИМПОРТИРУЙТЕ НОВЫЙ ЭКРАН
import { GestureHandlerRootView } from "react-native-gesture-handler"; // ДОБАВЛЕН ИМПОРТ

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HabitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: "Привычки" }} />
      <Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SortCategories" component={SortCategoriesScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SortHabits" component={SortHabitsScreen} options={{ presentation: 'modal' }} /> 
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Настройки" }} />
      <Stack.Screen name="ArchivedHabits" component={ArchivedHabitsScreen} options={{ title: "Архивные привычки" }} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const { colors, theme } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        tabBarStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: theme === "light" ? "#666666" : "#CCCCCC",
        tabBarIcon: ({ color, size }) => {
          let IconComponent;
          if (route.name === "HabitsStack") IconComponent = LucideIcons["Home"];
          else if (route.name === "Calendar") IconComponent = LucideIcons["Calendar"];
          else if (route.name === "SettingsStack") IconComponent = LucideIcons["Settings"];
          else IconComponent = LucideIcons["HelpCircle"];
          return <IconComponent size={size} color={color} strokeWidth={2} />;
        },
      })}
    >
      <Tab.Screen name="HabitsStack" component={HabitsStack} options={{ tabBarLabel: "Привычки" }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: "Календарь" }} />
      <Tab.Screen name="SettingsStack" component={SettingsStack} options={{ tabBarLabel: "Настройки" }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegistrationScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => authListener.subscription?.unsubscribe();
  }, []);

  if (loading) return null;

  // Оборачиваем навигатор в GestureHandlerRootView
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {session && session.user ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
