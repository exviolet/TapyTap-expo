// src/screens/RegistrationScreen.tsx
import React, { useState } from 'react'; // Вот здесь была ошибка!
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig'; // Импортируем инициализированный auth объект
import { StackNavigationProp } from '@react-navigation/stack';

// Определяем тип для параметров стека аутентификации
type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

type RegistrationScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Register'
>;

type Props = {
  navigation: RegistrationScreenNavigationProp;
};


const RegistrationScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают!');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password); // Используем auth напрямую
      console.log('Пользователь зарегистрирован!');
    } catch (error: any) {
      Alert.alert('Ошибка регистрации', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Повторите пароль"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button title="Зарегистрироваться" onPress={handleRegister} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Уже есть аккаунт? Войдите</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  loginText: {
    marginTop: 20,
    color: 'blue',
  },
});

export default RegistrationScreen;
