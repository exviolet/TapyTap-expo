// src/screens/AddEditNoteScreen.tsx
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ThemeContext } from '../components/ThemeProvider';
import { useHabitStore, HabitNote } from '../store/useHabitStore';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import * as LucideIcons from 'lucide-react-native';
import { Habit } from '@/lib/habits';

type RootStackParamList = { AddEditNote: { note?: HabitNote, habitId?: string } };
type AddEditNoteRouteProp = RouteProp<RootStackParamList, 'AddEditNote'>;

export default function AddEditNoteScreen() {
    const { colors } = useContext(ThemeContext)!;
    const navigation = useNavigation();
    const route = useRoute<AddEditNoteRouteProp>();
    
    const { habits, addOrUpdateNote, deleteNote, fetchAllNotes } = useHabitStore();
    const { user } = useAuth();

    const [note, setNote] = useState(route.params?.note?.content || '');
    const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(route.params?.note?.habit_id || route.params?.habitId);
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!route.params?.note;

    useEffect(() => {
        navigation.setOptions({ title: isEditing ? 'Редактировать заметку' : 'Новая заметка' });
    }, [isEditing, navigation]);

    const handleSave = async () => {
        if (!note.trim()) {
            Alert.alert('Ошибка', 'Заметка не может быть пустой.');
            return;
        }
        if (!selectedHabitId) {
            Alert.alert('Ошибка', 'Выберите привычку для этой заметки.');
            return;
        }
        setIsSaving(true);
        try {
            const dateStr = route.params?.note?.note_date || format(new Date(), 'yyyy-MM-dd');
            await addOrUpdateNote(selectedHabitId, dateStr, note);
            if (user?.id) await fetchAllNotes(user.id); // Обновляем список
            navigation.goBack();
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось сохранить заметку.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (!route.params?.note?.id) return;
        Alert.alert(
            "Удалить заметку?",
            "Это действие нельзя будет отменить.",
            [
                { text: "Отмена", style: "cancel" },
                { text: "Удалить", style: "destructive", onPress: async () => {
                    await deleteNote(route.params.note!.id);
                    if (user?.id) await fetchAllNotes(user.id);
                    navigation.goBack();
                }}
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.label, {color: colors.text}]}>Заметка</Text>
                <TextInput
                    style={[styles.textInput, {backgroundColor: colors.inputBackground, color: colors.text}]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Что у вас на уме?"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    autoFocus
                />
                
                {!isEditing && !route.params?.habitId && (
                    <>
                        <Text style={[styles.label, {color: colors.text, marginTop: 20}]}>Привычка</Text>
                        <View style={styles.habitSelector}>
                            {habits.map(habit => (
                                <TouchableOpacity 
                                    key={habit.id} 
                                    style={[
                                        styles.habitChip, 
                                        { backgroundColor: selectedHabitId === habit.id ? colors.accent : colors.inputBackground }
                                    ]}
                                    onPress={() => setSelectedHabitId(habit.id)}
                                >
                                    <Text style={{color: selectedHabitId === habit.id ? '#FFF' : colors.text}}>{habit.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <TouchableOpacity style={[styles.saveButton, {backgroundColor: colors.accent}]} onPress={handleSave} disabled={isSaving}>
                    <Text style={styles.buttonText}>{isSaving ? 'Сохранение...' : 'Сохранить'}</Text>
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity style={[styles.deleteButton, {borderColor: colors.danger}]} onPress={handleDelete}>
                        <LucideIcons.Trash2 size={16} color={colors.danger} />
                        <Text style={[styles.buttonText, {color: colors.danger, marginLeft: 8}]}>Удалить заметку</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 20 },
    textInput: {
        minHeight: 150,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    habitSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    habitChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
    },
    deleteButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 15,
        borderWidth: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
