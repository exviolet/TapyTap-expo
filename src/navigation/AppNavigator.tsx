// src/navigation/AppNavigator.tsx
import React, { useState, useEffect, useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HabitsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: "Привычки" }} />
      <Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ title: "Добавить привычку" }} />
      <Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ title: "Редактировать привычку" }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
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
          let iconName: string;
          if (route.name === "HabitsStack") iconName = "home";
          else if (route.name === "Calendar") iconName = "calendar-today";
          else if (route.name === "SettingsStack") iconName = "settings";
          else iconName = "help"; // Значение по умолчанию
          return <Icon name={iconName} size={size} color={color} />;
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

  return <NavigationContainer>{session && session.user ? <AppTabs /> : <AuthStack />}</NavigationContainer>;
}