// App.tsx (или index.ts) - ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ
import 'react-native-url-polyfill/auto';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext'; // Убедитесь, что используете ваш AuthProvider
import { ThemeProvider } from './src/components/ThemeProvider';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
