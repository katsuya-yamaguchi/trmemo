import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert } from "react-native"
import { useNavigation, NavigationProp } from "@react-navigation/native"
import { useTheme } from "../context/theme-context"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { BodyStatsInputModal } from "../components/ui/body-stats-input-modal"
import { Play, Calendar, Clock, Scale, Plus } from "lucide-react-native"
import { homeApi, userApi } from "../services/api"
import { LatestBodyStats } from "../types/body-stats"
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
  const [bodyStats, setBodyStats] = useState<LatestBodyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBodyStatsModal, setShowBodyStatsModal] = useState(false)

  // データを取得する共通関数
  const fetchData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      console.log("fetchData: Calling APIs...");
      
      // ホームデータと体重データを並行取得
      const [homeResponse, bodyStatsResponse] = await Promise.all([
        homeApi.getHomeScreenData(),
        userApi.getLatestBodyStats()
      ]);
      
      console.log("fetchData: API call successful, setting data.");
      setHomeData(homeResponse)
      setBodyStats(bodyStatsResponse)
    } catch (error: any) {
      console.error("データ取得エラー:", error);
      Alert.alert("エラー", `データの取得に失敗しました: ${error?.message || '詳細不明'}`);
    } finally {
      console.log("fetchData: finally block reached.");
      setLoading(false)
    }
  };

  // ホーム画面データを取得
  useEffect(() => {
    fetchData()
  }, [user])

  // 体重記録後のデータリフレッシュ
  const handleBodyStatsUpdate = async () => {
    try {
      const bodyStatsResponse = await userApi.getLatestBodyStats();
      console.log('取得した体重データ:', bodyStatsResponse);
      setBodyStats(bodyStatsResponse);
    } catch (error: any) {
      console.error("体重データリフレッシュエラー:", error);
    }
  };

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

            {/* 体重・体脂肪率カード */}
            <Card style={[styles.bodyStatsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.bodyStatsHeader}>
                <View style={styles.bodyStatsTitle}>
                  <Scale size={20} color={colors.primary} />
                  <Text style={[styles.bodyStatsTitleText, { color: colors.text }]}>体重・体脂肪率</Text>
                </View>
                <Button 
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowBodyStatsModal(true)}
                >
                  <Plus size={16} color="#fff" />
                </Button>
              </View>

              {bodyStats ? (
                <View style={styles.bodyStatsContent}>
                  {/* 体重表示 */}
                  <View style={styles.bodyStatRow}>
                    <Text style={[styles.bodyStatLabel, { color: colors.text }]}>体重</Text>
                    <View style={styles.bodyStatValue}>
                      <Text style={[styles.bodyStatNumber, { color: colors.text }]}>
                        {bodyStats.weight.toFixed(1)}
                      </Text>
                      <Text style={[styles.bodyStatUnit, { color: colors.text }]}>kg</Text>
                      {bodyStats.weightChange !== undefined && (
                        <View style={[
                          styles.changeIndicator,
                          { backgroundColor: bodyStats.weightChange >= 0 ? '#10B981' : '#EF4444' }
                        ]}>
                          <Text style={styles.changeText}>
                            {bodyStats.weightChange >= 0 ? '+' : ''}{bodyStats.weightChange.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 体脂肪率表示 */}
                  <View style={styles.bodyStatRow}>
                    <Text style={[styles.bodyStatLabel, { color: colors.text }]}>体脂肪率</Text>
                    <View style={styles.bodyStatValue}>
                      {(() => {
                        console.log('体脂肪率判定:', {
                          bodyFat: bodyStats.bodyFat,
                          bodyFatType: typeof bodyStats.bodyFat,
                          bodyFatChange: bodyStats.bodyFatChange,
                          previousBodyFat: bodyStats.previousBodyFat,
                          fullBodyStats: bodyStats
                        });
                        
                        if (bodyStats.bodyFat) {
                          // 現在の体脂肪率が記録されている場合
                          return (
                            <>
                              <Text style={[styles.bodyStatNumber, { color: colors.text }]}>
                                {bodyStats.bodyFat.toFixed(1)}
                              </Text>
                              <Text style={[styles.bodyStatUnit, { color: colors.text }]}>%</Text>
                              {bodyStats.bodyFatChange !== undefined && (
                                <View style={[
                                  styles.changeIndicator,
                                  { backgroundColor: bodyStats.bodyFatChange <= 0 ? '#10B981' : '#EF4444' }
                                ]}>
                                  <Text style={styles.changeText}>
                                    {bodyStats.bodyFatChange >= 0 ? '+' : ''}{bodyStats.bodyFatChange.toFixed(1)}
                                  </Text>
                                </View>
                              )}
                            </>
                          );
                        } else if (bodyStats.previousBodyFat) {
                          // 現在は未記録だが、前回の記録がある場合
                          return (
                            <View style={styles.previousDataContainer}>
                              <Text style={[styles.bodyStatNumber, { color: colors.text, opacity: 0.5 }]}>
                                {bodyStats.previousBodyFat.toFixed(1)}%
                              </Text>
                              <Text style={[styles.previousDataLabel, { color: colors.text }]}>
                                (前回)
                              </Text>
                            </View>
                          );
                        } else {
                          // 完全に未記録の場合
                          return (
                            <Text style={[styles.bodyStatNumber, { color: colors.text, opacity: 0.5 }]}>
                              未記録
                            </Text>
                          );
                        }
                      })()}
                    </View>
                  </View>

                  <Text style={[styles.lastRecordedText, { color: colors.text }]}>
                    最終記録: {new Date(bodyStats.recordedDate).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={[styles.noDataText, { color: colors.text }]}>
                    まだ記録がありません
                  </Text>
                  <Text style={[styles.noDataSubText, { color: colors.text }]}>
                    ＋ボタンから体重を記録しましょう
                  </Text>
                </View>
              )}
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
            </View>
          </>
        )}
      </ScrollView>
      
      {/* 体重・体脂肪率記録モーダル */}
      <BodyStatsInputModal
        visible={showBodyStatsModal}
        onClose={() => setShowBodyStatsModal(false)}
        onSave={handleBodyStatsUpdate}
      />
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
    width: "100%",
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
  bodyStatsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  bodyStatsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bodyStatsTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyStatsTitleText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
  },
  bodyStatsContent: {
    marginTop: 10,
  },
  bodyStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bodyStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyStatLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
    minWidth: 70,
  },
  bodyStatValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyStatNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bodyStatUnit: {
    fontSize: 12,
    opacity: 0.7,
  },
  changeIndicator: {
    padding: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  lastRecordedText: {
    fontSize: 12,
    opacity: 0.7,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    opacity: 0.7,
  },
  previousDataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  previousDataLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 5,
  },
})