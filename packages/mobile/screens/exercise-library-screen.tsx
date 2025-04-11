import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from "react-native"
import { useTheme } from "../context/theme-context"
import { Card } from "../components/ui/card"
import ExerciseVideoModal from "../components/exercise-video-modal"
import { ChevronLeft, Search, Filter, ChevronRight, Dumbbell, Heart, Zap } from "lucide-react-native"

export default function ExerciseLibraryScreen({ navigation }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)

  // Mock data for exercise categories
  const categories = [
    { id: "all", name: "すべて" },
    { id: "chest", name: "胸" },
    { id: "back", name: "背中" },
    { id: "legs", name: "脚" },
    { id: "shoulders", name: "肩" },
    { id: "arms", name: "腕" },
    { id: "abs", name: "腹筋" },
  ]

  // Mock data for exercises
  const exercises = [
    {
      id: 1,
      name: "ベンチプレス",
      category: "chest",
      difficulty: "中級",
      description: "ベンチプレスは胸の筋肉を鍛える基本的なエクササイズです。バーベルを使用して行います。",
      tips: ["肩甲骨を寄せて胸を張る", "バーを下ろす際は胸の中央に向ける", "呼吸を意識し、押し上げる時に息を吐く"],
    },
    {
      id: 2,
      name: "スクワット",
      category: "legs",
      difficulty: "中級",
      description:
        "スクワットは下半身全体を鍛える基本的なエクササイズです。特に大腿四頭筋、ハムストリングス、臀筋に効果的です。",
      tips: [
        "足は肩幅より少し広めに開く",
        "膝がつま先より前に出ないようにする",
        "背筋をまっすぐに保つ",
        "腰を落とす際は太ももが床と平行になるまで下げる",
      ],
    },
    {
      id: 3,
      name: "デッドリフト",
      category: "back",
      difficulty: "上級",
      description: "デッドリフトは背中、臀筋、ハムストリングスを鍛える複合エクササイズです。正しいフォームが重要です。",
      tips: [
        "足は肩幅に開く",
        "背筋をまっすぐに保つ",
        "バーは常に身体の近くをキープする",
        "持ち上げる際は足で床を押すイメージで",
      ],
    },
    {
      id: 4,
      name: "ラットプルダウン",
      category: "back",
      difficulty: "初級",
      description: "ラットプルダウンは広背筋を中心に背中の筋肉を鍛えるエクササイズです。マシンを使用して行います。",
      tips: ["肩甲骨を寄せながらバーを引き下げる", "背筋をまっすぐに保つ", "腕ではなく背中の筋肉を使うイメージで引く"],
    },
    {
      id: 5,
      name: "ショルダープレス",
      category: "shoulders",
      difficulty: "中級",
      description: "ショルダープレスは三角筋を中心に肩の筋肉を鍛えるエクササイズです。ダンベルやバーベルを使用します。",
      tips: ["肘を90度に曲げた状態からスタート", "腕を伸ばし切らないようにする", "背筋をまっすぐに保つ"],
    },
  ]

  const filteredExercises = exercises.filter((exercise) => {
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleExercisePress = (exercise) => {
    setSelectedExercise(exercise)
    setModalVisible(true)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "初級":
        return "#10b981" // green
      case "中級":
        return "#f59e0b" // amber
      case "上級":
        return "#ef4444" // red
      default:
        return colors.text
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "chest":
        return <Dumbbell size={16} color={colors.primary} />
      case "back":
        return <Zap size={16} color={colors.primary} />
      case "legs":
        return <Zap size={16} color={colors.primary} />
      case "shoulders":
        return <Dumbbell size={16} color={colors.primary} />
      case "arms":
        return <Dumbbell size={16} color={colors.primary} />
      case "abs":
        return <Heart size={16} color={colors.primary} />
      default:
        return <Dumbbell size={16} color={colors.primary} />
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>エクササイズ一覧</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={20} color={colors.text} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="エクササイズを検索"
              placeholderTextColor={colors.text + "80"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]}>
            <Filter size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && { backgroundColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[styles.categoryText, { color: selectedCategory === category.id ? "#fff" : colors.text }]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.exercisesContainer}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity key={exercise.id} onPress={() => handleExercisePress(exercise)}>
              <Card style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseInfo}>
                    {getCategoryIcon(exercise.category)}
                    <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                  </View>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(exercise.difficulty) + "20" },
                    ]}
                  >
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                      {exercise.difficulty}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.exerciseDescription, { color: colors.text }]} numberOfLines={2}>
                  {exercise.description}
                </Text>

                <View style={styles.exerciseFooter}>
                  <Text style={[styles.viewDetailsText, { color: colors.primary }]}>詳細を見る</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedExercise && (
        <ExerciseVideoModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          exercise={selectedExercise}
        />
      )}
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
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  exercisesContainer: {
    marginBottom: 20,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  exerciseInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "500",
  },
  exerciseDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  exerciseFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 5,
  },
})

