// src/screens/RegistrationScreen.tsx
import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../supabase/supabaseClient";
import { ThemeContext } from "../components/ThemeProvider";

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "Register">;
};
const RegistrationScreen: React.FC<Props> = ({ navigation }) => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('RegistrationScreen must be used within a ThemeProvider');
  }
  const { colors } = context;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Ошибка", "Пароли не совпадают!");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert("Ошибка регистрации", error.message);
      else {
        Alert.alert("Регистрация успешна!", "Проверьте email для подтверждения.");
        navigation.navigate("Login");
      }
    } catch (error: any) {
      Alert.alert("Ошибка регистрации", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Регистрация</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Повторите пароль"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button title={loading ? "Регистрация..." : "Зарегистрироваться"} onPress={handleRegister} disabled={loading} color={colors.accent} />
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={[styles.loginText, { color: colors.accent }]}>Уже есть аккаунт? Войдите</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  loginText: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default RegistrationScreen;
