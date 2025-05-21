import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from "react-native"
import { useTheme } from "../context/theme-context"
import { X, Play } from "lucide-react-native"

interface ExerciseVideoModalProps {
  isVisible: boolean
  onClose: () => void
  exercise: {
    name: string
    description: string
    videoUrl?: string
    tips: string[]
  }
}

const { width } = Dimensions.get("window")

export default function ExerciseVideoModal({ isVisible, onClose, exercise }: ExerciseVideoModalProps) {
  const { colors } = useTheme()

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={[styles.centeredView, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalView, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{exercise.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={[styles.videoContainer, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.primary }]}>
                <Play size={30} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.videoText, { color: colors.text }]}>タップして動画を再生</Text>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>エクササイズの説明</Text>
              <Text style={[styles.description, { color: colors.text }]}>{exercise.description}</Text>
            </View>

            <View style={styles.tipsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>トレーニングのコツ</Text>
              {(exercise.tips ?? []).map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={styles.doneButtonText}>閉じる</Text>
          </TouchableOpacity>
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
    maxHeight: "80%",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    marginBottom: 20,
  },
  videoContainer: {
    height: 200,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  videoText: {
    fontSize: 14,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  doneButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

