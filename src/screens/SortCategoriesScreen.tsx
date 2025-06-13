// src/screens/SortCategoriesScreen.tsx
import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../components/ThemeProvider';
import { Category, fetchCategories, updateCategoryOrder } from '../lib/habits';
import * as LucideIcons from "lucide-react-native";

const iconMap: any = LucideIcons;

type RootStackParamList = {
    Habits: undefined;
    SortCategories: undefined;
};
type NavigationProp = StackNavigationProp<RootStackParamList, "SortCategories">;

export default function SortCategoriesScreen() {
    const { colors } = useContext(ThemeContext)!;
    const navigation = useNavigation<NavigationProp>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedCategories = await fetchCategories();
            const realCategories = fetchedCategories.filter(cat => cat.id !== "All" && cat.id !== "Uncategorized");
            setCategories(realCategories);
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось загрузить категории.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadCategories(); }, [loadCategories]));

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            await updateCategoryOrder(categories);
            Alert.alert("Успех", "Порядок категорий сохранен!");
            // ИСПРАВЛЕНО: Используем goBack() для возврата на предыдущий экран
            navigation.goBack();
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось сохранить порядок категорий.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => {
        const LucideIcon = item.icon && iconMap[item.icon] ? iconMap[item.icon] : LucideIcons.Tag;
        return (
            <ScaleDecorator> 
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    activeOpacity={0.8}
                    style={[
                        styles.categoryItem,
                        { backgroundColor: colors.cardBackground },
                        isActive && { backgroundColor: colors.accent },
                    ]}
                >
                    <View style={styles.categoryInfo}>
                        <LucideIcon size={24} color={item.color || colors.accent} />
                        <Text style={[styles.categoryItemText, { color: isActive ? "#FFFFFF" : colors.text }]}>
                            {item.name}
                        </Text>
                    </View>
                    <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
                        <LucideIcons.Menu size={24} color={isActive ? "#FFFFFF" : colors.text} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <LucideIcons.X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Сортировка категорий</Text>
                <View style={{ width: 24 }} /> 
            </View>

            <DraggableFlatList
                data={categories}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => setCategories(data)}
                renderItem={renderItem}
                contentContainerStyle={styles.draggableListContent}
            />

            <TouchableOpacity
                onPress={handleSaveOrder}
                style={[styles.saveButton, { backgroundColor: colors.accent }]}
                disabled={isSaving}
            >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LucideIcons.CheckCircle size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.saveButtonText}>Готово</Text>
                  </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
    backButton: { padding: 8 },
    title: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    draggableListContent: { paddingHorizontal: 16, paddingBottom: 20 },
    categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 10 },
    categoryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    categoryItemText: { marginLeft: 15, fontSize: 16, fontWeight: '500' },
    dragHandle: { padding: 10 },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, paddingVertical: 15, borderRadius: 15, marginBottom: 20 },
    saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
