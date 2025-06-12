import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { useTheme } from "../context/theme-context";
import { useAuth } from "../context/auth-context";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { CheckCircle, Clock, Play, Pause, RotateCcw, ArrowLeft, Edit3, Dumbbell } from "lucide-react-native";
import { workoutApi } from "../services/api";
import { Workout } from "../types/workout";

// ルートパラメータの型定義
type WorkoutDetailParams = {
  WorkoutDetail: {
    workout: Workout;
  };
};

type WorkoutDetailScreenRouteProp = RouteProp<WorkoutDetailParams, 'WorkoutDetail'>;

// セット記録の型
interface SetRecord {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
}

// エクササイズ記録の型
interface ExerciseRecord {
  exerciseId: string;
  sets: SetRecord[];
}

export default function WorkoutDetailScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const route = useRoute<WorkoutDetailScreenRouteProp>();
  const workout = route.params.workout;

  // State
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // タイマー用のuseEffect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutStarted && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutStarted, startTime]);

  // エクササイズ記録を初期化
  useEffect(() => {
    const initialRecords: ExerciseRecord[] = workout.exercises.map(exercise => ({
      exerciseId: exercise.id,
      sets: Array.from({ length: exercise.set_count }, (_, index) => ({
        setNumber: index + 1,
        weight: exercise.default_weight || "",
        reps: "",
        completed: false,
      })),
    }));
    setExerciseRecords(initialRecords);
  }, [workout]);

  // ワークアウト開始
  const startWorkout = () => {
    setIsWorkoutStarted(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  // ワークアウト一時停止/再開
  const toggleWorkout = () => {
    if (isWorkoutStarted) {
      setIsWorkoutStarted(false);
    } else {
      setIsWorkoutStarted(true);
      if (startTime) {
        const pausedDuration = elapsedTime;
        setStartTime(new Date(Date.now() - pausedDuration * 1000));
      }
    }
  };

  // ワークアウト完了
  const completeWorkout = () => {
    const completedSets = exerciseRecords.reduce((total, record) => {
      return total + record.sets.filter(set => set.completed).length;
    }, 0);

    if (completedSets === 0) {
      Alert.alert("確認", "セットが記録されていませんが、ワークアウトを完了しますか？", [
        { text: "キャンセル", style: "cancel" },
        { text: "完了", onPress: finishWorkout },
      ]);
    } else {
      finishWorkout();
    }
  };

  // ワークアウト終了処理
  const finishWorkout = () => {
    Alert.alert(
      "ワークアウト完了！",
      `お疲れ様でした！\n時間: ${formatTime(elapsedTime)}`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  // セット記録を更新
  const updateSetRecord = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseRecords(prev => prev.map(record => {
      if (record.exerciseId === exerciseId) {
        const updatedSets = [...record.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: value,
        };
        return { ...record, sets: updatedSets };
      }
      return record;
    }));
  };

  // セット完了をトグル
  const toggleSetCompletion = (exerciseId: string, setIndex: number) => {
    setExerciseRecords(prev => prev.map(record => {
      if (record.exerciseId === exerciseId) {
        const updatedSets = [...record.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          completed: !updatedSets[setIndex].completed,
        };
        return { ...record, sets: updatedSets };
      }
      return record;
    }));
  };

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // エクササイズ記録を取得
  const getExerciseRecord = (exerciseId: string): ExerciseRecord | undefined => {
    return exerciseRecords.find(record => record.exerciseId === exerciseId);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{workout.title}</Text>
        <TouchableOpacity
          onPress={() => {
            (navigation as any).navigate("CreateWorkout", { workout });
          }}
          style={styles.editButton}
        >
          <Edit3 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* ワークアウト情報 */}
        <Card style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.workoutInfo}>
            <View style={styles.infoItem}>
              <Dumbbell size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {workout.exercises.length} エクササイズ
              </Text>
            </View>
            {workout.estimated_duration && (
              <View style={styles.infoItem}>
                <Clock size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  約 {workout.estimated_duration} 分
                </Text>
              </View>
            )}
          </View>

          {workout.notes && (
            <Text style={[styles.workoutNotes, { color: colors.text }]}>
              {workout.notes}
            </Text>
          )}
        </Card>

        {/* タイマー */}
        {isWorkoutStarted && (
          <Card style={[styles.timerCard, { backgroundColor: colors.primary }]}>
            <View style={styles.timerContent}>
              <Clock size={24} color="#fff" />
              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
              <TouchableOpacity onPress={toggleWorkout} style={styles.timerButton}>
                {isWorkoutStarted ? (
                  <Pause size={20} color="#fff" />
                ) : (
                  <Play size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* エクササイズリスト */}
        {workout.exercises.map((exercise, exerciseIndex) => {
          const record = getExerciseRecord(exercise.id);
          const completedSets = record?.sets.filter(set => set.completed).length || 0;

          return (
            <Card key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.card }]}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseNumber, { color: colors.primary }]}>
                    {exerciseIndex + 1}
                  </Text>
                  <View style={styles.exerciseDetails}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.exercise?.name || `エクササイズ ${exerciseIndex + 1}`}
                    </Text>
                    <Text style={[styles.exerciseTarget, { color: colors.text, opacity: 0.7 }]}>
                      {exercise.set_count} セット × {exercise.reps}
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.progressText}>
                    {completedSets}/{exercise.set_count}
                  </Text>
                </View>
              </View>

              {exercise.notes && (
                <Text style={[styles.exerciseNotes, { color: colors.text, opacity: 0.8 }]}>
                  {exercise.notes}
                </Text>
              )}

              {/* セット記録 */}
              <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                  <Text style={[styles.setsHeaderText, { color: colors.text }]}>セット</Text>
                  <Text style={[styles.setsHeaderText, { color: colors.text }]}>重量</Text>
                  <Text style={[styles.setsHeaderText, { color: colors.text }]}>レップ</Text>
                  <Text style={[styles.setsHeaderText, { color: colors.text }]}>完了</Text>
                </View>

                {record?.sets.map((set, setIndex) => (
                  <View key={setIndex} style={[styles.setRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.setNumber, { color: colors.text }]}>
                      {set.setNumber}
                    </Text>
                    <Input
                      value={set.weight}
                      onChangeText={(value) => updateSetRecord(exercise.id, setIndex, 'weight', value)}
                      placeholder="kg"
                      keyboardType="numeric"
                      style={styles.setInput}
                      editable={isWorkoutStarted}
                    />
                    <Input
                      value={set.reps}
                      onChangeText={(value) => updateSetRecord(exercise.id, setIndex, 'reps', value)}
                      placeholder="回"
                      keyboardType="numeric"
                      style={styles.setInput}
                      editable={isWorkoutStarted}
                    />
                    <TouchableOpacity
                      onPress={() => toggleSetCompletion(exercise.id, setIndex)}
                      style={[
                        styles.checkButton,
                        set.completed && { backgroundColor: colors.primary }
                      ]}
                      disabled={!isWorkoutStarted}
                    >
                      <CheckCircle
                        size={20}
                        color={set.completed ? "#fff" : colors.text}
                        style={{ opacity: set.completed ? 1 : 0.3 }}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* 休憩時間 */}
              {exercise.rest_seconds > 0 && (
                <View style={styles.restInfo}>
                  <RotateCcw size={14} color={colors.text} style={{ opacity: 0.7 }} />
                  <Text style={[styles.restText, { color: colors.text, opacity: 0.7 }]}>
                    休憩: {Math.floor(exercise.rest_seconds / 60)}分{exercise.rest_seconds % 60}秒
                  </Text>
                </View>
              )}
            </Card>
          );
        })}

        {/* アクションボタン */}
        <View style={styles.actionButtons}>
          {!isWorkoutStarted ? (
            <Button onPress={startWorkout} style={styles.startButton}>
              <Play size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>ワークアウト開始</Text>
            </Button>
          ) : (
            <View style={styles.workoutActions}>
              <Button
                onPress={toggleWorkout}
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              >
                {isWorkoutStarted ? (
                  <>
                    <Pause size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>一時停止</Text>
                  </>
                ) : (
                  <>
                    <Play size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>再開</Text>
                  </>
                )}
              </Button>
              <Button onPress={completeWorkout} style={styles.actionButton}>
                <CheckCircle size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>完了</Text>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
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
    flex: 1,
    textAlign: "center",
  },
  editButton: {
    padding: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  workoutInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
  },
  workoutNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  timerCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  timerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  timerButton: {
    padding: 8,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 12,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  exerciseTarget: {
    fontSize: 12,
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  exerciseNotes: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: "italic",
  },
  setsContainer: {
    marginTop: 8,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  setsHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  setInput: {
    flex: 1,
    marginHorizontal: 4,
    fontSize: 14,
  },
  checkButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    borderRadius: 4,
  },
  restInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  restText: {
    fontSize: 12,
  },
  actionButtons: {
    marginTop: 24,
    marginBottom: 32,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  workoutActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
}); 