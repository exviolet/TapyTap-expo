// src/components/HabitDetailSheet.tsx
import React, {
  useState,
  useMemo,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { ThemeContext } from "./ThemeProvider";
import { Habit } from "../lib/habits";
import { useHabitStore, HabitNote } from "../store/useHabitStore";
import * as LucideIcons from "lucide-react-native";
import Heatmap from "./Heatmap";
import {
  format,
  subDays,
  startOfDay,
  isWithinInterval,
  parseISO,
  differenceInCalendarDays,
  formatDistanceToNow,
} from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

const iconMap: any = LucideIcons;

type RootStackParamList = {
  EditHabit: { habit: Habit };
  HabitDetailScreen: { habitId: string; habitName: string };
  Journal: {}; // Убедись, что маршрут Journal определен
};
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  habit: Habit | null;
  onClose: () => void;
}

const HabitDetailSheet: React.FC<Props> = ({ habit, onClose }) => {
  console.log(
    "РЕНДЕР HabitDetailSheet: получен проп habit ->",
    habit ? habit.name : null,
  );
  const { colors } = useContext(ThemeContext)!;
  const {
    allCompletions,
    streaks,
    archiveHabit,
    notes,
    fetchNotesForHabit,
    addOrUpdateNote,
    fetchAllNotes,
  } = useHabitStore();
  const navigation = useNavigation<NavigationProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "journal">(
    "overview",
  );
  const [noteContent, setNoteContent] = useState("");
  const [isJournalLoading, setJournalLoading] = useState(false);
  const [isPostingNote, setIsPostingNote] = useState(false);

  const sheetIndex = useMemo(() => (habit ? 0 : -1), [habit]);
  console.log("ЛОГИКА HabitDetailSheet: Вычеслений sheetIndex ->", sheetIndex);
  const snapPoints = useMemo(() => ["80%", "90%"], []);

  useEffect(() => {
    if (habit) {
      setJournalLoading(true);
      fetchNotesForHabit(habit.id).finally(() => setJournalLoading(false));
      setActiveTab("overview");
    }
  }, [habit]);

  const handleAddNote = async () => {
    if (!habit || !noteContent.trim() || isPostingNote) return;
    setIsPostingNote(true);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    await addOrUpdateNote(habit.id, todayStr, noteContent.trim());
    setNoteContent("");
    setIsPostingNote(false);
  };

  // --- Расчеты KPI и Цели ---
  const { totalCompletions, thirtyDayPercentage, goalSeriesText, bestStreak } =
    useMemo(() => {
      if (!habit)
        return {
          totalCompletions: 0,
          thirtyDayPercentage: 0,
          goalSeriesText: "",
          bestStreak: 0,
        };

      const habitCompletions = allCompletions
        .filter(
          (c) =>
            c.habit_id === habit.id &&
            c.completed_count >= habit.target_completions,
        )
        .map((c) => parseISO(c.completion_date))
        .sort((a, b) => b.getTime() - a.getTime());

      let currentStreak = 0;
      let maxStreak = 0;
      if (habitCompletions.length > 0) {
        currentStreak = 1;
        maxStreak = 1;
        for (let i = 0; i < habitCompletions.length - 1; i++) {
          const diff = differenceInCalendarDays(
            habitCompletions[i],
            habitCompletions[i + 1],
          );
          if (diff === 1) {
            currentStreak++;
          } else {
            maxStreak = Math.max(maxStreak, currentStreak);
            currentStreak = 1;
          }
        }
        maxStreak = Math.max(maxStreak, currentStreak);
      }

      const completionsCount = allCompletions.filter(
        (c) =>
          c.habit_id === habit.id &&
          c.completed_count >= habit.target_completions,
      ).length;

      const today = startOfDay(new Date());
      const thirtyDaysAgo = subDays(today, 29);
      const habitCreationDate = parseISO(habit.created_at);
      const firstPossibleDay =
        habitCreationDate > thirtyDaysAgo ? habitCreationDate : thirtyDaysAgo;
      const totalPossibleDays =
        differenceInCalendarDays(today, firstPossibleDay) + 1;
      const completedDaysInWindow = allCompletions.filter((c) => {
        const completionDate = parseISO(c.completion_date);
        return (
          c.habit_id === habit.id &&
          c.completed_count >= habit.target_completions &&
          isWithinInterval(completionDate, {
            start: firstPossibleDay,
            end: today,
          })
        );
      }).length;

      const percentage =
        totalPossibleDays > 0
          ? Math.round((completedDaysInWindow / totalPossibleDays) * 100)
          : 0;

      let seriesText = "Ежедневно";
      if (Number(habit.goal_series) === 7) seriesText = "Неделя";
      if (Number(habit.goal_series) === 30) seriesText = "Месяц";

      return {
        totalCompletions: completionsCount,
        thirtyDayPercentage: percentage,
        goalSeriesText: seriesText,
        bestStreak: maxStreak,
      };
    }, [habit, allCompletions]);

  const currentStreak = habit ? streaks.get(habit.id) || 0 : 0;

  // Обработчики кнопок
  const handleEdit = () => {
    if (!habit) return;
    bottomSheetRef.current?.close();
    navigation.navigate("EditHabit", { habit });
  };

  const handleFullStats = () => {
    if (!habit) return;
    bottomSheetRef.current?.close();
    navigation.navigate("HabitDetailScreen", {
      habitId: habit.id,
      habitName: habit.name,
    });
  };

  const handleArchive = () => {
    if (!habit) return;
    onClose();
    archiveHabit(habit.id);
  };

  const handleViewAllNotes = () => {
    if (!habit) return;
    bottomSheetRef.current?.close();
    navigation.navigate("Journal", {}); // Переход на JournalScreen
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const HabitIcon = habit
    ? iconMap[habit.icon] || LucideIcons.Star
    : LucideIcons.Star;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={sheetIndex}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.textFaded }}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {habit && (
            <>
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        habit.categories[0]?.color || colors.accent,
                    },
                  ]}
                >
                  <HabitIcon size={24} color="#FFF" />
                </View>
                <Text style={[styles.habitName, { color: colors.text }]}>
                  {habit.name}
                </Text>
              </View>

              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "overview" && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() => setActiveTab("overview")}
                >
                  <LucideIcons.LayoutGrid
                    size={16}
                    color={activeTab === "overview" ? "#FFF" : colors.text}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: activeTab === "overview" ? "#FFF" : colors.text,
                      },
                    ]}
                  >
                    Обзор
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "journal" && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() => setActiveTab("journal")}
                >
                  <LucideIcons.BookText
                    size={16}
                    color={activeTab === "journal" ? "#FFF" : colors.text}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === "journal" ? "#FFF" : colors.text },
                    ]}
                  >
                    Журнал
                  </Text>
                </TouchableOpacity>
              </View>
              {activeTab === "overview" ? (
                <>
                  <View style={styles.kpiContainer}>
                    <View style={styles.kpiBox}>
                      <LucideIcons.Flame size={20} color="#FF9500" />
                      <Text style={[styles.kpiValue, { color: colors.text }]}>
                        {currentStreak}
                      </Text>
                      <Text
                        style={[
                          styles.kpiLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Текущая серия
                      </Text>
                    </View>
                    <View style={styles.kpiBox}>
                      <LucideIcons.Trophy size={20} color="#FFC107" />
                      <Text style={[styles.kpiValue, { color: colors.text }]}>
                        {bestStreak}
                      </Text>
                      <Text
                        style={[
                          styles.kpiLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Лучшая серия
                      </Text>
                    </View>
                    <View style={styles.kpiBox}>
                      <LucideIcons.CheckCircle
                        size={20}
                        color={colors.success}
                      />
                      <Text style={[styles.kpiValue, { color: colors.text }]}>
                        {totalCompletions}
                      </Text>
                      <Text
                        style={[
                          styles.kpiLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Выполнено
                      </Text>
                    </View>
                    <View style={styles.kpiBox}>
                      <LucideIcons.PieChart size={20} color={colors.accent} />
                      <Text style={[styles.kpiValue, { color: colors.text }]}>
                        {thirtyDayPercentage}%
                      </Text>
                      <Text
                        style={[
                          styles.kpiLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        За 30 дней
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.section,
                      {
                        backgroundColor: colors.background,
                        paddingVertical: 0,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoRow,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <LucideIcons.Target
                        size={20}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        Цель
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {goalSeriesText}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.infoRow,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <LucideIcons.FolderKanban
                        size={20}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        Категории
                      </Text>
                      <View style={styles.categoriesContainer}>
                        {habit.categories.length > 0 ? (
                          habit.categories.map((cat) => {
                            const CategoryIcon =
                              iconMap[cat.icon] || LucideIcons.Tag;
                            return (
                              <View
                                key={cat.id}
                                style={[
                                  styles.categoryChip,
                                  { backgroundColor: cat.color + "33" },
                                ]}
                              >
                                <CategoryIcon
                                  size={12}
                                  color={cat.color}
                                  style={{ marginRight: 5 }}
                                />
                                <Text
                                  style={[
                                    styles.categoryChipText,
                                    { color: cat.color },
                                  ]}
                                >
                                  {cat.name}
                                </Text>
                              </View>
                            );
                          })
                        ) : (
                          <Text
                            style={[styles.infoValue, { color: colors.text }]}
                          >
                            Без категории
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {habit.description && (
                    <View
                      style={[
                        styles.section,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        ОПИСАНИЕ
                      </Text>
                      <Text
                        style={[styles.descriptionText, { color: colors.text }]}
                      >
                        {habit.description}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.section,
                      { backgroundColor: colors.background, marginTop: 10 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      АКТИВНОСТЬ ЗА ГОД
                    </Text>
                    <Heatmap habit={habit} completions={allCompletions} />
                  </View>
                </>
              ) : (
                <View style={styles.journalContainer}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ЗАМЕТКА НА СЕГОДНЯ
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.inputBackground },
                    ]}
                  >
                    <TextInput
                      style={[styles.noteInput, { color: colors.text }]}
                      placeholder="Как прошел день с этой привычкой?"
                      placeholderTextColor={colors.textFaded}
                      multiline
                      value={noteContent}
                      onChangeText={setNoteContent}
                    />
                    <TouchableOpacity
                      style={[
                        styles.addNoteButton,
                        {
                          backgroundColor: colors.accent,
                          opacity: isPostingNote ? 0.6 : 1,
                        },
                      ]}
                      onPress={handleAddNote}
                      disabled={isPostingNote}
                    >
                      {isPostingNote ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <LucideIcons.Send size={20} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {isJournalLoading ? (
                    <ActivityIndicator
                      color={colors.accent}
                      style={{ marginTop: 20 }}
                    />
                  ) : (
                    <>
                      {notes.length > 0 ? (
                        notes.map((note) => (
                          <View
                            key={note.id}
                            style={[
                              styles.noteCard,
                              { backgroundColor: colors.inputBackground },
                            ]}
                          >
                            <Text
                              style={[
                                styles.noteDate,
                                { color: colors.accent },
                              ]}
                            >
                              {formatDistanceToNow(parseISO(note.note_date), {
                                addSuffix: true,
                                locale: ru,
                              })}
                            </Text>
                            <Text
                              style={[
                                styles.noteContent,
                                { color: colors.text },
                              ]}
                            >
                              {note.content}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text
                          style={{
                            color: colors.textSecondary,
                            textAlign: "center",
                            marginTop: 20,
                            fontStyle: "italic",
                          }}
                        >
                          Заметок пока нет
                        </Text>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.viewAllButton,
                          { backgroundColor: colors.accent },
                        ]}
                        onPress={handleViewAllNotes}
                      >
                        <Text style={[styles.viewAllText, { color: "#FFF" }]}>
                          Посмотреть все
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
        <View
          style={[
            styles.actionsContainer,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.cardBackground,
            },
          ]}
        >
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <LucideIcons.Edit3 size={22} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Изменить
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleArchive}>
            <LucideIcons.Archive size={22} color={colors.warning} />
            <Text style={[styles.actionButtonText, { color: colors.warning }]}>
              Архив
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  habitName: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  kpiContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  kpiBox: {
    alignItems: "center",
    minWidth: 80,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: "auto",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: 1,
    marginLeft: 12,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#7676801F",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabText: { fontSize: 14, fontWeight: "bold", marginLeft: 8 },
  journalContainer: { paddingBottom: 40 },
  inputContainer: { flexDirection: "row", padding: 8, borderRadius: 12 },
  noteInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 120,
    paddingTop: 10,
  },
  addNoteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    marginLeft: 8,
  },
  noteCard: { padding: 14, borderRadius: 10, marginBottom: 10, marginTop: 20 },
  noteDate: { fontSize: 12, fontWeight: "bold", marginBottom: 6 },
  noteContent: { fontSize: 15, lineHeight: 21 },
  viewAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default HabitDetailSheet;
