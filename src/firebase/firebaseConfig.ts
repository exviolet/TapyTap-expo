// src/firebase/firebaseConfig.ts
import { Auth } from 'firebase/auth'; // Импортируем тип Auth

export const firebaseConfig = {
  apiKey: "AIzaSyB4-cje5nVNTVNNnNEDOoqZk0-oZB8iJII",
  authDomain: "habit-tracker-app-f3555.firebaseapp.com",
  projectId: "habit-tracker-app-f3555",
  storageBucket: "habit-tracker-app-f3555.firebasestorage.app",
  messagingSenderId: "944916855635",
  appId: "1:944916855635:web:f7c6cd2437e060da1effa6",
};

export let auth: Auth | null = null; // Правильный тип и инициализация null

export function setFirebaseAuthInstance(authInstance: Auth) {
  auth = authInstance;
  // console.log("Firebase Auth instance set."); // Можно оставить для отладки
}
