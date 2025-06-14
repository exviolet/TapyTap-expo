// src/screens/ArchivedHabitsScreen.tsx
import React, { useContext, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { useHabitStore } from '../store/useHabitStore';
import { useAuth } from '../contexts/AuthContext';
import { Habit } from '../lib/habits';
import * as LucideIcons from 'lucide-react-native';

const ArchivedHabitItem: React.FC<{ item: Habit }> = ({ item }) => {
    const { colors } = useContext(ThemeContext)!;
    const { unarchiveHabit, deleteHabitPermanently } = useHabitStore();

    const handleRestore = () => {
        Alert.alert("Восстановить привычку?", `"${item.name}" снова появится в вашем основном списке.`, [
            { text: "Отмена", style: "cancel" },
            { text: "Восстановить", onPress: () => unarchiveHabit(item.id) }
        ]);
    };
    
    const handleDelete = () => {
        Alert.alert("Удалить навсегда?", `Привычка "${item.name}" будет удалена без возможности восстановления.`, [
            { text: "Отмена", style: "cancel" },
            { text: "Удалить", style: "destructive", onPress: () => deleteHabitPermanently(item.id) }
        ]);
    };

    return (
        <View style={[styles.itemContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={handleRestore} style={[styles.button, { backgroundColor: colors.success }]}>
                    <LucideIcons.Undo2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
                 <TouchableOpacity onPress={handleDelete} style={[styles.button, { backgroundColor: colors.danger }]}>
                    <LucideIcons.Trash2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function ArchivedHabitsScreen() {
    const { colors } = useContext(ThemeContext)!;
    const { user } = useAuth();
    const { archivedHabits, isLoadingHabits, fetchArchivedHabits } = useHabitStore();
    const navigation = useNavigation();

    useFocusEffect(useCallback(() => {
        if (user?.id) {
            fetchArchivedHabits(user.id);
        }
    }, [user?.id, fetchArchivedHabits]));
    
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <LucideIcons.ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Архив привычек</Text>
                <View style={{ width: 28 }} />
            </View>
            
            {isLoadingHabits ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.accent} />
            ) : (
                <FlatList
                    data={archivedHabits}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <ArchivedHabitItem item={item} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Здесь пока пусто. Архивированные привычки появятся в этом списке.
                        </Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    listContent: { paddingHorizontal: 16 },
    itemContainer: { padding: 16, borderRadius: 12, marginVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
    itemName: { fontSize: 16, fontWeight: '600', flex: 1 },
    buttonsContainer: { flexDirection: 'row', gap: 10 },
    button: { padding: 10, borderRadius: 8 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, paddingHorizontal: 20 }
});
