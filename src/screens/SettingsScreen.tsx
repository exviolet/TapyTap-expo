// src/screens/SettingsScreen.tsx
import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import * as LucideIcons from 'lucide-react-native';

// Типы для навигации
type RootStackParamList = {
    ArchivedHabits: undefined;
    // Добавьте другие экраны, если они есть в вашем стеке
};
type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;


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
        <TouchableOpacity onPress={onPress} style={styles.rowContainer} disabled={!onPress}>
            <View style={[styles.iconContainer, { backgroundColor: colors.inputBackground }]}>
                <Icon size={20} color={labelColor} />
            </View>
            <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
            <View style={styles.rightContent}>
                {children || (onPress && <LucideIcons.ChevronRight size={22} color={colors.textSecondary} />)}
            </View>
        </TouchableOpacity>
    );
};

// Главный компонент экрана настроек
export default function SettingsScreen() {
    const { colors, theme, setAppTheme } = useContext(ThemeContext)!;
    const { user, signOut } = useAuth();
    const navigation = useNavigation<SettingsScreenNavigationProp>();

    const handleLogout = () => {
        Alert.alert(
            "Выход из аккаунта",
            "Вы уверены, что хотите выйти?",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Выйти",
                    style: "destructive",
                    onPress: () => signOut(),
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Настройки</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* --- Секция Внешний вид --- */}
                <SectionHeader title="Внешний вид" />
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <SettingsRow label="Тема" icon={LucideIcons.Palette}>
                        <View style={styles.segmentedControl}>
                            {(['light', 'dark', 'system'] as const).map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.segmentButton,
                                        theme === item && { backgroundColor: colors.accent }
                                    ]}
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

                {/* --- Секция Данные --- */}
                <SectionHeader title="Данные" />
                 <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <SettingsRow
                        label="Архив привычек"
                        icon={LucideIcons.Archive}
                        onPress={() => navigation.navigate('ArchivedHabits')}
                    />
                </View>

                {/* --- Секция Аккаунт --- */}
                <SectionHeader title="Аккаунт" />
                 <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <SettingsRow
                        label="Выйти"
                        icon={LucideIcons.LogOut}
                        onPress={handleLogout}
                        color={colors.danger}
                    />
                </View>

                {/* --- Информация о пользователе внизу --- */}
                {user && (
                    <Text style={[styles.footerText, { color: colors.textFaded }]}>
                        Вы вошли как {user.email}
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    section: {
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)', // для светлой темы
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rowLabel: {
        fontSize: 16,
        flex: 1,
    },
    rightContent: {
        marginLeft: 'auto',
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#7676801F', // systemGray5
        borderRadius: 8,
        padding: 2,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '500',
    },
    footerText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 12,
    }
});
