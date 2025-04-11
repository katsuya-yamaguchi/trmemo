import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../context/theme-context"
import { Card } from "../components/ui/card"
import { Calendar, ChevronRight, Dumbbell } from "lucide-react-native"

export default function TrainingScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState(0)

  // Mock data for training program
  const program = {
    title: "筋力向上 8週間プログラム",
    days: [
      { id: 1, name: "Day 1", focus: "胸・三頭筋" },
      { id: 2, name: "Day 2", focus: "背中・二頭筋" },
      { id: 3, name: "Day 3", focus: "脚・肩" },
      { id: 4, name: "Day 4", focus: "腕・腹筋" },
      { id: 5, name: "Day 5", focus: "全身" },
      { id: 6, name: "休息日", focus: "ストレッチ" },
      { id: 7, name: "休息日", focus: "ストレッチ" },
    ],
    currentWeek: 3,
    totalWeeks: 8,
  }

  // Mock data for workouts
  const workouts = [
    {
      id: 1,
      title: "胸・三頭筋",
      exercises: [
        { name: "ベンチプレス", sets: 4, reps: "8-10" },
        { name: "インクラインダンベルプレス", sets: 3, reps: "10-12" },
        { name: "ケーブルフライ", sets: 3, reps: "12-15" },
        { name: "トライセップスプッシュダウン", sets: 3, reps: "12-15" },
        { name: "スカルクラッシャー", sets: 3, reps: "10-12" },
      ],
      duration: "50分",
    },
    {
      id: 2,
      title: "背中・二頭筋",
      exercises: [
        { name: "デッドリフト", sets: 4, reps: "6-8" },
        { name: "ラットプルダウン", sets: 3, reps: "10-12" },
        { name: "シーテッドロー", sets: 3, reps: "10-12" },
        { name: "バイセップカール", sets: 3, reps: "10-12" },
        { name: "ハンマーカール", sets: 3, reps: "10-12" },
      ],
      duration: "55分",
    },
    {
      id: 3,
      title: "脚・肩",
      exercises: [
        { name: "スクワット", sets: 4, reps: "8-10" },
        { name: "レッグプレス", sets: 3, reps: "10-12" },
        { name: "レッグエクステンション", sets: 3, reps: "12-15" },
        { name: "ショルダープレス", sets: 3, reps: "8-10" },
        { name: "サイドラテラルレイズ", sets: 3, reps: "12-15" },
      ],
      duration: "60分",
    },
    {
      id: 4,
      title: "腕・腹筋",
      exercises: [
        { name: "バイセップカール", sets: 4, reps: "10-12" },
        { name: "トライセップスエクステンション", sets: 4, reps: "10-12" },
        { name: "ハンマーカール", sets: 3, reps: "10-12" },
        { name: "クランチ", sets: 3, reps: "15-20" },
        { name: "レッグレイズ", sets: 3, reps: "15-20" },
      ],
      duration: "45分",
    },
    {
      id: 5,
      title: "全身",
      exercises: [
        { name: "ベンチプレス", sets: 3, reps: "8-10" },
        { name: "ラットプルダウン", sets: 3, reps: "10-12" },
        { name: "スクワット", sets: 3, reps: "8-10" },
        { name: "ショルダープレス", sets: 3, reps: "8-10" },
        { name: "プランク", sets: 3, reps: "30秒" },
      ],
      duration: "50分",
    },
  ]

  const navigateToWorkout = (workout) => {
    navigation.navigate("TrainingDetail" as never, { workout } as never)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>トレーニングプラン</Text>
          <View style={styles.programInfo}>
            <Text style={[styles.programTitle, { color: colors.text }]}>{program.title}</Text>
            <Text style={[styles.programProgress, { color: colors.text }]}>
              Week {program.currentWeek}/{program.totalWeeks}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {program.days.map((day, index) => (
            <TouchableOpacity
              key={day.id}
              style={[styles.tab, activeTab === index && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab(index)}
            >
              <Text style={[styles.tabText, { color: activeTab === index ? "#fff" : colors.text }]}>{day.name}</Text>
              <Text style={[styles.tabSubtext, { color: activeTab === index ? "#fff" : colors.text, opacity: 0.7 }]}>
                {day.focus}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.workoutContainer}>
          {activeTab < 5 ? (
            <Card style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTitleContainer}>
                  <Dumbbell size={20} color={colors.primary} />
                  <Text style={[styles.workoutTitle, { color: colors.text }]}>{workouts[activeTab].title}</Text>
                </View>
                <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.durationText}>{workouts[activeTab].duration}</Text>
                </View>
              </View>

              <View style={styles.exerciseList}>
                {workouts[activeTab].exercises.map((exercise, index) => (
                  <View
                    key={index}
                    style={[
                      styles.exerciseItem,
                      index < workouts[activeTab].exercises.length - 1 && {
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
                onPress={() => navigateToWorkout(workouts[activeTab])}
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
  programProgress: {
    fontSize: 14,
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
})

