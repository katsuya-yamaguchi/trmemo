import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/theme-context';
import { useAuth } from '../context/auth-context';
import { workoutApi } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, ChevronRight, Dumbbell, Edit2, Plus } from 'lucide-react-native';
import { Workout } from '../types/workout';

export default function NewTrainingScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { colors } = useTheme();
  const { user } = useAuth();

  // State
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ワークアウト一覧を取得
  const fetchWorkouts = useCallback(async () => {
    if (!user?.id) {
      setError("ユーザー認証情報が見つかりません。");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await workoutApi.getWorkouts();
      setWorkouts(response.workouts || []);
    } catch (err: any) {
      console.error("Failed to fetch workouts:", err);
      const errorMessage = err.message || "ワークアウトの取得に失敗しました";
      setError(errorMessage);
      Alert.alert("エラー", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts])
  );

  // ワークアウト詳細画面への遷移
  const navigateToWorkout = (workout: Workout) => {
    navigation.navigate("WorkoutDetail", { workout });
  };

  // ワークアウト編集
  const handleEditWorkout = (workout: Workout) => {
    navigation.navigate("CreateWorkout", { workout });
  };

  // ワークアウト削除
  const handleDeleteWorkout = async (workoutId: string) => {
    Alert.alert(
      "ワークアウトを削除",
      "このワークアウトを削除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await workoutApi.deleteWorkout(workoutId);
              Alert.alert("完了", "ワークアウトを削除しました");
              fetchWorkouts(); // リストを再取得
            } catch (error: any) {
              console.error("Delete workout error:", error);
              Alert.alert("エラー", "ワークアウトの削除に失敗しました");
            }
          },
        },
      ]
    );
  };

  // ローディング表示
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // エラー表示
  if (error) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>エラー: {error}</Text>
        <Button onPress={fetchWorkouts} style={{ marginTop: 16 }}>
          再試行
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>ワークアウト</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateWorkout", {})}
            style={[styles.createButton, { backgroundColor: colors.primary }]}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.createButtonText}>新規作成</Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Dumbbell size={48} color={colors.text} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              ワークアウトがありません
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text, opacity: 0.7 }]}>
              最初のワークアウトを作成しましょう
            </Text>
            <Button
              onPress={() => navigation.navigate("CreateWorkout", {})}
              style={{ marginTop: 16 }}
            >
              ワークアウトを作成
            </Button>
          </View>
        ) : (
          <View style={styles.workoutsList}>
            {workouts.map((workout) => (
              <Card
                key={workout.id}
                style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <TouchableOpacity
                  onPress={() => navigateToWorkout(workout)}
                  style={styles.workoutCardContent}
                >
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutTitleContainer}>
                      <Dumbbell size={20} color={colors.primary} />
                      <Text style={[styles.workoutTitle, { color: colors.text }]}>
                        {workout.title}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.text} style={{ opacity: 0.5 }} />
                  </View>

                  <View style={styles.workoutInfo}>
                    <View style={styles.infoItem}>
                      <Calendar size={14} color={colors.text} style={{ opacity: 0.7 }} />
                      <Text style={[styles.infoText, { color: colors.text, opacity: 0.7 }]}>
                        {workout.exercises.length} エクササイズ
                      </Text>
                    </View>
                    {workout.estimated_duration && (
                      <View style={styles.infoItem}>
                        <Text style={[styles.infoText, { color: colors.text, opacity: 0.7 }]}>
                          約 {workout.estimated_duration} 分
                        </Text>
                      </View>
                    )}
                  </View>

                  {workout.notes && (
                    <Text style={[styles.workoutNotes, { color: colors.text, opacity: 0.8 }]} numberOfLines={2}>
                      {workout.notes}
                    </Text>
                  )}

                  <View style={styles.exercisesList}>
                    {workout.exercises.slice(0, 3).map((exercise, index) => (
                      <Text
                        key={exercise.id}
                        style={[styles.exerciseItem, { color: colors.text, opacity: 0.6 }]}
                        numberOfLines={1}
                      >
                        {index + 1}. {exercise.exercise?.name || `エクササイズ ${index + 1}`}
                      </Text>
                    ))}
                    {workout.exercises.length > 3 && (
                      <Text style={[styles.exerciseItem, { color: colors.text, opacity: 0.6 }]}>
                        他 {workout.exercises.length - 3} 種目
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.workoutActions}>
                  <TouchableOpacity
                    onPress={() => handleEditWorkout(workout)}
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  >
                    <Edit2 size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>編集</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteWorkout(workout.id)}
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                  >
                    <Text style={styles.actionButtonText}>削除</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  workoutsList: {
    gap: 16,
  },
  workoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  workoutCardContent: {
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
  },
  workoutNotes: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  exercisesList: {
    gap: 4,
  },
  exerciseItem: {
    fontSize: 12,
  },
  workoutActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 