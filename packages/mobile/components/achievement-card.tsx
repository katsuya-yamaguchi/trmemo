import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../context/theme-context"
import { Card } from "./ui/card"
import { Award, Share2, Calendar } from "lucide-react-native"

interface AchievementCardProps {
  achievement: {
    title: string
    description: string
    date: string
    value?: string
    isNew?: boolean
  }
  onShare: () => void
}

export default function AchievementCard({ achievement, onShare }: AchievementCardProps) {
  const { colors } = useTheme()

  return (
    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Award size={24} color={colors.primary} />
        {achievement.isNew && (
          <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{achievement.title}</Text>

      <Text style={[styles.description, { color: colors.text }]}>{achievement.description}</Text>

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color={colors.text} />
          <Text style={[styles.dateText, { color: colors.text }]}>{achievement.date}</Text>
        </View>

        {achievement.value && <Text style={[styles.valueText, { color: colors.primary }]}>{achievement.value}</Text>}
      </View>

      <TouchableOpacity style={[styles.shareButton, { borderColor: colors.border }]} onPress={onShare}>
        <Share2 size={16} color={colors.primary} />
        <Text style={[styles.shareButtonText, { color: colors.primary }]}>シェアする</Text>
      </TouchableOpacity>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    marginLeft: 5,
  },
  valueText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
})

