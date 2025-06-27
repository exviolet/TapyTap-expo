// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import * as LucideIcons from 'lucide-react-native';
import { ThemeContext } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';

// Импорт всех экранов
import HabitsScreen from '../screens/HabitsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import EditHabitScreen from '../screens/EditHabitScreen';
import ArchivedHabitsScreen from '../screens/ArchivedHabitsScreen';
import SortCategoriesScreen from '../screens/SortCategoriesScreen';
import SortHabitsScreen from '../screens/SortHabitsScreen';
import HabitDetailScreen from '@/screens/HabitDetailScreen';
import JournalScreen from '../screens/JournalScreen';
import AddEditNoteScreen from '../screens/AddEditNoteScreen';
import { HabitNote } from '../store/useHabitStore'; // Импортируем тип HabitNote

// Определение типов параметров
export type RootStackParamList = {
  AppTabs: undefined;
  AddHabitModal: undefined;
  EditHabit: { habitId: string };
  Habits: undefined;
  SortCategories: undefined;
  SortHabits: undefined;
  Journal: undefined;
  AddEditNote: { note?: HabitNote; habitId?: string | null };
  Settings: undefined; // Добавляем отсутствующие маршруты
  ArchivedHabits: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Statistics: undefined;
  HabitDetailScreen: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

// Стеки для каждого раздела, чтобы обеспечить правильную навигацию
function HabitsStack() {
  const { colors } = useContext(ThemeContext)!;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Habits" component={HabitsScreen} />
      <Stack.Screen name="SortCategories" component={SortCategoriesScreen} />
      <Stack.Screen name="SortHabits" component={SortHabitsScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="AddEditNote" component={AddEditNoteScreen} />
    </Stack.Navigator>
  );
}

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

// НОВЫЙ СТЕК ДЛЯ СТАТИСТИКИ
function StatisticsStack() {
  const { colors } = useContext(ThemeContext)!;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="HabitDetailScreen" component={HabitDetailScreen} />
    </Stack.Navigator>
  );
}

// Главный Tab-навигатор с классическим дизайном
function AppTabs() {
  const { colors } = useContext(ThemeContext)!;
  const navigation = useNavigation<any>();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 10,
        },
        tabBarIconStyle: {
          marginTop: 10,
        }
      }}
    >
      <Tab.Screen name="MyHabits" component={HabitsStack} options={{
        title: 'Привычки',
        tabBarIcon: ({ color, size }) => (<LucideIcons.CheckSquare size={size} color={color} />),
      }}/>
      <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{
        title: 'Календарь',
        tabBarIcon: ({ color, size }) => (<LucideIcons.Calendar size={size} color={color} />),
      }}/>
      <Tab.Screen name="AddHabitTab" component={AddHabitScreen} options={{
        title: 'Добавить',
        tabBarIcon: ({ color, size }) => (
          <View style={[styles.addButton, { backgroundColor: colors.accent }]}>
            <LucideIcons.Plus size={30} color="#FFF" />
          </View>
        ),
        tabBarLabel: () => null,
      }}
      listeners={{
        tabPress: e => {
          e.preventDefault();
          navigation.navigate('AddHabitModal');
        }
      }}
      />
      <Tab.Screen name="StatisticsTab" component={StatisticsStack} options={{
        title: 'Статистика',
        tabBarIcon: ({ color, size }) => (<LucideIcons.BarChart3 size={size} color={color} />),
      }}/>
      <Tab.Screen name="SettingsTab" component={SettingsStack} options={{
        title: 'Настройки',
        tabBarIcon: ({ color, size }) => (<LucideIcons.Settings size={size} color={color} />),
      }}/>
    </Tab.Navigator>
  );
}

// Корневой навигатор, который управляет модальными окнами
function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen name="AddHabitModal" component={AddHabitScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ presentation: 'modal' }}/>
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useContext(ThemeContext)!;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.background || '#FFF' }}>
        <ActivityIndicator size="large" color={colors?.accent || '#000'} />
      </View>
    );
  }
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {user ? <RootNavigator /> : <AuthStack />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -25,
  }
});
