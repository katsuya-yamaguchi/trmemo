import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert } from "react-native"
import { useTheme } from "../context/theme-context"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/card"
import { LineChart, BarChart } from "react-native-chart-kit"
import { Calendar, Share2, ChevronDown, ChevronRight } from "lucide-react-native"
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

export default function ProgressScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("weight") // 'weight', 'strength', 'workouts'
  const [timeRange, setTimeRange] = useState("month") // 'week', 'month', 'year'
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [stats, setStats] = useState<ProgressStats>(null)
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const screenWidth = Dimensions.get("window").width - 40

  // 進捗データを取得
  useEffect(() => {
    async function fetchProgressData() {
      if (!user?.id) return
      
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
            onPress={handleTimeRangeChange}
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
        </View>

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
})