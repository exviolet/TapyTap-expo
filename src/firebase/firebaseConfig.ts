// src/firebase/firebaseConfig.ts
// import { getAuth } from 'firebase/auth'; // Убираем этот импорт, так как будем использовать initializeAuth
import { FirebaseApp } from 'firebase/app'; // Добавим тип для FirebaseApp

// Твои конфигурационные данные Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyB4-cje5nVNTVNNnNEDOoqZk0-oZB8iJII",
  authDomain: "habit-tracker-app-f3555.firebaseapp.com",
  projectId: "habit-tracker-app-f3555",
  storageBucket: "habit-tracker-app-f3555.firebasestorage.app",
  messagingSenderId: "944916855635",
  appId: "1:944916855635:web:f7c6cd2437e060da1effa6",
};

// Экспортируем переменную, которая будет хранить экземпляр auth
// Инициализируем ее как null, она будет заполнена в App.tsx
export let auth: any = null; // Помечаем как any, так как тип может быть специфичным для Firebase Auth
export function setFirebaseAuth(authInstance: any) {
  auth = authInstance;
}
