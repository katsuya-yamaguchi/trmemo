import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useTheme } from "../context/theme-context";
import { useAuth } from "../context/auth-context";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dumbbell, Plus, Minus, Save, ArrowLeft, Clock } from "lucide-react-native";
import { workoutApi } from "../services/api";
import ExerciseSelectorModal from "../components/exercise-selector-modal";
import { Workout, CreateWorkoutRequest, UpdateWorkoutRequest } from "../types/workout";
import { Exercise } from "../types/exercise";

// ルートパラメータの型定義
type RootStackParamList = {
  CreateWorkout: {
    workout?: Workout;
  };
};

type CreateWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'CreateWorkout'>;

interface WorkoutExerciseForm {
  id?: string;
  exercise_id: string;
  exercise?: Exercise;
  order_index: number;
  set_count: number;
  rep_min?: number;
  rep_max?: number;
  reps: string;
  default_weight?: string;
  rest_seconds: number;
  notes?: string;
}

export default function CreateWorkoutScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const route = useRoute<CreateWorkoutScreenRouteProp>();
  const existingWorkout = route.params?.workout;
  
  // ワークアウト基本情報
  const [title, setTitle] = useState(existingWorkout?.title || "");
  const [estimatedDuration, setEstimatedDuration] = useState(
    existingWorkout?.estimated_duration?.toString() || "60"
  );
  const [notes, setNotes] = useState(existingWorkout?.notes || "");
  
  // エクササイズリスト
  const [exercises, setExercises] = useState<WorkoutExerciseForm[]>(
    existingWorkout?.exercises.map((ex, index) => ({
      id: ex.id,
      exercise_id: ex.exercise_id,
      exercise: ex.exercise,
      order_index: index,
      set_count: ex.set_count,
      rep_min: ex.rep_min,
      rep_max: ex.rep_max,
      reps: ex.reps,
      default_weight: ex.default_weight,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
    })) || [
      {
        exercise_id: "",
        exercise: undefined,
        order_index: 0,
        set_count: 3,
        reps: "8-12",
        default_weight: "",
        rest_seconds: 60,
        notes: "",
      },
    ]
  );
  
  // 保存中状態
  const [isSaving, setIsSaving] = useState(false);
  
  // エクササイズ選択モーダル
  const [isExerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);

  // エクササイズを追加
  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        exercise_id: "",
        exercise: undefined,
        order_index: exercises.length,
        set_count: 3,
        reps: "8-12",
        default_weight: "",
        rest_seconds: 60,
        notes: "",
      },
    ]);
  };

  // エクササイズを削除
  const removeExercise = (index: number) => {
    if (exercises.length === 1) {
      Alert.alert("エラー", "少なくとも1つのエクササイズが必要です");
      return;
    }
    
    const updatedExercises = [...exercises];
    updatedExercises.splice(index, 1);
    
    // order_indexを更新
    updatedExercises.forEach((ex, idx) => {
      ex.order_index = idx;
    });
    
    setExercises(updatedExercises);
  };

  // エクササイズ選択
  const handleExerciseSelect = (exercise: Exercise) => {
    if (selectedExerciseIndex !== null) {
      const updatedExercises = [...exercises];
      updatedExercises[selectedExerciseIndex] = {
        ...updatedExercises[selectedExerciseIndex],
        exercise_id: exercise.id,
        exercise: exercise,
      };
      setExercises(updatedExercises);
    }
    setExerciseSelectorVisible(false);
    setSelectedExerciseIndex(null);
  };

  // エクササイズ選択モーダルを開く
  const openExerciseSelector = (index: number) => {
    setSelectedExerciseIndex(index);
    setExerciseSelectorVisible(true);
  };

  // エクササイズフィールドを更新
  const updateExerciseField = (index: number, field: keyof WorkoutExerciseForm, value: any) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setExercises(updatedExercises);
  };

  // ワークアウトを保存
  const saveWorkout = async () => {
    if (!title.trim()) {
      Alert.alert("エラー", "ワークアウト名を入力してください");
      return;
    }
    
    // エクササイズのバリデーション
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      if (!exercise.exercise_id || !exercise.exercise) {
        Alert.alert("エラー", `エクササイズ ${i + 1} を選択してください`);
        return;
      }
    }
    
    try {
      setIsSaving(true);
      
      const workoutData: CreateWorkoutRequest | UpdateWorkoutRequest = {
        title: title.trim(),
        estimated_duration: parseInt(estimatedDuration) || undefined,
        notes: notes.trim() || undefined,
        exercises: exercises.map((ex) => ({
          ...(ex.id && { id: ex.id }),
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          set_count: ex.set_count,
          rep_min: ex.rep_min,
          rep_max: ex.rep_max,
          reps: ex.reps,
          default_weight: ex.default_weight || undefined,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes || undefined,
        })),
      };
      
      if (existingWorkout) {
        // 既存のワークアウトを更新
        await workoutApi.updateWorkout(existingWorkout.id, workoutData as UpdateWorkoutRequest);
        Alert.alert(
          "完了",
          "ワークアウトを更新しました",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        // 新規ワークアウトを作成
        await workoutApi.createWorkout(workoutData as CreateWorkoutRequest);
        Alert.alert(
          "完了",
          "ワークアウトを作成しました",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error("ワークアウト保存エラー:", error);
      Alert.alert("エラー", `ワークアウトの${existingWorkout ? '更新' : '作成'}に失敗しました`);
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
          {existingWorkout ? "ワークアウト編集" : "ワークアウト作成"}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.container}>
        {/* 基本情報 */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>基本情報</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>ワークアウト名</Text>
            <Input
              placeholder="例: 胸・三頭筋トレーニング"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>予想時間（分）</Text>
              <Input
                placeholder="60"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>メモ</Text>
            <Input
              placeholder="ワークアウトの説明やメモ"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </Card>

        {/* エクササイズリスト */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>エクササイズ</Text>
            <TouchableOpacity onPress={addExercise} style={styles.addButton}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {exercises.map((exercise, index) => (
            <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.background }]}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseNumber, { color: colors.text }]}>
                  {index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => removeExercise(index)}
                  style={styles.removeButton}
                >
                  <Minus size={20} color={colors.error} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => openExerciseSelector(index)}
                style={[styles.exerciseSelector, { borderColor: colors.border }]}
              >
                <Dumbbell size={20} color={colors.text} />
                <Text style={[styles.exerciseName, { color: colors.text }]}>
                  {exercise.exercise?.name || "エクササイズを選択"}
                </Text>
              </TouchableOpacity>

              <View style={styles.exerciseDetails}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailGroup, { marginRight: 8 }]}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>セット数</Text>
                    <Input
                      value={exercise.set_count.toString()}
                      onChangeText={(value) => updateExerciseField(index, 'set_count', parseInt(value) || 3)}
                      keyboardType="numeric"
                      style={styles.smallInput}
                    />
                  </View>
                  <View style={[styles.detailGroup, { marginRight: 8 }]}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>レップ数</Text>
                    <Input
                      value={exercise.reps}
                      onChangeText={(value) => updateExerciseField(index, 'reps', value)}
                      placeholder="8-12"
                      style={styles.smallInput}
                    />
                  </View>
                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>重量</Text>
                    <Input
                      value={exercise.default_weight || ""}
                      onChangeText={(value) => updateExerciseField(index, 'default_weight', value)}
                      placeholder="80kg"
                      style={styles.smallInput}
                    />
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>休憩時間（秒）</Text>
                    <Input
                      value={exercise.rest_seconds.toString()}
                      onChangeText={(value) => updateExerciseField(index, 'rest_seconds', parseInt(value) || 60)}
                      keyboardType="numeric"
                      style={styles.smallInput}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>メモ</Text>
                  <Input
                    value={exercise.notes || ""}
                    onChangeText={(value) => updateExerciseField(index, 'notes', value)}
                    placeholder="エクササイズのメモ"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            </View>
          ))}
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            onPress={saveWorkout}
            isLoading={isSaving}
            style={styles.saveButton}
          >
            <Save size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>
              {existingWorkout ? "更新する" : "保存する"}
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
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
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
  exerciseCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  removeButton: {
    padding: 4,
  },
  exerciseSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
  },
  exerciseDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
  },
  detailGroup: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  smallInput: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
}); 