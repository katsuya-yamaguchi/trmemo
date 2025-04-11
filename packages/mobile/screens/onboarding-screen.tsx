import { useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../context/theme-context"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { SliderComponent } from "../components/ui/slider"
import { ChevronRight } from "lucide-react-native"

export default function OnboardingScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState({
    height: 170,
    weight: 65,
    goal: "",
    targetMuscles: [],
    frequency: 3,
  })

  const goals = ["筋力向上", "体型改善", "健康維持", "ダイエット"]
  const muscleGroups = ["胸筋", "背筋", "腕", "脚", "腹筋", "肩"]

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      // Complete onboarding and navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" as never }],
      })
    }
  }

  const toggleMuscleGroup = (muscle: string) => {
    setProfile((prev) => {
      if (prev.targetMuscles.includes(muscle)) {
        return {
          ...prev,
          targetMuscles: prev.targetMuscles.filter((m) => m !== muscle),
        }
      } else {
        return {
          ...prev,
          targetMuscles: [...prev.targetMuscles, muscle],
        }
      }
    })
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>基本情報</Text>
            <Text style={[styles.stepDescription, { color: colors.text }]}>あなたの身長と体重を教えてください</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>身長 (cm)</Text>
              <Input
                value={profile.height.toString()}
                onChangeText={(text) => setProfile({ ...profile, height: Number.parseInt(text) || 0 })}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>体重 (kg)</Text>
              <Input
                value={profile.weight.toString()}
                onChangeText={(text) => setProfile({ ...profile, weight: Number.parseInt(text) || 0 })}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            </View>
          </View>
        )
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>目標設定</Text>
            <Text style={[styles.stepDescription, { color: colors.text }]}>あなたの目標を教えてください</Text>

            <View style={styles.goalsContainer}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    {
                      backgroundColor: profile.goal === goal ? colors.primary : colors.card,
                      borderColor: profile.goal === goal ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setProfile({ ...profile, goal })}
                >
                  <Text style={[styles.goalText, { color: profile.goal === goal ? "#fff" : colors.text }]}>{goal}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>鍛えたい部位</Text>
            <Text style={[styles.stepDescription, { color: colors.text }]}>
              特に鍛えたい部位を選択してください（複数選択可）
            </Text>

            <View style={styles.muscleGroupsContainer}>
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={[
                    styles.muscleButton,
                    {
                      backgroundColor: profile.targetMuscles.includes(muscle) ? colors.primary : colors.card,
                      borderColor: profile.targetMuscles.includes(muscle) ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleMuscleGroup(muscle)}
                >
                  <Text
                    style={[
                      styles.muscleText,
                      { color: profile.targetMuscles.includes(muscle) ? "#fff" : colors.text },
                    ]}
                  >
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>トレーニング頻度</Text>
            <Text style={[styles.stepDescription, { color: colors.text }]}>週に何回トレーニングする予定ですか？</Text>

            <View style={styles.frequencyContainer}>
              <Text style={[styles.frequencyValue, { color: colors.text }]}>週 {profile.frequency} 回</Text>
              <SliderComponent
                value={profile.frequency}
                minimumValue={1}
                maximumValue={7}
                step={1}
                onValueChange={(value) => setProfile({ ...profile, frequency: value[0] })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <View style={styles.frequencyLabels}>
                <Text style={[styles.frequencyLabel, { color: colors.text }]}>1回</Text>
                <Text style={[styles.frequencyLabel, { color: colors.text }]}>7回</Text>
              </View>
            </View>

            <View style={styles.summaryContainer}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>あなたの情報まとめ</Text>
              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.summaryItem, { color: colors.text }]}>身長: {profile.height} cm</Text>
                <Text style={[styles.summaryItem, { color: colors.text }]}>体重: {profile.weight} kg</Text>
                <Text style={[styles.summaryItem, { color: colors.text }]}>目標: {profile.goal}</Text>
                <Text style={[styles.summaryItem, { color: colors.text }]}>
                  鍛えたい部位: {profile.targetMuscles.join(", ")}
                </Text>
                <Text style={[styles.summaryItem, { color: colors.text }]}>
                  トレーニング頻度: 週 {profile.frequency} 回
                </Text>
              </View>
            </View>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor: s <= step ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {renderStep()}

        <View style={styles.buttonContainer}>
          <Button onPress={handleNext} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.nextButtonText}>{step === 4 ? "完了" : "次へ"}</Text>
            <ChevronRight size={20} color="#fff" />
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  stepContainer: {
    flex: 1,
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  goalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  goalButton: {
    width: "48%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  goalText: {
    fontSize: 16,
    fontWeight: "500",
  },
  muscleGroupsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  muscleButton: {
    width: "30%",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  muscleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  frequencyContainer: {
    marginTop: 20,
  },
  frequencyValue: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  frequencyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  frequencyLabel: {
    fontSize: 14,
  },
  summaryContainer: {
    marginTop: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  summaryCard: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryItem: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingVertical: 20,
  },
  nextButton: {
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 5,
  },
})

