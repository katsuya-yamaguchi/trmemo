import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useTheme } from "../context/theme-context";
import { useAuth } from "../context/auth-context";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dumbbell, Plus, Minus, Save, ArrowLeft } from "lucide-react-native";
import { workoutApi } from "../services/api";
import ExerciseSelectorModal from "../components/exercise-selector-modal";
import { TrainingPlan, TrainingDay, PlanExercise, Exercise, ExerciseType } from "../types/exercise";

// 種目タイプの定義
const EXERCISE_TYPES = [
  { id: "barbell", name: "バーベル" },
  { id: "dumbbell", name: "ダンベル" },
  { id: "band", name: "バンド" },
  { id: "machine", name: "マシン" },
  { id: "other", name: "その他" },
];

// ルートパラメータの型定義
type RootStackParamList = {
  CreateTrainingPlan: {
    plan?: {
      id: string;
      name: string;
      trainingDays: {
        id: string;
        day_number: number;
        title: string;
        estimated_duration: number;
        exercises: {
          id: string;
          name: string;
          type?: string;
          sets: number;
          reps: string;
          default_weight?: string;
        }[];
      }[];
    };
  };
};

type CreateTrainingPlanScreenRouteProp = RouteProp<RootStackParamList, 'CreateTrainingPlan'>;

export default function CreateTrainingPlanScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const route = useRoute<CreateTrainingPlanScreenRouteProp>();
  const existingPlan = route.params?.plan;
  
  // プラン名
  const [planName, setPlanName] = useState(existingPlan?.name || "");
  
  // 日数
  const [days, setDays] = useState(
    existingPlan?.trainingDays.map(day => ({
      id: day.id,
      dayNumber: day.day_number,
      title: day.title,
      estimatedDuration: day.estimated_duration,
      exercises: day.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        type: ex.type || "barbell",
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.default_weight || "",
      })),
    })) || [
      {
        id: "1",
        dayNumber: 1,
        title: "トレーニング 1",
        estimatedDuration: 60,
        exercises: [
          {
            id: "ex1",
            name: "",
            type: "barbell",
            sets: 3,
            reps: "8-12",
            weight: "",
          },
        ],
      },
    ]
  );

  // 選択中の日
  const [activeDay, setActiveDay] = useState(0);
  
  // 保存中状態
  const [isSaving, setIsSaving] = useState(false);

  const [isExerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);

  // 日を追加
  const addDay = () => {
    const newDayNumber = days.length + 1;
    setDays([
      ...days,
      {
        id: `temp-day-${Date.now()}`,
        dayNumber: newDayNumber,
        title: `トレーニング ${newDayNumber}`,
        estimatedDuration: 60,
        exercises: [
          {
            id: `temp-ex-${Date.now()}`,
            name: "",
            type: "barbell",
            sets: 3,
            reps: "8-12",
            weight: "",
          },
        ],
      },
    ]);
    setActiveDay(days.length);
  };

  // 種目を追加
  const addExercise = (dayIndex) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises.push({
      id: `temp-ex-${Date.now()}`,
      name: "",
      type: "barbell",
      sets: 3,
      reps: "8-12",
      weight: "",
    });
    setDays(updatedDays);
  };

  // 種目を削除
  const removeExercise = (dayIndex, exerciseIndex) => {
    if (days[dayIndex].exercises.length === 1) {
      Alert.alert("エラー", "少なくとも1つの種目が必要です");
      return;
    }
    
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises.splice(exerciseIndex, 1);
    setDays(updatedDays);
  };

  // 日を削除
  const removeDay = (dayIndex) => {
    if (days.length === 1) {
      Alert.alert("エラー", "少なくとも1日のトレーニングが必要です");
      return;
    }
    
    const updatedDays = [...days];
    updatedDays.splice(dayIndex, 1);
    
    // 日番号を更新
    updatedDays.forEach((day, index) => {
      day.dayNumber = index + 1;
      day.title = `トレーニング ${index + 1}`;
    });
    
    setDays(updatedDays);
    
    // アクティブな日が削除された場合、前の日を選択
    if (activeDay >= updatedDays.length) {
      setActiveDay(Math.max(0, updatedDays.length - 1));
    }
  };

  // 種目名を更新
  const updateExerciseName = (dayIndex, exerciseIndex, name) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises[exerciseIndex].name = name;
    setDays(updatedDays);
  };

  // 種目タイプを更新
  const updateExerciseType = (dayIndex, exerciseIndex, type) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises[exerciseIndex].type = type;
    setDays(updatedDays);
  };

  // セット数を更新
  const updateExerciseSets = (dayIndex, exerciseIndex, sets) => {
    const updatedDays = [...days];
    const parsedSets = parseInt(sets);
    updatedDays[dayIndex].exercises[exerciseIndex].sets = isNaN(parsedSets) ? 1 : Math.max(1, parsedSets);
    setDays(updatedDays);
  };

  // レップ数を更新
  const updateExerciseReps = (dayIndex, exerciseIndex, reps) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises[exerciseIndex].reps = reps;
    setDays(updatedDays);
  };

  // 重量を更新
  const updateExerciseWeight = (dayIndex, exerciseIndex, weight) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises[exerciseIndex].weight = weight;
    setDays(updatedDays);
  };

  // 推定時間を更新
  const updateDayDuration = (dayIndex, duration) => {
    const updatedDays = [...days];
    const parsedDuration = parseInt(duration);
    updatedDays[dayIndex].estimatedDuration = isNaN(parsedDuration) ? 30 : Math.max(10, parsedDuration);
    setDays(updatedDays);
  };

  // 種目選択モーダルを開く
  const openExerciseSelector = (exerciseIndex: number) => {
    setSelectedExerciseIndex(exerciseIndex);
    setExerciseSelectorVisible(true);
  };

  // 種目を選択
  const handleExerciseSelect = (exercise: Exercise) => {
    if (selectedExerciseIndex === null) return;

    const updatedDays = [...days];
    const currentExercise = updatedDays[activeDay].exercises[selectedExerciseIndex];
    
    updatedDays[activeDay].exercises[selectedExerciseIndex] = {
      ...currentExercise,
      id: exercise.id,
      name: exercise.name,
      type: exercise.type,
    };
    
    setDays(updatedDays);
    setExerciseSelectorVisible(false);
    setSelectedExerciseIndex(null);
  };

  // プランを保存
  const saveTrainingPlan = async () => {
    if (!planName.trim()) {
      Alert.alert("エラー", "プラン名を入力してください");
      return;
    }
    
    // 各日のバリデーション
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      
      for (let j = 0; j < day.exercises.length; j++) {
        const exercise = day.exercises[j];
        if (!exercise.name.trim()) {
          Alert.alert("エラー", `Day ${day.dayNumber} の種目 ${j + 1} の名前を入力してください`);
          return;
        }
      }
    }
    
    try {
      setIsSaving(true);
      
      const planData = {
        name: planName,
        trainingDays: days.map(day => ({
          id: day.id,
          day_number: day.dayNumber,
          title: day.title,
          estimated_duration: day.estimatedDuration,
          exercises: day.exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            type: ex.type as ExerciseType,
            sets: ex.sets,
            reps: ex.reps,
            default_weight: ex.weight || undefined,
          })),
        })),
      };
      
      if (existingPlan) {
        // 既存のプランを更新
        await workoutApi.updateTrainingPlan(existingPlan.id, planData);
        Alert.alert(
          "完了",
          "トレーニングプランを更新しました",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        // 新規プランを作成
        await workoutApi.createTrainingPlan(planData);
        Alert.alert(
          "完了",
          "トレーニングプランを作成しました",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error("トレーニングプラン保存エラー:", error);
      Alert.alert("エラー", `トレーニングプランの${existingPlan ? '更新' : '作成'}に失敗しました`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {existingPlan ? "トレーニングプラン編集" : "トレーニングプラン作成"}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>プラン名</Text>
          <Input
            placeholder="例: 週3回フルボディ"
            value={planName}
            onChangeText={setPlanName}
          />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {days.map((day, index) => (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.tab,
                activeDay === index && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setActiveDay(index)}
            >
              <View style={styles.tabHeader}>
                <Text style={[styles.tabText, { color: activeDay === index ? "#fff" : colors.text }]}>
                  Day {day.dayNumber}
                </Text>
                {days.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeDay(index)}
                    style={styles.removeButton}
                  >
                    <Minus size={12} color={activeDay === index ? "#fff" : colors.text} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.tabSubtext, { color: activeDay === index ? "#fff" : colors.text, opacity: 0.7 }]}>
                {day.title}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.addDayButton, { borderColor: colors.border }]}
            onPress={addDay}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.addDayText, { color: colors.primary }]}>日を追加</Text>
          </TouchableOpacity>
        </ScrollView>
        
        {days[activeDay] && (
          <Card style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.dayHeader}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>タイトル</Text>
                <Input
                  placeholder="例: 胸・肩・三頭筋"
                  value={days[activeDay].title}
                  onChangeText={(text) => {
                    const updatedDays = [...days];
                    updatedDays[activeDay].title = text;
                    setDays(updatedDays);
                  }}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>推定時間 (分)</Text>
                <Input
                  placeholder="60"
                  value={days[activeDay].estimatedDuration.toString()}
                  onChangeText={(text) => updateDayDuration(activeDay, text)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>種目</Text>
            
            {days[activeDay].exercises.map((exercise, exerciseIndex) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Dumbbell size={20} color={colors.primary} />
                  <Text style={[styles.exerciseHeaderText, { color: colors.text }]}>
                    種目 {exerciseIndex + 1}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => removeExercise(activeDay, exerciseIndex)}
                    style={styles.removeExerciseButton}
                  >
                    <Minus size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={[styles.exerciseSelector, { borderColor: colors.border }]}
                  onPress={() => openExerciseSelector(exerciseIndex)}
                >
                  <Text style={[styles.exerciseSelectorText, { color: colors.text }]}>
                    {exercise.name || "種目を選択"}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>セット数</Text>
                    <Input
                      placeholder="3"
                      value={exercise.sets.toString()}
                      onChangeText={(text) => updateExerciseSets(activeDay, exerciseIndex, text)}
                      keyboardType="number-pad"
                    />
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>レップ数</Text>
                    <Input
                      placeholder="8-12"
                      value={exercise.reps}
                      onChangeText={(text) => updateExerciseReps(activeDay, exerciseIndex, text)}
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>目標重量 (任意)</Text>
                  <Input
                    placeholder="例: 40kg"
                    value={exercise.weight}
                    onChangeText={(text) => updateExerciseWeight(activeDay, exerciseIndex, text)}
                  />
                </View>
              </View>
            ))}
            
            <TouchableOpacity
              style={[styles.addExerciseButton, { borderColor: colors.border }]}
              onPress={() => addExercise(activeDay)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.addExerciseText, { color: colors.primary }]}>種目を追加</Text>
            </TouchableOpacity>
          </Card>
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            onPress={saveTrainingPlan}
            isLoading={isSaving}
            style={styles.saveButton}
          >
            <Save size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>
              {existingPlan ? "更新する" : "保存する"}
            </Text>
          </Button>
        </View>
      </ScrollView>

      <ExerciseSelectorModal
        visible={isExerciseSelectorVisible}
        onClose={() => {
          setExerciseSelectorVisible(false);
          setSelectedExerciseIndex(null);
        }}
        onSelect={handleExerciseSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  tabsContainer: {
    marginVertical: 16,
  },
  tabsContent: {
    paddingRight: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: 2,
  },
  addDayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addDayText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  dayCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  dayHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  exerciseCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  removeExerciseButton: {
    padding: 4,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addExerciseText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  buttonContainer: {
    marginVertical: 24,
  },
  saveButton: {
    flexDirection: "row",
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  exerciseSelector: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  exerciseSelectorText: {
    fontSize: 16,
    textAlign: "center",
  },
}); 