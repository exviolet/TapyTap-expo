// src/components/IconPickerModal.tsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemeContext } from './ThemeProvider';
import * as LucideIcons from 'lucide-react-native';

const iconMap: any = LucideIcons;

// Определяем список иконок, которые хотим показать пользователю
const availableIcons = [
    'Book', 'Award', 'Activity', 'GraduationCap', 'Briefcase', 'Music', 'Coffee', 'Sun', 'Moon', 'Star', 'Heart',
    'Lightbulb', 'Bell', 'Archive', 'Clock', 'Code', 'Cloud', 'Camera', 'Film', 'Flag', 'Gift', 'PenSquare',
    'Phone', 'Plane', 'Rocket', 'ShoppingBag', 'Smile', 'Speaker', 'Umbrella', 'Wallet', 'Watch', 'Zap',
    'Anchor', 'Bike', 'Car', 'Dumbbell', 'Gamepad2', 'Headphones', 'Laptop', 'Leaf', 'Bird', 'Cat', 'Dog', 'Origami', 'Panda'
];

interface IconPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectIcon: (iconName: string) => void;
    currentIcon: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ visible, onClose, onSelectIcon, currentIcon }) => {
    const { colors } = useContext(ThemeContext)!;

    const renderIcon = ({ item }: { item: string }) => {
        const IconComponent = iconMap[item];
        const isSelected = currentIcon === item;
        return (
            <TouchableOpacity
                style={[
                    styles.iconButton,
                    { backgroundColor: isSelected ? colors.accent : colors.inputBackground }
                ]}
                onPress={() => {
                    onSelectIcon(item);
                    onClose();
                }}
            >
                <IconComponent size={28} color={isSelected ? '#FFF' : colors.text} />
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Выберите иконку</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <LucideIcons.X size={28} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={availableIcons}
                    renderItem={renderIcon}
                    keyExtractor={(item) => item}
                    numColumns={5} // Отображаем в 5 колонок
                    contentContainerStyle={styles.gridContainer}
                />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
    },
    gridContainer: {
        paddingHorizontal: 10,
    },
    iconButton: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 8,
        borderRadius: 16,
    },
});
