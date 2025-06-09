// src/screens/SortCategoriesScreen.tsx

import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist'; // Правильный импорт
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../components/ThemeProvider';
import { Category, fetchCategories, updateCategoryOrder } from '../lib/habits';
import {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart, Check,
    Lightbulb, Bell, Archive, PlusCircle, MinusCircle, X, Clock, // Добавим новые иконки для UI
    Menu, Trash2, Edit, CheckCircle
} from "lucide-react-native";

// Маппинг иконок (скопируйте ваш iconMap сюда)
const iconMap: { [key: string]: React.ComponentType<any> } = {
    Book, Activity, GraduationCap, Briefcase, Music, Coffee, Sun, Moon, Star, Heart,
    Lightbulb, Bell, Archive, Clock, PlusCircle, MinusCircle, X, Menu, Trash2, Edit
};

type RootStackParamList = {
    HabitsStack: undefined; // Название стека, куда мы будем возвращаться
    SortCategories: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "SortCategories">;

export default function SortCategoriesScreen() {
    const { colors } = useContext(ThemeContext);
    const navigation = useNavigation<NavigationProp>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Загрузка категорий при фокусе экрана
    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            // Исключаем "Все" и "Без категории" из списка для сортировки
            const fetchedCategories = await fetchCategories();
            const realCategories = fetchedCategories.filter(
                (cat) => cat.id !== "All" && cat.id !== "Без категории"
            );
            setCategories(realCategories);
        } catch (error) {
            console.error("Error loading categories for sorting:", error);
            Alert.alert("Ошибка", "Не удалось загрузить категории для сортировки.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [loadCategories])
    );

    // Функция для сохранения нового порядка
        const handleSaveOrder = async () => {
          const invalid = categories.find(cat => !cat.name || cat.name.trim() === "");
          if (invalid) {
            Alert.alert("Ошибка", "Одна из категорий не имеет имени. Удалите или отредактируйте её.");
            return;
          }

          setIsSaving(true);
          try {
            await updateCategoryOrder(categories);
            Alert.alert("Успех", "Порядок категорий сохранен!");
            navigation.navigate("HabitsStack");
      } catch (error) {
        console.error("Error saving category order:", error);
        Alert.alert("Ошибка", "Не удалось сохранить порядок категорий.");
      } finally {
        setIsSaving(false);
      }
    };

    // Рендер элемента для DraggableFlatList
    const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => {
        const LucideIcon = item.icon && iconMap[item.icon] ? iconMap[item.icon] : Book;

        return (
            <ScaleDecorator> 
                <TouchableOpacity
                    onLongPress={drag} // Долгое нажатие для начала перетаскивания
                    disabled={isActive} // Отключаем кнопку во время перетаскивания
                    activeOpacity={0.8} // Уменьшаем прозрачность при нажатии
                    style={[
                        styles.categoryItem,
                        { backgroundColor: colors.inputBackground },
                        isActive && { backgroundColor: colors.accent, opacity: 0.8 }, // Подсветка при активном перетаскивании
                    ]}
                >
                    <View style={styles.categoryInfo}>
                        <LucideIcon size={24} color={item.color} />
                        <Text style={[styles.categoryItemText, { color: isActive ? "#FFFFFF" : colors.text }]}>
                            {item.name}
                        </Text>
                    </View>
                    <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
                        <Menu size={24} color={isActive ? "#FFFFFF" : colors.text} />
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
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Сортировка категорий</Text>
                <View style={{ width: 24 }} /> 
            </View>

            <DraggableFlatList
                data={categories}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => setCategories(data)} // Обновляем состояние после перетаскивания
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
                    <CheckCircle size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.saveButtonText}>Готово</Text>
                  </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    draggableListContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryItemText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    dragHandle: {
        padding: 10,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        paddingVertical: 15,
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
