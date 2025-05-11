import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { useTheme } from "../context/theme-context"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Calendar, Save } from "lucide-react-native"

interface BodyStatsInputProps {
  onSave: (stats: { weight: number; bodyFat?: number; date: Date }) => void
}

export default function BodyStatsInput({ onSave }: BodyStatsInputProps) {
  const { colors } = useTheme()
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [date, setDate] = useState(new Date())

  const handleSave = () => {
    if (!weight) {
      Alert.alert("エラー", "体重を入力してください")
      return
    }

    onSave({
      weight: Number.parseFloat(weight),
      bodyFat: bodyFat ? Number.parseFloat(bodyFat) : undefined,
      date,
    })

    // Reset form
    setWeight("")
    setBodyFat("")
    setDate(new Date())

    Alert.alert("保存完了", "体重データを記録しました")
  }

  const handleDateChange = () => {
    // In a real app, this would open a date picker
    Alert.alert("日付選択", "記録する日付を選択してください", [
      {
        text: "今日",
        onPress: () => setDate(new Date()),
      },
      {
        text: "昨日",
        onPress: () => {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          setDate(yesterday)
        },
      },
      {
        text: "キャンセル",
        style: "cancel",
      },
    ])
  }

  return (
    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>体重記録</Text>

      <TouchableOpacity style={[styles.dateSelector, { borderColor: colors.border }]} onPress={handleDateChange}>
        <Calendar size={20} color={colors.primary} />
        <Text style={[styles.dateText, { color: colors.text }]}>
          {date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
        </Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>体重 (kg)</Text>
        <Input
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="例: 70.5"
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>体脂肪率 (%) - オプション</Text>
        <Input
          value={bodyFat}
          onChangeText={setBodyFat}
          keyboardType="numeric"
          placeholder="例: 15.0"
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
      </View>

      <Button onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
        <View style={styles.saveButtonContent}>
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>記録する</Text>
        </View>
      </Button>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})

