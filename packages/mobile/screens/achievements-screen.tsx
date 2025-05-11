import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from "react-native"
import { useTheme } from "../context/theme-context"
import AchievementCard from "../components/achievement-card"
import { Trophy, ChevronLeft } from "lucide-react-native"

export default function AchievementsScreen({ navigation }) {
  const { colors } = useTheme()

  // Mock data for achievements
  const achievements = [
    {
      id: 1,
      title: "ベンチプレス自己ベスト更新",
      description: "ベンチプレスで新しい自己ベスト記録を達成しました。継続的なトレーニングの成果です！",
      date: "2023/10/15",
      value: "80kg",
      isNew: true,
    },
    {
      id: 2,
      title: "10回連続トレーニング達成",
      description: "10回連続でトレーニングを完了しました。素晴らしい継続力です！",
      date: "2023/10/10",
      value: "10回",
    },
    {
      id: 3,
      title: "スクワット100kg達成",
      description: "スクワットで100kgを達成しました。下半身の強化が進んでいます！",
      date: "2023/10/05",
      value: "100kg",
    },
    {
      id: 4,
      title: "体重5kg減量達成",
      description: "目標としていた体重5kg減量を達成しました。食事管理とトレーニングの成果です！",
      date: "2023/09/30",
      value: "-5kg",
    },
    {
      id: 5,
      title: "初めての筋トレ完了",
      description: "アプリを使用して初めてのトレーニングを完了しました。フィットネスの旅の始まりです！",
      date: "2023/09/15",
    },
  ]

  const handleShare = (achievement) => {
    Alert.alert("シェア", `${achievement.title}をSNSでシェアしました！`)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>達成記録</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.bannerContainer}>
          <View style={[styles.banner, { backgroundColor: colors.primary }]}>
            <Trophy size={30} color="#fff" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>おめでとうございます！</Text>
              <Text style={styles.bannerText}>あなたは5つの達成記録を獲得しました</Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsContainer}>
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} onShare={() => handleShare(achievement)} />
          ))}
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
  bannerContainer: {
    marginBottom: 20,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  bannerTextContainer: {
    marginLeft: 15,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  bannerText: {
    color: "#fff",
    fontSize: 14,
  },
  achievementsContainer: {
    marginBottom: 20,
  },
})

