import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Alert } from "react-native"
import { useTheme } from "../context/theme-context"
import { Card } from "../components/ui/card"
import ExerciseVideoModal from "../components/exercise-video-modal"
import { ChevronLeft, Search, Filter, ChevronRight, Dumbbell, Heart, Zap } from "lucide-react-native"
import { workoutApi } from "../services/api"

// モバイルアプリ側で表示するエクササイズの型定義 (APIレスポンスに合わせる)
// バックエンドのフォーマット済みデータに対応
type Exercise = {
  id: string; // UUID は string
  name: string;
  category: string; // 'chest', 'back', etc.
  difficulty: string; // '初級', '中級', '上級' (現状ダミー)
  description: string;
  tips: string[]; // (現状ダミー)
};

export default function ExerciseLibraryScreen({ navigation }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  // --- State の追加 ---
  const [exercises, setExercises] = useState<Exercise[]>([]) // APIから取得したデータ用
  const [loading, setLoading] = useState(true) // ローディング状態
  const [error, setError] = useState<string | null>(null) // エラー状態

  // トレーニング部位。部位は今後増えることも無いため、ハードコーディングでも現状問題ない
  const categories = [
    { id: "all", name: "すべて" },
    { id: "chest", name: "胸" },
    { id: "back", name: "背中" },
    { id: "legs", name: "脚" },
    { id: "shoulders", name: "肩" },
    { id: "arms", name: "腕" },
    { id: "abs", name: "腹筋" },
  ]

  // --- useEffect でデータを取得 ---
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true)
      setError(null)
      try {
        // API を呼び出し (カテゴリや検索クエリも渡せるようにする - 後述)
        // 現状はフィルタリングをフロントで行うため、まず全件取得
        const data = await workoutApi.getExerciseLibrary()
        setExercises(data) // 取得したデータを state にセット
      } catch (err: any) {
        console.error("Failed to fetch exercises:", err)
        setError(err.message || "エクササイズの取得に失敗しました")
        Alert.alert("エラー", err.message || "エクササイズの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, []) // 初回マウント時のみ実行

  // --- フィルタリングロジックで使用する state を `exercises` に変更 ---
  const filteredExercises = exercises.filter((exercise) => {
    // カテゴリのマッチング (バックエンドから返される category ID を使用)
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setModalVisible(true)
  }

  const getDifficultyColor = (difficulty: string) => {
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

  const getCategoryIcon = (category: string) => {
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

  // --- ローディングとエラー表示の追加 ---
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.error, marginBottom: 10 }}>エラー: {error}</Text>
        {/* 必要であればリトライボタンなどを追加 */}
      </SafeAreaView>
    )
  }
  // --- ここまでローディングとエラー表示 ---

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
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
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
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { color: colors.text }]}>該当するエクササイズが見つかりません。</Text>
            </View>
          )}
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noDataText: {
    fontSize: 16,
    opacity: 0.7,
  },
})

