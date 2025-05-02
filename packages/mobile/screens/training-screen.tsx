import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/theme-context';
import { useAuth } from '../context/auth-context';
import { workoutApi } from '../services/api';
import { Card } from '../components/ui/card';
import { Calendar, ChevronRight, Dumbbell } from 'lucide-react-native';

// --- 型定義 (バックエンドのレスポンスに合わせる) ---
type ExerciseDetail = {
  id: string;
  name: string;
  sets: number;
  reps: string; // 例: "8-12"
};

type TrainingDay = {
  id: string;
  day_number: number;
  title: string;
  estimated_duration: number;
  exercises: ExerciseDetail[];
};

type TrainingPlan = {
  id: string;
  name: string;
  startDate?: string; // オプショナルに変更 (バックエンドのレスポンスによる)
  trainingDays: TrainingDay[];
};

// ナビゲーションの型定義
type RootStackParamList = {
  Training: undefined;
  TrainingDetail: { workout: any }; // TrainingDetail に渡す型を調整する必要あり
};
// --- ここまで型定義 ---

export default function TrainingScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // --- State の追加 ---
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- useEffect でデータを取得 ---
  useEffect(() => {
    const fetchTrainingPlan = async () => {
      if (!user?.id) {
        // ユーザーIDがない場合はエラー状態にしてローディング終了
        setError("ユーザー認証情報が見つかりません。");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data: TrainingPlan = await workoutApi.getTrainingPlan(user.id);
        // day_number でソートしておく
        if (data && data.trainingDays) {
            data.trainingDays.sort((a, b) => a.day_number - b.day_number);
        }
        setTrainingPlan(data);
      } catch (err: any) {
        console.error("Failed to fetch training plan:", err);
        const errorMessage = err.message || "トレーニングプランの取得に失敗しました";
        setError(errorMessage);
        Alert.alert("エラー", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingPlan();
  }, [user]); // user が変更された場合 (ログイン/ログアウト時など) に再取得

  // トレーニング詳細画面への遷移関数
  const navigateToWorkout = (day: TrainingDay) => {
     if (!trainingPlan) return;
    // TrainingDetailScreen が期待するデータ形式に変換
     const workoutDataForDetail = {
       title: day.title,
       day: `Day ${day.day_number}`,
       program: trainingPlan.name,
       exercises: day.exercises.map(ex => ({ name: ex.name, sets: ex.sets, reps: ex.reps })),
       duration: `${day.estimated_duration}分`
     };
     navigation.navigate("TrainingDetail", { workout: workoutDataForDetail });
  };

  // --- ローディングとエラー表示 ---
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>エラー: {error}</Text>
        {/* TODO: リトライボタンなどを追加 */}
      </SafeAreaView>
    );
  }

  if (!trainingPlan) {
      return (
          <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <Text style={[{ color: colors.text }]}>トレーニングプランが見つかりません。</Text>
              {/* TODO: プラン作成への導線などを追加 */}
          </SafeAreaView>
      );
  }
  // --- ここまで ---

  // アクティブなタブに対応するトレーニング日を取得
  // trainingDays はソート済みと仮定
  const activeDay = trainingPlan.trainingDays[activeTab];
  // 休息日かどうかを判定 (例: exercises が空 or title が "休息日")
  const isRestDay = !activeDay || activeDay.exercises.length === 0 || activeDay.title.includes("休息日");


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>トレーニングプラン</Text>
          <View style={styles.programInfo}>
            <Text style={[styles.programTitle, { color: colors.text }]}>{trainingPlan.name}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {trainingPlan.trainingDays.map((day, index) => (
            <TouchableOpacity
              key={day.id}
              style={[
                  styles.tab,
                  activeTab === index && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
              ]}
              onPress={() => setActiveTab(index)}
            >
              <Text style={[styles.tabText, { color: activeTab === index ? "#fff" : colors.text }]}>
                Day {day.day_number}
              </Text>
              <Text style={[styles.tabSubtext, { color: activeTab === index ? "#fff" : colors.text, opacity: 0.7 }]}>
                {day.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.workoutContainer}>
          {activeDay && !isRestDay ? (
            <Card style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTitleContainer}>
                  <Dumbbell size={20} color={colors.primary} />
                  <Text style={[styles.workoutTitle, { color: colors.text }]}>{activeDay.title}</Text>
                </View>
                <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.durationText}>{activeDay.estimated_duration}分</Text>
                </View>
              </View>

              <View style={styles.exerciseList}>
                {activeDay.exercises.map((exercise, index) => (
                  <View
                    key={exercise.id}
                    style={[
                      styles.exerciseItem,
                      index < activeDay.exercises.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                    <Text style={[styles.exerciseDetail, { color: colors.text }]}>
                      {exercise.sets}セット × {exercise.reps}回
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={() => navigateToWorkout(activeDay)}
              >
                <Text style={styles.startButtonText}>トレーニング開始</Text>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={[styles.restDayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.restDayContent}>
                <Calendar size={40} color={colors.primary} />
                <Text style={[styles.restDayTitle, { color: colors.text }]}>休息日</Text>
                <Text style={[styles.restDayText, { color: colors.text }]}>
                  今日は休息日です。筋肉の回復を促すために、軽いストレッチやウォーキングがおすすめです。
                </Text>
              </View>
            </Card>
          )}
        </View>

        <View style={styles.programsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>その他のプログラム</Text>

          <Card style={[styles.programCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.programCardTitle, { color: colors.text }]}>体重減量プログラム</Text>
            <Text style={[styles.programCardDescription, { color: colors.text }]}>
              有酸素運動と筋トレを組み合わせた6週間プログラム
            </Text>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={[styles.viewButtonText, { color: colors.primary }]}>詳細を見る</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </Card>

          <Card style={[styles.programCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.programCardTitle, { color: colors.text }]}>上級者向け筋肥大プログラム</Text>
            <Text style={[styles.programCardDescription, { color: colors.text }]}>
              高強度・高ボリュームの12週間プログラム
            </Text>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={[styles.viewButtonText, { color: colors.primary }]}>詳細を見る</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  programInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  programTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tabsContent: {
    paddingRight: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 100,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  workoutContainer: {
    marginBottom: 30,
  },
  workoutCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  workoutTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  exerciseList: {
    marginBottom: 20,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  exerciseName: {
    fontSize: 16,
  },
  exerciseDetail: {
    fontSize: 14,
    opacity: 0.8,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 5,
  },
  restDayCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  restDayContent: {
    alignItems: "center",
    padding: 20,
  },
  restDayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  restDayText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  programsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  programCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  programCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  programCardDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 10,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 5,
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
  },
})

