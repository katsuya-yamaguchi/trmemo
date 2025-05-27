import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert, Modal, TextInput } from "react-native"
import { useTheme } from "../context/theme-context"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/card"
import { LineChart, BarChart } from "react-native-chart-kit"
import { Calendar, Share2, ChevronDown, ChevronRight, ChevronLeft, TrendingUp } from "lucide-react-native"
import { workoutApi } from "../services/api"

// Type definitions for state
interface ChartDataset {
  data: number[];
  color?: (opacity: number) => string;
  strokeWidth?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  legend?: string[];
}

interface WeightStats {
  change: number;
}

interface StrengthStats {
  maxWeights: { name: string; weight: number }[];
}

interface WorkoutCountStats {
  total: number;
  target: number;
}

type ProgressStats = WeightStats | StrengthStats | WorkoutCountStats | null;

interface WorkoutHistoryItem {
  id?: string; // Assuming id might exist for key or navigation
  date: string;
  title: string;
  highlights: string;
  exercises: number;
}

interface ExerciseHistoryStats {
  maxWeight: number;
  totalReps: number;
  estimatedOneRM: number;
  lastWorkoutDate: string;
  comparison?: {
    maxWeightChange: number;
    totalRepsChange: number;
    oneRMChange: number;
  };
}

interface ExerciseOption {
  id: string;
  name: string;
}

interface ExerciseHistoryDetail {
  date: string;
  sets: {
    weight: number;
    reps: number;
    volume: number;
  }[];
  totalVolume: number;
  maxWeight: number;
}

export default function ProgressScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("weight") // 'weight', 'strength', 'workouts', 'exercise-history'
  const [timeRange, setTimeRange] = useState("month") // 'week', 'month', 'year'
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [stats, setStats] = useState<ProgressStats>(null)
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // 種目別履歴用の新しいステート
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null)
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([])
  const [exerciseStats, setExerciseStats] = useState<ExerciseHistoryStats | null>(null)
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState(new Date())
  const [exerciseHistoryDetails, setExerciseHistoryDetails] = useState<ExerciseHistoryDetail[]>([])
  const [showDetailsList, setShowDetailsList] = useState(false)
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("")

  const screenWidth = Dimensions.get("window").width - 40

  // 種目検索のフィルタリング
  const filteredExerciseOptions = exerciseOptions.filter(exercise =>
    exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
  )

  // 進捗データを取得
  useEffect(() => {
    async function fetchProgressData() {
      if (!user?.id || activeTab === "exercise-history") return
      
      try {
        setLoading(true)
        const response = await workoutApi.getProgressData(activeTab, timeRange)
        setChartData(response.chartData)
        setStats(response.stats)
      } catch (error) {
        console.error("進捗データ取得エラー:", error)
        Alert.alert("エラー", "進捗データの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchProgressData()
  }, [user, activeTab, timeRange])

  // ワークアウト履歴を取得
  useEffect(() => {
    async function fetchWorkoutHistory() {
      if (!user?.id) return
      
      try {
        const history = await workoutApi.getWorkoutHistory(5, 0)
        setWorkoutHistory(history)
      } catch (error) {
        console.error("ワークアウト履歴取得エラー:", error)
      }
    }

    fetchWorkoutHistory()
  }, [user])

  // 種目オプションを取得
  useEffect(() => {
    async function fetchExerciseOptions() {
      if (!user?.id || activeTab !== "exercise-history") return
      
      try {
        setLoading(true)
        const exercises = await workoutApi.getUserExercises()
        setExerciseOptions(exercises || [])
        if (exercises && exercises.length > 0) {
          setSelectedExercise(exercises[0])
        }
      } catch (error) {
        console.error("種目オプション取得エラー:", error)
        Alert.alert("エラー", "種目一覧の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchExerciseOptions()
  }, [user, activeTab])

  // 種目別統計データを取得
  useEffect(() => {
    async function fetchExerciseStats() {
      if (!user?.id || !selectedExercise || activeTab !== "exercise-history") return
      
      try {
        setLoading(true)
        const year = currentPeriod.getFullYear()
        const month = timeRange === "month" ? currentPeriod.getMonth() + 1 : undefined
        
        const response = await workoutApi.getExerciseHistory(
          selectedExercise.id,
          timeRange,
          year,
          month
        )
        
        setExerciseStats(response.stats)
        setChartData(response.chartData)
        
        // 詳細履歴データも取得（実際のAPIでは別エンドポイントまたは拡張レスポンス）
        if (response.details) {
          setExerciseHistoryDetails(response.details)
        }
      } catch (error) {
        console.error("種目別統計取得エラー:", error)
        Alert.alert("エラー", "種目別履歴の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchExerciseStats()
  }, [user, selectedExercise, activeTab, timeRange, currentPeriod])

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: () => colors.text,
    labelColor: () => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  }

  const renderChart = () => {
    if (!chartData || !chartData.labels || !chartData.datasets) {
      return <Text style={[styles.noDataText, { color: colors.text }]}>データがありません</Text>
    }

    switch (activeTab) {
      case "weight":
        return (
          <LineChart
            data={chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisSuffix="kg"
          />
        )
      case "strength":
        return (
          <BarChart
            data={chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisSuffix="kg"
            yAxisLabel=""
          />
        )
      case "workouts":
        return (
          <BarChart
            data={chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisSuffix="回"
            yAxisLabel=""
          />
        )
      default:
        return null
    }
  }

  const handleTimeRangeChange = () => {
    // モーダルや選択UIを表示して期間を選択
    Alert.alert(
      "期間選択",
      "表示する期間を選択してください",
      [
        { text: "1週間", onPress: () => setTimeRange("week") },
        { text: "1ヶ月", onPress: () => setTimeRange("month") },
        { text: "1年", onPress: () => setTimeRange("year") },
        { text: "キャンセル", style: "cancel" }
      ]
    )
  }

  const handleShare = () => {
    // 実際のアプリでは共有機能を実装
    Alert.alert("シェア", "進捗をシェアしました！")
  }

  const renderExerciseHistoryContent = () => {
    if (!selectedExercise) {
      return (
        <Card style={[styles.exerciseSelectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noDataText, { color: colors.text }]}>
            {exerciseOptions.length === 0 ? "実行した種目がありません" : "種目を選択してください"}
          </Text>
        </Card>
      )
    }

    return (
      <>
        {/* 種目選択 */}
        <Card style={[styles.exerciseSelectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.exerciseSelectButton}
            onPress={() => setExerciseModalVisible(true)}
          >
            <Text style={[styles.exerciseSelectText, { color: colors.text }]}>
              {selectedExercise.name}
            </Text>
            <ChevronDown size={20} color={colors.text} />
          </TouchableOpacity>
        </Card>

        {/* 期間ナビゲーション */}
        <Card style={[styles.periodNavCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.periodNavContainer}>
            <TouchableOpacity 
              style={styles.periodNavButton}
              onPress={() => {
                const newDate = new Date(currentPeriod)
                if (timeRange === "month") {
                  newDate.setMonth(newDate.getMonth() - 1)
                } else if (timeRange === "year") {
                  newDate.setFullYear(newDate.getFullYear() - 1)
                }
                setCurrentPeriod(newDate)
              }}
            >
              <ChevronLeft size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleTimeRangeChangeForExercise}>
              <Text style={[styles.periodText, { color: colors.text }]}>
                {timeRange === "month" 
                  ? `${currentPeriod.getFullYear()}年${currentPeriod.getMonth() + 1}月`
                  : `${currentPeriod.getFullYear()}年`
                }
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.periodNavButton}
              onPress={() => {
                const newDate = new Date(currentPeriod)
                const now = new Date()
                
                if (timeRange === "month") {
                  newDate.setMonth(newDate.getMonth() + 1)
                  // 未来の月は選択できないように制限
                  if (newDate <= now) {
                    setCurrentPeriod(newDate)
                  }
                } else if (timeRange === "year") {
                  newDate.setFullYear(newDate.getFullYear() + 1)
                  // 未来の年は選択できないように制限
                  if (newDate.getFullYear() <= now.getFullYear()) {
                    setCurrentPeriod(newDate)
                  }
                }
              }}
            >
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* 統計サマリー */}
        {exerciseStats ? (
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TrendingUp size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{exerciseStats.maxWeight}kg</Text>
              <Text style={[styles.statLabel, { color: colors.text + "80" }]}>最高重量</Text>
              {exerciseStats.comparison && (
                <Text style={[
                  styles.comparisonText, 
                  { color: exerciseStats.comparison.maxWeightChange >= 0 ? colors.success || '#10B981' : colors.error || '#EF4444' }
                ]}>
                  {exerciseStats.comparison.maxWeightChange >= 0 ? '+' : ''}{exerciseStats.comparison.maxWeightChange}kg
                </Text>
              )}
            </Card>
            
            <Card style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{exerciseStats.totalReps}</Text>
              <Text style={[styles.statLabel, { color: colors.text + "80" }]}>総レップ数</Text>
              {exerciseStats.comparison && (
                <Text style={[
                  styles.comparisonText, 
                  { color: exerciseStats.comparison.totalRepsChange >= 0 ? colors.success || '#10B981' : colors.error || '#EF4444' }
                ]}>
                  {exerciseStats.comparison.totalRepsChange >= 0 ? '+' : ''}{exerciseStats.comparison.totalRepsChange}
                </Text>
              )}
            </Card>
            
            <Card style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{exerciseStats.estimatedOneRM}kg</Text>
              <Text style={[styles.statLabel, { color: colors.text + "80" }]}>推定1RM</Text>
              {exerciseStats.comparison && (
                <Text style={[
                  styles.comparisonText, 
                  { color: exerciseStats.comparison.oneRMChange >= 0 ? colors.success || '#10B981' : colors.error || '#EF4444' }
                ]}>
                  {exerciseStats.comparison.oneRMChange >= 0 ? '+' : ''}{exerciseStats.comparison.oneRMChange}kg
                </Text>
              )}
            </Card>
          </View>
        ) : (
          <Card style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noDataText, { color: colors.text }]}>
              {loading ? "データを読み込み中..." : "この期間にデータがありません"}
            </Text>
          </Card>
        )}

        {/* グラフ */}
        <Card style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>重量の推移</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            renderChart()
          )}
        </Card>

        {renderExerciseHistoryDetails()}
      </>
    )
  }

  // 期間選択の改善
  const handleTimeRangeChangeForExercise = () => {
    Alert.alert(
      "期間選択",
      "表示する期間を選択してください",
      [
        { text: "月別", onPress: () => setTimeRange("month") },
        { text: "年別", onPress: () => setTimeRange("year") },
        { text: "キャンセル", style: "cancel" }
      ]
    )
  }

  // 詳細履歴リストのレンダリング
  const renderExerciseHistoryDetails = () => {
    if (!exerciseHistoryDetails || exerciseHistoryDetails.length === 0) {
      return (
        <Card style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noDataText, { color: colors.text }]}>この期間にデータがありません</Text>
        </Card>
      )
    }

    return (
      <Card style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.detailsHeader}>
          <Text style={[styles.detailsTitle, { color: colors.text }]}>詳細履歴</Text>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowDetailsList(!showDetailsList)}
          >
            <Text style={styles.toggleButtonText}>
              {showDetailsList ? "非表示" : "表示"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showDetailsList && (
          <ScrollView style={styles.detailsList} nestedScrollEnabled>
            {exerciseHistoryDetails.map((detail, index) => (
              <View key={index} style={[styles.detailItem, { borderBottomColor: colors.border }]}>
                <View style={styles.detailItemHeader}>
                  <Text style={[styles.detailDate, { color: colors.text }]}>{detail.date}</Text>
                  <View style={styles.detailSummaryContainer}>
                    <Text style={[styles.detailSummary, { color: colors.text }]}>
                      {detail.sets.length}セット
                    </Text>
                    <Text style={[styles.detailVolume, { color: colors.primary }]}>
                      {detail.totalVolume}kg
                    </Text>
                  </View>
                </View>
                
                <View style={styles.setsContainer}>
                  {detail.sets.map((set, setIndex) => (
                    <View key={setIndex} style={[styles.setItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.setText, { color: colors.text }]}>
                        {set.weight}kg × {set.reps}回
                      </Text>
                      <Text style={[styles.volumeText, { color: colors.text + "80" }]}>
                        = {set.volume}kg
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </Card>
    )
  }

  // ローディング表示
  if (loading && !chartData) {
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
          <Text style={[styles.title, { color: colors.text }]}>進捗</Text>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShare}>
            <Share2 size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, { borderColor: colors.border }]}
            onPress={activeTab === "exercise-history" ? handleTimeRangeChangeForExercise : handleTimeRangeChange}
          >
            <Text style={[styles.filterText, { color: colors.text }]}>
              期間: {timeRange === "week" ? "1週間" : timeRange === "month" ? "1ヶ月" : "1年"}
            </Text>
            <ChevronDown size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "weight" && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab("weight")}
          >
            <Text style={[styles.tabText, { color: activeTab === "weight" ? "#fff" : colors.text }]}>体重</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "strength" && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab("strength")}
          >
            <Text style={[styles.tabText, { color: activeTab === "strength" ? "#fff" : colors.text }]}>筋力</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "workouts" && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab("workouts")}
          >
            <Text style={[styles.tabText, { color: activeTab === "workouts" ? "#fff" : colors.text }]}>
              トレーニング数
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "exercise-history" && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab("exercise-history")}
          >
            <Text style={[styles.tabText, { color: activeTab === "exercise-history" ? "#fff" : colors.text }]}>
              種目別履歴
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "exercise-history" ? (
          renderExerciseHistoryContent()
        ) : (
          <>
            <Card style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {activeTab === "weight" ? "体重の推移" : activeTab === "strength" ? "最大挙上重量" : "トレーニング頻度"}
              </Text>
              {renderChart()}

              {stats && activeTab === "weight" && (stats as WeightStats).change !== undefined && (
                <View style={styles.highlightContainer}>
                  <Text style={[styles.highlightLabel, { color: colors.text }]}>先月比:</Text>
                  <Text 
                    style={[
                      styles.highlightValue, 
                      { color: (stats as WeightStats).change < 0 ? colors.success : colors.error }
                    ]}
                  >
                    {(stats as WeightStats).change > 0 ? '+' : ''}{(stats as WeightStats).change}kg
                  </Text>
                </View>
              )}

              {stats && activeTab === "strength" && (stats as StrengthStats).maxWeights && (
                <View style={styles.highlightContainer}>
                  <Text style={[styles.highlightLabel, { color: colors.text }]}>
                    {(stats as StrengthStats).maxWeights[0]?.name || 'ベンチプレス'}自己ベスト:
                  </Text>
                  <Text style={[styles.highlightValue, { color: colors.primary }]}>
                    {(stats as StrengthStats).maxWeights[0]?.weight || 0}kg
                  </Text>
                </View>
              )}

              {stats && activeTab === "workouts" && (stats as WorkoutCountStats).total !== undefined && (
                <View style={styles.highlightContainer}>
                  <Text style={[styles.highlightLabel, { color: colors.text }]}>今週のトレーニング:</Text>
                  <Text style={[styles.highlightValue, { color: colors.primary }]}>
                    {(stats as WorkoutCountStats).total}/{(stats as WorkoutCountStats).target}回
                  </Text>
                </View>
              )}
            </Card>

            <View style={styles.historySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>トレーニング履歴</Text>

              {workoutHistory.length > 0 ? (
                workoutHistory.map((workout, index) => (
                  <Card
                    key={index}
                    style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.historyHeader}>
                      <View style={styles.dateContainer}>
                        <Calendar size={16} color={colors.primary} />
                        <Text style={[styles.dateText, { color: colors.text }]}>{workout.date}</Text>
                      </View>
                      <TouchableOpacity style={styles.detailButton}>
                        <Text style={[styles.detailText, { color: colors.primary }]}>詳細</Text>
                        <ChevronRight size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.workoutTitle, { color: colors.text }]}>{workout.title}</Text>

                    <View style={styles.workoutDetails}>
                      <Text style={[styles.highlightText, { color: colors.text }]}>{workout.highlights}</Text>
                      <Text style={[styles.exerciseCount, { color: colors.text }]}>{workout.exercises}種目</Text>
                    </View>
                  </Card>
                ))
              ) : (
                <Text style={[styles.noDataText, { color: colors.text }]}>
                  トレーニング履歴がありません
                </Text>
              )}

              {workoutHistory.length > 0 && (
                <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.border }]}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>すべての履歴を見る</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {renderExerciseHistoryDetails()}
          </>
        )}

        {/* 種目選択モーダル */}
        <Modal
          visible={exerciseModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setExerciseModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>種目を選択</Text>
              
              <TextInput
                placeholder="種目名で検索..."
                placeholderTextColor={colors.text + "60"}
                value={exerciseSearchQuery}
                onChangeText={setExerciseSearchQuery}
                style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
              />
              
              <ScrollView style={styles.exerciseList}>
                {filteredExerciseOptions.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[
                      styles.exerciseOption,
                      { borderColor: colors.border },
                      selectedExercise?.id === exercise.id && { backgroundColor: colors.primary + "20" }
                    ]}
                    onPress={() => {
                      setSelectedExercise(exercise)
                      setExerciseModalVisible(false)
                      setExerciseSearchQuery("")
                    }}
                  >
                    <Text style={[styles.exerciseOptionText, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {filteredExerciseOptions.length === 0 && (
                  <Text style={[styles.noDataText, { color: colors.text }]}>
                    該当する種目が見つかりません
                  </Text>
                )}
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  setExerciseModalVisible(false)
                  setExerciseSearchQuery("")
                }}
              >
                <Text style={styles.modalCloseText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  highlightContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
  },
  highlightLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    marginLeft: 5,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    marginRight: 5,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  workoutDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  highlightText: {
    fontSize: 14,
  },
  exerciseCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 5,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 20,
    opacity: 0.7,
  },
  exerciseSelectCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  exerciseSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
  },
  exerciseSelectText: {
    fontSize: 16,
    fontWeight: "500",
  },
  periodNavCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  periodNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  periodNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  periodText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  exerciseList: {
    maxHeight: 300,
    width: "100%",
  },
  exerciseOption: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  exerciseOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  toggleButton: {
    padding: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  detailsList: {
    maxHeight: 300,
    width: "100%",
  },
  detailItem: {
    padding: 10,
    borderBottomWidth: 1,
  },
  detailItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  detailDate: {
    fontSize: 14,
    fontWeight: "bold",
  },
  detailSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailSummary: {
    fontSize: 14,
  },
  detailVolume: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  setsContainer: {
    flexDirection: "column",
    gap: 5,
  },
  setItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
  },
  setText: {
    fontSize: 14,
    marginRight: 5,
  },
  volumeText: {
    fontSize: 14,
    opacity: 0.7,
  },
  searchInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
})