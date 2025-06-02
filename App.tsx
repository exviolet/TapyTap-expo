// App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

// Импортируем initializeApp из 'firebase/app'
import { initializeApp, FirebaseApp } from 'firebase/app';
// Импортируем initializeAuth и getReactNativePersistence из 'firebase/auth'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// Импортируем AsyncStorage
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Импортируем только конфиг и нашу функцию-сеттер для auth
import { firebaseConfig, setFirebaseAuth } from './src/firebase/firebaseConfig';

// Переменные для хранения инициализированных Firebase App и Auth
let firebaseAppInstance: FirebaseApp | null = null;

export default function App() {
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);

  useEffect(() => {
    async function initializeFirebase() {
      if (!firebaseAppInstance) {
        try {
          // 1. Инициализируем Firebase App
          firebaseAppInstance = initializeApp(firebaseConfig);
          console.log("Firebase App initialized successfully.");

          // 2. Инициализируем Firebase Auth с персистентностью
          const authInstance = initializeAuth(firebaseAppInstance, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
          });
          setFirebaseAuth(authInstance); // Сохраняем экземпляр auth через наш сеттер
          console.log("Firebase Auth initialized with persistence.");

        } catch (error) {
          console.error("Error initializing Firebase:", error);
          // Можно добавить Alert.alert для пользователя
        }
      }
      setIsFirebaseInitialized(true); // Устанавливаем флаг после попытки инициализации
    }

    initializeFirebase();
  }, []);

  if (!isFirebaseInitialized) {
    // Показываем индикатор загрузки, пока Firebase не инициализируется
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Инициализация приложения...</Text>
      </View>
    );
  }

  // Передаем null, так как AppNavigator теперь будет получать auth из файла config.
  // Это упрощает AppNavigator.
  return (
    <>
      <AppNavigator firebaseApp={null} /> 
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
