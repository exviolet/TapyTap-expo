// src/screens/LoginScreen.tsx
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
  navigation: StackNavigationProp<RootStackParamList, "Login">;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert("Ошибка входа", error.message);
    } catch (error: any) {
      Alert.alert("Ошибка входа", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Вход</Text>
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
      <Button title={loading ? "Вход..." : "Войти"} onPress={handleLogin} disabled={loading} color={colors.accent} />
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={[styles.registerText, { color: colors.accent }]}>У вас нет аккаунта? Зарегистрируйтесь</Text>
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
  registerText: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default LoginScreen;
