// src/components/CircularProgressDay.tsx
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { ThemeContext } from './ThemeProvider';
import { DateData } from 'react-native-calendars';
import { Habit } from '../lib/habits';

interface CustomDayProps {
  date?: DateData;
  state?: 'selected' | 'disabled' | 'today' | 'inactive' | '';
  habit: Habit | null;
  progress: number; // от 0 до 1
  onPress: () => void;
}

const CIRCLE_SIZE = 38;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const CircularProgressDay: React.FC<CustomDayProps> = ({ date, state, habit, progress, onPress }) => {
    const { colors } = useContext(ThemeContext)!;
    
    if (!habit) return <View style={styles.container} />;
    
    const isDisabled = state === 'disabled' || state === 'inactive';
    const isToday = state === 'today';
    const textColor = isDisabled ? colors.textFaded : isToday ? colors.accent : colors.text;
    const progressColor = habit.categories[0]?.color || colors.accent;

    const renderContent = () => {
        const progressOffset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);
        return (
            <>
                <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
                    <Circle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        stroke={colors.inputBackground}
                        strokeWidth={STROKE_WIDTH}
                        fill="transparent"
                    />
                    {(progress > 0 || habit.type === 'checkoff') && (
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS}
                            stroke={progressColor}
                            strokeWidth={STROKE_WIDTH}
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={progressOffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                            fill="transparent"
                        />
                    )}
                </Svg>
                {progress >= 1 && (
                    <View style={[styles.indicator, { backgroundColor: progressColor }]} />
                )}
            </>
        );
    };

    return (
        <TouchableOpacity onPress={onPress} disabled={isDisabled} style={styles.container}>
            <View style={styles.contentContainer}>
                {renderContent()}
                <Text style={[styles.dayText, { color: textColor }]}>{date?.day}</Text>
            </View>
            {isToday && <View style={[styles.todayDot, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
    contentContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
    dayText: { position: 'absolute', fontSize: 16, fontWeight: '500' },
    indicator: { // Стиль теперь содержит только фиксированные свойства
        position: 'absolute',
        right: -5,
        top: -5,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    todayDot: {
        position: 'absolute',
        bottom: 4,
        width: 5,
        height: 5,
        borderRadius: 2.5,
    }
});
