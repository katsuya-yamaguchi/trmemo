import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from "react-native"
import { useTheme } from "../context/theme-context"
import { Card } from "../components/ui/card"
import { LineChart, BarChart } from "react-native-chart-kit"
import { Calendar, Share2, ChevronDown, ChevronRight } from "lucide-react-native"

export default function ProgressScreen() {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState("weight") // 'weight', 'strength', 'workouts'
  const [timeRange, setTimeRange] = useState("month") // 'week', 'month', 'year'

  const screenWidth = Dimensions.get("window").width - 40

  // Mock data for charts
  const weightData = {
    labels: ["1月", "2月", "3月", "4月", "5月", "6月"],
    datasets: [
      {
        data: [70, 69, 68, 67, 66, 65],
        color: () => colors.primary,
        strokeWidth: 2,
      },
    ],
  }

  const strengthData = {
    labels: ["ベンチ", "スクワット", "デッド"],
    datasets: [
      {
        data: [80, 120, 140],
        color: () => colors.primary,
      },
    ],
  }

  const workoutsData = {
    labels: ["月", "火", "水", "木", "金", "土", "日"],
    datasets: [
      {
        data: [1, 0, 1, 0, 1, 1, 0],
        color: () => colors.primary,
      },
    ],
  }

  // Mock data for workout history
  const workoutHistory = [
    {
      date: "2023/10/15",
      title: "胸・腕トレーニング",
      highlights: "ベンチプレス 80kg × 8回",
      exercises: 5,
    },
    {
      date: "2023/10/13",
      title: "背中・肩トレーニング",
      highlights: "デッドリフト 140kg × 6回",
      exercises: 6,
    },
    {
      date: "2023/10/11",
      title: "脚トレーニング",
      highlights: "スクワット 120kg × 8回",
      exercises: 4,
    },
    {
      date: "2023/10/09",
      title: "胸・腕トレーニング",
      highlights: "ベンチプレス 77.5kg × 8回",
      exercises: 5,
    },
    {
      date: "2023/10/07",
      title: "背中・肩トレーニング",
      highlights: "デッドリフト 135kg × 6回",
      exercises: 6,
    },
  ]

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
    switch (activeTab) {
      case "weight":
        return (
          <LineChart
            data={weightData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        )
      case "strength":
        return (
          <BarChart
            data={strengthData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisSuffix="kg"
          />
        )
      case "workouts":
        return (
          <BarChart
            data={workoutsData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisSuffix="回"
          />
        )
      default:
        return null
    }
  }

  const handleShare = () => {
    // In a real app, this would open the native share dialog
    alert("進捗をシェアしました！")
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
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
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

          {activeTab === "weight" && (
            <View style={styles.highlightContainer}>
              <Text style={[styles.highlightLabel, { color: colors.text }]}>先月比:</Text>
              <Text style={[styles.highlightValue, { color: colors.success }]}>-1kg</Text>
            </View>
          )}

          {activeTab === "strength" && (
            <View style={styles.highlightContainer}>
              <Text style={[styles.highlightLabel, { color: colors.text }]}>ベンチプレス自己ベスト:</Text>
              <Text style={[styles.highlightValue, { color: colors.primary }]}>80kg</Text>
            </View>
          )}

          {activeTab === "workouts" && (
            <View style={styles.highlightContainer}>
              <Text style={[styles.highlightLabel, { color: colors.text }]}>今週のトレーニング:</Text>
              <Text style={[styles.highlightValue, { color: colors.primary }]}>4/5回</Text>
            </View>
          )}
        </Card>

        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>トレーニング履歴</Text>

          {workoutHistory.map((workout, index) => (
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
          ))}

          <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.border }]}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>すべての履歴を見る</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
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
})

