import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from "react-native"
import { useTheme } from "../context/theme-context"
import { LineChart } from "react-native-chart-kit"
import BodyStatsInput from "../components/body-stats-input"
import { Card } from "../components/ui/card"
import { ChevronLeft, ChevronDown, Calendar, TrendingDown } from "lucide-react-native"

export default function WeightHistoryScreen({ navigation }) {
  const { colors } = useTheme()
  const [timeRange, setTimeRange] = useState("month") // 'week', 'month', 'year'
  const screenWidth = Dimensions.get("window").width - 40

  // Mock data for weight history
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

  // Mock data for weight entries
  const weightEntries = [
    { date: "2023/10/15", weight: 65.0, bodyFat: 15.2 },
    { date: "2023/10/08", weight: 65.5, bodyFat: 15.5 },
    { date: "2023/10/01", weight: 66.0, bodyFat: 15.8 },
    { date: "2023/09/24", weight: 66.5, bodyFat: 16.0 },
    { date: "2023/09/17", weight: 67.0, bodyFat: 16.3 },
  ]

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
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

  const handleSaveStats = (stats) => {
    console.log("Saved stats:", stats)
    // In a real app, this would update the state and backend
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>体重記録</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterText, { color: colors.text }]}>
              期間: {timeRange === "week" ? "1週間" : timeRange === "month" ? "1ヶ月" : "1年"}
            </Text>
            <ChevronDown size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Card style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>体重の推移</Text>
          <LineChart
            data={weightData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text }]}>現在</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>65.0kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text }]}>開始時</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>70.0kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text }]}>変化</Text>
              <View style={styles.changeContainer}>
                <TrendingDown size={16} color="#10b981" />
                <Text style={[styles.changeValue, { color: "#10b981" }]}>-5.0kg</Text>
              </View>
            </View>
          </View>
        </Card>

        <BodyStatsInput onSave={handleSaveStats} />

        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>記録履歴</Text>

          {weightEntries.map((entry, index) => (
            <Card
              key={index}
              style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.historyHeader}>
                <View style={styles.dateContainer}>
                  <Calendar size={16} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>{entry.date}</Text>
                </View>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.historyItem}>
                  <Text style={[styles.historyLabel, { color: colors.text }]}>体重</Text>
                  <Text style={[styles.historyValue, { color: colors.primary }]}>{entry.weight} kg</Text>
                </View>

                {entry.bodyFat && (
                  <View style={styles.historyItem}>
                    <Text style={[styles.historyLabel, { color: colors.text }]}>体脂肪率</Text>
                    <Text style={[styles.historyValue, { color: colors.primary }]}>{entry.bodyFat} %</Text>
                  </View>
                )}
              </View>
            </Card>
          ))}

          <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.border }]}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>すべての履歴を見る</Text>
            <ChevronDown size={16} color={colors.primary} />
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34, // Same width as back button for centering
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
  chartCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 5,
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
  historyDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyItem: {
    alignItems: "center",
  },
  historyLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: "bold",
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

