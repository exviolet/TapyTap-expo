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
import SortHabitsScreen from "../screens/SortHabitsScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HabitsStack() {
    const { colors } = useContext(ThemeContext);
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: colors.background } // Используем cardStyle для фона
            }}
        >
            <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: "Привычки" }} />
            <Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="SortCategories" component={SortCategoriesScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="SortHabits" component={SortHabitsScreen} options={{ presentation: 'modal' }} />
        </Stack.Navigator>
    );
}

function SettingsStack() {
    const { colors } = useContext(ThemeContext);
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: colors.background } // Используем cardStyle для фона
            }}
        >
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Настройки" }} />
            <Stack.Screen name="ArchivedHabits" component={ArchivedHabitsScreen} options={{ title: "Архивные привычки" }} />
        </Stack.Navigator>
    );
}

function AppTabs() {
    const { colors } = useContext(ThemeContext);
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.tabBarBackground, // Фон нижней панели из темы
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                // Возвращаем стандартные active/inactive tint цвета для Tab.Navigator
                tabBarActiveTintColor: colors.tabBarActiveTint,
                tabBarInactiveTintColor: colors.tabBarInactiveTint,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let IconComponent;
                    if (route.name === 'HabitsStack') { // Используем HabitsStack, так как это имя Screen
                        IconComponent = LucideIcons.Home;
                    } else if (route.name === 'Calendar') {
                        IconComponent = LucideIcons.Calendar;
                    } else if (route.name === 'SettingsStack') { // Используем SettingsStack, так как это имя Screen
                        IconComponent = LucideIcons.Settings;
                    }
                    return IconComponent ? <IconComponent size={size} color={color} /> : null;
                },
            })}
        >
            <Tab.Screen
                name="HabitsStack"
                component={HabitsStack}
                options={{
                    title: "Привычки", // Используем title для отображения в таббаре
                }}
            />
            <Tab.Screen
                name="Calendar"
                component={CalendarScreen}
                options={{
                    title: "Календарь",
                }}
            />
            <Tab.Screen
                name="SettingsStack"
                component={SettingsStack}
                options={{
                    title: "Настройки",
                }}
            />
        </Tab.Navigator>
    );
}

function AuthStack() {
    const { colors } = useContext(ThemeContext);
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: colors.background } // Используем cardStyle для фона
            }}
        >
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

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                {session && session.user ? <AppTabs /> : <AuthStack />}
            </NavigationContainer>
        </GestureHandlerRootView>
    );
}
