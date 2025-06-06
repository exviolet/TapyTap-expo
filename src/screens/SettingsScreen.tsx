// src/screens/SettingsScreen.tsx
import React from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { supabase } from "../supabase/supabaseClient";

export default function SettingsScreen() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Ошибка", error.message);
    } else {
      Alert.alert("Выход", "Вы успешно вышли из аккаунта.");
      // AppNavigator автоматически переключится на AuthStack
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Экран настроек</Text>
      <Button title="Выйти из аккаунта" onPress={handleLogout} color="#FF3B30" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
  },
});
