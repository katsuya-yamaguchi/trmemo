import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert } from "react-native"
import { useNavigation, NavigationProp } from "@react-navigation/native"
import { useTheme } from "../context/theme-context"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Play, Calendar, Award, TrendingUp, Clock } from "lucide-react-native"
import { homeApi } from "../services/api"
// import { HomeScreenData } from "../models/homeScreenModel"
import React from "react"

// ナビゲーションのパラメーター型を定義
type WorkoutType = {
  title: string;
  day: string;
  program: string;
  exercises: { name: string; sets: number; reps: number | string; }[];
  duration: string;
}

// HomeScreenData の仮の型定義を追加
// TODO: ../models/homeScreenModel.ts ファイルを作成し、正しい型定義をそこに移動する
type HomeScreenData = {
  todayWorkout: WorkoutType;
  weeklyProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  recentAchievement: {
    title: string;
    value: string;
    date: string;
  };
  trainingTip: {
    content: string;
  };
}

type RootStackParamList = {
  Home: undefined;
  TrainingDetail: { workout: WorkoutType };
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const { colors } = useTheme()
  const { user } = useAuth()
  const [homeData, setHomeData] = useState<HomeScreenData | null>(null)
  const [loading, setLoading] = useState(true)

  // ホーム画面データを取得
  useEffect(() => {
    async function fetchHomeData() {
      if (!user?.id) return
      
      try {
        setLoading(true)
        console.log("fetchHomeData: Calling homeApi.getHomeScreenData...");
        const data = await homeApi.getHomeScreenData()
        console.log("fetchHomeData: API call successful, setting data.");
        setHomeData(data)
      } catch (error) {
        console.error("ホーム画面データ取得エラー (raw object):", error);
        console.error("ホーム画面データ取得エラー (typeof):", typeof error);
        console.error("ホーム画面データ取得エラー (message property):", error?.message);
        console.error("ホーム画面データ取得エラー (toString):", error?.toString());
        
        Alert.alert("エラー", `データの取得に失敗しました: ${error?.message || '詳細不明'}`);
      } finally {
        console.log("fetchHomeData: finally block reached.");
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [user])

  const navigateToTraining = () => {
    if (!homeData) return
    
    navigation.navigate("TrainingDetail", { workout: homeData.todayWorkout })
  }

  // ローディング表示
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            こんにちは、{user?.email?.split("@")[0] || "ユーザー"}さん
          </Text>
          <Text style={[styles.date, { color: colors.text }]}>
            {new Date().toLocaleDateString("ja-JP", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
        </View>

        {homeData && (
          <>
            <Card style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.todayCardHeader}>
                <View>
                  <Text style={[styles.todayTitle, { color: colors.text }]}>今日のトレーニング</Text>
                  <Text style={[styles.programInfo, { color: colors.text }]}>
                    {homeData.todayWorkout.day} / {homeData.todayWorkout.program}
                  </Text>
                </View>
                <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
                  <Clock size={14} color="#fff" />
                  <Text style={styles.durationText}>{homeData.todayWorkout.duration}</Text>
                </View>
              </View>

              <Text style={[styles.workoutTitle, { color: colors.primary }]}>{homeData.todayWorkout.title}</Text>

              <View style={styles.exerciseList}>
                {homeData.todayWorkout.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                    <Text style={[styles.exerciseDetail, { color: colors.text }]}>
                      {exercise.sets}セット × {exercise.reps}回
                    </Text>
                  </View>
                ))}
              </View>

              <Button onPress={navigateToTraining} style={[styles.startButton, { backgroundColor: colors.primary }]}>
                <Play size={20} color="#fff" />
                <Text style={styles.startButtonText}>トレーニング開始</Text>
              </Button>
            </Card>

            <View style={styles.statsContainer}>
              <Card style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statHeader}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={[styles.statTitle, { color: colors.text }]}>今週の進捗</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${homeData.weeklyProgress.percentage}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {homeData.weeklyProgress.completed}/{homeData.weeklyProgress.total} 完了
                </Text>
              </Card>

              <Card style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statHeader}>
                  <Award size={20} color={colors.primary} />
                  <Text style={[styles.statTitle, { color: colors.text }]}>最近の達成</Text>
                </View>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>{homeData.recentAchievement.title}</Text>
                <View style={styles.achievementDetails}>
                  <Text style={[styles.achievementValue, { color: colors.primary }]}>
                    {homeData.recentAchievement.value}
                  </Text>
                  <Text style={[styles.achievementDate, { color: colors.text }]}>
                    {homeData.recentAchievement.date}
                  </Text>
                </View>
              </Card>
            </View>

            <Card style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.tipsHeader}>
                <TrendingUp size={20} color={colors.primary} />
                <Text style={[styles.tipsTitle, { color: colors.text }]}>今日のヒント</Text>
              </View>
              <Text style={[styles.tipText, { color: colors.text }]}>
                {homeData.trainingTip.content}
              </Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    opacity: 0.7,
  },
  todayCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  todayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  programInfo: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 5,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  exerciseList: {
    marginBottom: 20,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
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
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: "center",
  },
  achievementTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  achievementDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  achievementDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  tipsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
})