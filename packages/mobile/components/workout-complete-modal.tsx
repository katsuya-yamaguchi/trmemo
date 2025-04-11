import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Share } from "react-native"
import { useTheme } from "../context/theme-context"
import { Award, Share2, X } from "lucide-react-native"

interface WorkoutCompleteModalProps {
  isVisible: boolean
  onClose: () => void
  workout: {
    title: string
    duration: string
    exerciseCount: number
    totalSets: number
    calories?: number
  }
}

const { width } = Dimensions.get("window")

export default function WorkoutCompleteModal({ isVisible, onClose, workout }: WorkoutCompleteModalProps) {
  const { colors } = useTheme()

  const handleShare = async () => {
    try {
      await Share.share({
        message: `今日の${workout.title}トレーニングを完了しました！\n${workout.exerciseCount}種目 ${workout.totalSets}セット ${workout.duration}\n${workout.calories ? `消費カロリー: ${workout.calories}kcal` : ""}`,
        title: "トレーニング達成",
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={[styles.centeredView, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalView, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            <Award size={60} color={colors.primary} />
            <Text style={[styles.congratsText, { color: colors.text }]}>トレーニング完了！</Text>
            <Text style={[styles.workoutTitle, { color: colors.primary }]}>{workout.title}</Text>
            <Text style={[styles.description, { color: colors.text }]}>
              お疲れ様でした！今日も素晴らしいトレーニングでした。
            </Text>

            <View style={styles.statsContainer}>
              <View style={[styles.statItem, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{workout.exerciseCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>エクササイズ</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{workout.totalSets}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>セット</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{workout.duration}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>時間</Text>
              </View>
            </View>

            {workout.calories && (
              <View style={[styles.caloriesContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.caloriesLabel, { color: colors.text }]}>消費カロリー</Text>
                <Text style={[styles.caloriesValue, { color: colors.primary }]}>{workout.calories} kcal</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShare}>
              <Share2 size={20} color="#fff" />
              <Text style={styles.shareButtonText}>SNSでシェアする</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: width * 0.9,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 5,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  statItem: {
    width: "30%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  caloriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  caloriesLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  caloriesValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 30,
    width: "100%",
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})

