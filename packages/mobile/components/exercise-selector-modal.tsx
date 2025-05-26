import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ScrollView,
} from "react-native";
import { useTheme } from "../context/theme-context";
import { workoutApi } from "../services/api";
import { X, Search } from "lucide-react-native";
import { Exercise, ExerciseType } from "../types/exercise";

// 種目タイプの定義
const EXERCISE_TYPES = [
  { id: "all", name: "すべて" },
  { id: "barbell", name: "バーベル" },
  { id: "dumbbell", name: "ダンベル" },
  { id: "band", name: "バンド" },
  { id: "machine", name: "マシン" },
  { id: "other", name: "その他" },
] as const;

console.log('EXERCISE_TYPES defined:', EXERCISE_TYPES);

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
};

export default function ExerciseSelectorModal({ visible, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  
  // デバッグ用：colorsの内容を確認
  console.log('ExerciseSelectorModal colors:', colors);
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"all" | ExerciseType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // デバッグ用：selectedTypeの変更を監視
  useEffect(() => {
    console.log(`selectedType changed to: ${selectedType}`);
  }, [selectedType]);

  // 種目一覧を取得
  const fetchExercises = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const data = await workoutApi.getExerciseLibrary(
        selectedType === "all" ? undefined : selectedType,
        searchQuery,
        isLoadMore ? page + 1 : 1
      );

      if (data && data.exercises) {
        if (isLoadMore) {
          setExercises(prev => [...prev, ...data.exercises]);
          setPage(prev => prev + 1);
        } else {
          setExercises(data.exercises);
          setPage(1);
        }
        setHasMore(data.exercises.length === 20); // 20件未満なら最後のページ
      } else {
        if (!isLoadMore) {
          setExercises([]);
        }
        setHasMore(false);
        console.warn("getExerciseLibrary returned data or data.exercises as undefined");
      }

    } catch (err) {
      console.error("種目一覧取得エラー:", err);
      setError("種目一覧の取得に失敗しました");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedType, searchQuery]);

  // モーダルが開かれた時の初期化処理
  useEffect(() => {
    if (visible) {
      // 状態をリセット（selectedTypeは除く）
      setSearchQuery("");
      setPage(1);
      setHasMore(true);
      setLoadingMore(false);
      setError(null);
      setLoading(true);
      
      // 初回データ取得
      fetchExercises();
    }
  }, [visible, fetchExercises]);

  // 検索条件変更時に再取得（モーダルが表示されている時のみ）
  useEffect(() => {
    if (!visible) return;
    
    const timer = setTimeout(() => {
      fetchExercises();
    }, 300); // デバウンス処理

    return () => clearTimeout(timer);
  }, [selectedType, searchQuery, visible, fetchExercises]);

  // 無限スクロール
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchExercises(true);
    }
  };

  // モーダルを閉じる処理
  const handleClose = () => {
    // 状態をリセット（selectedTypeは保持）
    setSearchQuery("");
    setExercises([]);
    setPage(1);
    setHasMore(true);
    setLoadingMore(false);
    setError(null);
    setLoading(true);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>種目を選択</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 検索バー */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Search size={20} color={colors.text} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="種目を検索..."
            placeholderTextColor={colors.text + "80"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 種目タイプボタン */}
        <View style={styles.typeSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeSelector}
            contentContainerStyle={styles.typeSelectorContent}
          >
            {EXERCISE_TYPES.map((type) => {
              console.log(`Rendering type button: ${type.name}, selected: ${selectedType === type.id}`);
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && { backgroundColor: colors.primary },
                    { borderColor: colors.border || '#E5E5E5' }
                  ]}
                  onPress={() => {
                    console.log(`Type button pressed: ${type.id}, current selectedType: ${selectedType}`);
                    setSelectedType(type.id);
                    console.log(`selectedType will be set to: ${type.id}`);
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: selectedType === type.id ? "#fff" : colors.text }
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 種目一覧 */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={{ marginVertical: 16 }}
                  />
                ) : null
              }
              ListEmptyComponent={
                !loading && !error ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                      該当する種目が見つかりません。
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.exerciseItem, { backgroundColor: colors.card }]}
                  onPress={() => onSelect(item)}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.exerciseImage}
                    resizeMode="cover"
                  />
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.exerciseType, { color: colors.text + "80" }]}>
                      {EXERCISE_TYPES.find(t => t.id === item.type)?.name || "その他"}
                    </Text>
                    <Text style={[styles.exerciseDescription, { color: colors.text + "80" }]}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    marginLeft: 8,
  },
  typeSelectorContainer: {
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  typeSelector: {
    height: 50,
  },
  typeSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    height: 40,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    minHeight: 300,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  exerciseItem: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "visible",
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  exerciseImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  exerciseInfo: {
    flex: 1,
    padding: 14,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseType: {
    fontSize: 14,
  },
  loadingContainer: {
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  errorContainer: {
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  exerciseDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 