// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import * as LucideIcons from 'lucide-react-native';
import { ThemeContext } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import HabitsScreen from '../screens/HabitsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import EditHabitScreen from '../screens/EditHabitScreen';
import ArchivedHabitsScreen from '../screens/ArchivedHabitsScreen';
import SortCategoriesScreen from '../screens/SortCategoriesScreen';
import SortHabitsScreen from '../screens/SortHabitsScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import { View, ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HabitsStack() {
    const { colors } = useContext(ThemeContext)!;
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="Habits" component={HabitsScreen} />
            <Stack.Screen name="AddHabit" component={AddHabitScreen} />
            <Stack.Screen name="EditHabit" component={EditHabitScreen} />
            <Stack.Screen name="SortCategories" component={SortCategoriesScreen} />
            <Stack.Screen name="SortHabits" component={SortHabitsScreen} />
        </Stack.Navigator>
    );
}

// НОВЫЙ СТЕК для Настроек и связанных экранов
function SettingsStack() {
    const { colors } = useContext(ThemeContext)!;
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ArchivedHabits" component={ArchivedHabitsScreen} />
        </Stack.Navigator>
    );
}

function AuthStack() {
    const { colors } = useContext(ThemeContext)!;
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegistrationScreen} />
        </Stack.Navigator>
    );
}

function AppTabs() {
    const { colors } = useContext(ThemeContext)!;
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.tabBarActiveTint,
                tabBarInactiveTintColor: colors.tabBarInactiveTint,
                tabBarStyle: { backgroundColor: colors.tabBarBackground, borderTopWidth: 0, height: 60, paddingBottom: 5 },
                tabBarIcon: ({ color, size }) => {
                    const icons: { [key: string]: React.ElementType } = {
                        MyHabits: LucideIcons.CheckSquare,
                        CalendarTab: LucideIcons.Calendar,
                        SettingsTab: LucideIcons.Settings,
                    };
                    const IconComponent = icons[route.name] || LucideIcons.HelpCircle;
                    return <IconComponent color={color} size={size} />;
                },
            })}
        >
            <Tab.Screen name="MyHabits" component={HabitsStack} options={{ title: 'Привычки' }}/>
            <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ title: 'Календарь' }}/>
            <Tab.Screen name="SettingsTab" component={SettingsStack} options={{ title: 'Настройки' }}/>
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useAuth();
    const { colors } = useContext(ThemeContext)!;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.background || '#FFFFFF' }}>
                <ActivityIndicator size="large" color={colors?.accent || '#000000'} />
            </View>
        );
    }
    return (
        <NavigationContainer>
            {user ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
    );
}
