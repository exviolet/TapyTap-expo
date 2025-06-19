// src/screens/SettingsScreen.tsx
import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { useHabitStore } from '../store/useHabitStore';
import * as LucideIcons from 'lucide-react-native';

// Определяем типы для навигации
type SettingsStackParamList = {
    Settings: undefined;
    ArchivedHabits: undefined;
};
type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'Settings'>;

// Компонент для заголовка секции
const SectionHeader = ({ title }: { title: string }) => {
    const { colors } = useContext(ThemeContext)!;
    return <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>;
};

// Компонент для одной строки настроек
const SettingsRow: React.FC<{
    label: string;
    icon: React.ElementType;
    onPress?: () => void;
    color?: string;
    children?: React.ReactNode;
}> = ({ label, icon: Icon, onPress, color, children }) => {
    const { colors } = useContext(ThemeContext)!;
    const labelColor = color || colors.text;

    return (
        <TouchableOpacity onPress={onPress} style={styles.rowContainer} disabled={!onPress && !children}>
            <View style={[styles.iconContainer, { backgroundColor: colors.inputBackground }]}>
                <Icon size={20} color={labelColor} strokeWidth={2} />
            </View>
            <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
            <View style={styles.rightContent}>
                {children || (onPress && <LucideIcons.ChevronRight size={22} color={colors.textSecondary} />)}
            </View>
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const { colors, theme, setAppTheme } = useContext(ThemeContext)!;
    const { user, signOut } = useAuth();
    const { deleteAllUserData } = useHabitStore();
    const navigation = useNavigation<SettingsScreenNavigationProp>();

    // Локальное состояние для переключателя уведомлений
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = () => {
        Alert.alert( "Выход из аккаунта", "Вы уверены, что хотите выйти?",
            [{ text: "Отмена", style: "cancel" }, { text: "Выйти", style: "destructive", onPress: signOut }]
        );
    };
    
    const handleDeleteAllData = () => {
        Alert.alert("Удалить все данные?", "ВНИМАНИЕ! Это действие необратимо и удалит все ваши привычки, категории и историю.",
            [{ text: "Отмена", style: "cancel" }, { text: "Я понимаю, удалить", style: "destructive",
                onPress: async () => {
                    if (user) {
                       await deleteAllUserData(user.id);
                       Alert.alert("Успех", "Все ваши данные были удалены.");
                       // Можно добавить навигацию на экран входа, если нужно
                    }
                },
            }]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Настройки</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <SectionHeader title="Внешний вид" />
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <SettingsRow label="Тема" icon={LucideIcons.Palette}>
                        <View style={styles.segmentedControl}>
                            {(['light', 'dark', 'system'] as const).map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.segmentButton, theme === item && { backgroundColor: colors.accent }]}
                                    onPress={() => setAppTheme(item)}
                                >
                                    <Text style={[styles.segmentText, { color: theme === item ? colors.buttonText : colors.text }]}>
                                        {item === 'light' ? 'Светлая' : item === 'dark' ? 'Темная' : 'Система'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SettingsRow>
                </View>

                <SectionHeader title="Уведомления" />
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                     <SettingsRow label="Все уведомления" icon={LucideIcons.Bell}>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: "#767577", true: colors.success }}
                            thumbColor={"#f4f3f4"}
                        />
                     </SettingsRow>
                </View>

                <SectionHeader title="Данные" />
                 <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <SettingsRow
                        label="Архив привычек"
                        icon={LucideIcons.Archive}
                        onPress={() => navigation.navigate('ArchivedHabits')}
                    />
                </View>

                <SectionHeader title="Аккаунт" />
                 <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <SettingsRow
                        label="Выйти"
                        icon={LucideIcons.LogOut}
                        onPress={handleLogout}
                        color={colors.danger}
                    />
                </View>
                
                <SectionHeader title="Опасная зона" />
                 <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                     <SettingsRow
                        label="Удалить все данные"
                        icon={LucideIcons.Trash2}
                        onPress={handleDeleteAllData}
                        color={colors.danger}
                    />
                </View>

                {user && <Text style={[styles.footerText, { color: colors.textFaded }]}>Вы вошли как {user.email}</Text>}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { borderRadius: 12, marginBottom: 25, overflow: 'hidden' },
    sectionHeader: { fontSize: 13, fontWeight: '600', paddingLeft: 16, paddingBottom: 8, textTransform: 'uppercase' },
    rowContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, minHeight: 58 },
    iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    rowLabel: { fontSize: 16, flex: 1, fontWeight: '500' },
    rightContent: { marginLeft: 'auto' },
    segmentedControl: { flexDirection: 'row', backgroundColor: '#7676801F', borderRadius: 8, padding: 2 },
    segmentButton: { flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    segmentText: { fontSize: 13, fontWeight: '600' },
    footerText: { textAlign: 'center', marginTop: 20, fontSize: 12 }
});
