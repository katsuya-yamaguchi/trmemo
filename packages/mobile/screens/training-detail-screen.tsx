import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Modal } from "react-native"
import { useRoute } from "@react-navigation/native"
import { useTheme } from "../context/theme-context"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import ExerciseVideoModal from "../components/exercise-video-modal"
import ExerciseSelectorModal from "../components/exercise-selector-modal"
import WorkoutCompleteModal from "../components/workout-complete-modal"
import { CheckCircle, Clock, Play, Pause, RotateCcw, Share2, Info, Plus, Settings, Edit3, Trash2 } from "lucide-react-native"
import { workoutApi } from "../services/api"

interface ExerciseData {
  name: string;
  description: string;
  tips: string[];
}

export default function TrainingDetailScreen() {
  const route = useRoute()
  const { colors } = useTheme()
  const { user } = useAuth()
  const { workout } = route.params as any

  const [exercises, setExercises] = useState(
    workout.exercises.map((ex) => ({
      ...ex,
      sets: Array(ex.sets)
        .fill(null)
        .map(() => ({
          weight: "",
          reps: "",
          completed: false,
        })),
    })),
  )

  const [activeExercise, setActiveExercise] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [restTime, setRestTime] = useState(60)
  const [timeLeft, setTimeLeft] = useState(restTime)
  const [workoutCompleted, setWorkoutCompleted] = useState(false)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null)
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // プラン変更機能のステート
  const [isEditMode, setIsEditMode] = useState(false)
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false)
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null)
  const [intervalSettingsVisible, setIntervalSettingsVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ★★★ デバッグログ追加 (useEffectの外) ★★★
  console.log('TrainingDetailScreen: user:', JSON.stringify(user, null, 2));
  console.log('TrainingDetailScreen: workout:', JSON.stringify(workout, null, 2));

  // セッション開始
  useEffect(() => {
    // ★★★ デバッグログ追加 (useEffectの直後) ★★★
    console.log('TrainingDetailScreen useEffect triggered. user:', user, 'workout:', workout);

    const startSession = async () => {
      // ★★★ デバッグログ追加 (startSessionの冒頭) ★★★
      console.log('startSession called. user?.id:', user?.id, 'workout?.dayId:', workout?.dayId);

      if (!user?.id || !workout?.dayId) {
        // ★★★ デバッグログ追加 (ガード節でreturnする場合) ★★★
        console.log('startSession: user.id or workout.dayId is missing, returning early.');
        return;
      }
      
      try {
        setIsLoading(true)
        const response = await workoutApi.startTrainingSession(workout.dayId)
        console.log('startSession response:', JSON.stringify(response, null, 2));
        if (response && response.session) {
          console.log('startSession sessionId:', response.session.id);
          setSessionId(response.session.id);
        } else {
          console.error('startSession: response or response.session is missing');
        }
      } catch (error) {
        console.error('セッション開始エラー:', error)
        Alert.alert('エラー', 'トレーニングセッションの開始に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    startSession()
  }, [user, workout])

  useEffect(() => {
    let interval
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsTimerRunning(false)
      Alert.alert("休憩終了", "次のセットを開始してください")
      setTimeLeft(restTime)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft])

  const handleSetComplete = async (exerciseIndex, setIndex) => {
    // ★★★ デバッグログ追加 ★★★
    console.log('handleSetComplete - current sessionId:', sessionId);
    // ★★★ ここまで ★★★

    if (!sessionId) {
      Alert.alert('エラー', 'セッションが開始されていません')
      return
    }

    try {
      // 現在のセットを完了済みにマーク
      const updatedExercises = [...exercises]
      updatedExercises[exerciseIndex].sets[setIndex].completed = true
      
      // APIにセットを記録
      await workoutApi.recordExerciseSet(
        sessionId,
        updatedExercises[exerciseIndex].id || 'exercise-id', // 実際にはAPIから取得したIDを使用
        setIndex + 1,
        parseFloat(updatedExercises[exerciseIndex].sets[setIndex].weight) || 0,
        parseInt(updatedExercises[exerciseIndex].sets[setIndex].reps) || 0
      )
      
      // ステート更新
      setExercises(updatedExercises)

      // 全セット完了チェック
      const allSetsCompleted = updatedExercises[exerciseIndex].sets.every((set) => set.completed)

      if (allSetsCompleted && exerciseIndex < exercises.length - 1) {
        // 次のエクササイズへ移動
        setActiveExercise(exerciseIndex + 1)
      } else if (allSetsCompleted && exerciseIndex === exercises.length - 1) {
        // 全エクササイズ完了
        checkWorkoutCompletion()
      }

      // 休憩タイマー開始
      setTimeLeft(restTime)
      setIsTimerRunning(true)
    } catch (error) {
      console.error('セット記録エラー:', error)
      Alert.alert('エラー', 'セットの記録に失敗しました')
    }
  }

  const handleWeightChange = (exerciseIndex, setIndex, value) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex].sets[setIndex].weight = value
    setExercises(updatedExercises)
  }

  const handleRepsChange = (exerciseIndex, setIndex, value) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex].sets[setIndex].reps = value
    setExercises(updatedExercises)
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setTimeLeft(restTime)
    setIsTimerRunning(false)
  }

  const checkWorkoutCompletion = async () => {
    if (!sessionId) return
    
    const allCompleted = exercises.every((exercise) => exercise.sets.every((set) => set.completed))

    if (allCompleted) {
      try {
        // セッション完了
        await workoutApi.completeTrainingSession(sessionId)
        
        // ステート更新
        setWorkoutCompleted(true)
        setCompleteModalVisible(true)
      } catch (error) {
        console.error('セッション完了エラー:', error)
        Alert.alert('エラー', 'トレーニングの完了処理に失敗しました')
      }
    }
  }

  const handleShare = () => {
    // 実際のアプリでは共有機能を実装
    Alert.alert("シェア", "達成記録をSNSに投稿しました！")
  }

  // プラン変更機能
  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex].sets.push({
      weight: "",
      reps: "",
      completed: false,
    })
    setExercises(updatedExercises)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (exercises[exerciseIndex].sets.length <= 1) {
      Alert.alert("エラー", "最低1セットは必要です")
      return
    }
    
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1)
    setExercises(updatedExercises)
  }

  const addExercise = () => {
    setSelectedExerciseIndex(null)
    setExerciseSelectorVisible(true)
  }

  const replaceExercise = (exerciseIndex: number) => {
    setSelectedExerciseIndex(exerciseIndex)
    setExerciseSelectorVisible(true)
  }

  const handleExerciseSelect = (exercise: any) => {
    const newExercise = {
      ...exercise,
      id: exercise.id, // 選択された種目のIDを使用
      name: exercise.name,
      sets: Array(3).fill(null).map(() => ({
        weight: "",
        reps: "",
        completed: false,
      })),
    }

    const updatedExercises = [...exercises]
    
    if (selectedExerciseIndex !== null) {
      // 既存の種目を置き換え
      updatedExercises[selectedExerciseIndex] = newExercise
    } else {
      // 新しい種目を追加
      updatedExercises.push(newExercise)
    }
    
    setExercises(updatedExercises)
    setExerciseSelectorVisible(false)
    setSelectedExerciseIndex(null)
  }

  const removeExercise = (exerciseIndex: number) => {
    if (exercises.length <= 1) {
      Alert.alert("エラー", "最低1つの種目は必要です")
      return
    }

    Alert.alert(
      "種目の削除",
      "この種目を削除してもよろしいですか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            const updatedExercises = [...exercises]
            updatedExercises.splice(exerciseIndex, 1)
            setExercises(updatedExercises)
            
            // アクティブな種目のインデックスを調整
            if (activeExercise >= exerciseIndex && activeExercise > 0) {
              setActiveExercise(activeExercise - 1)
            }
          }
        }
      ]
    )
  }

  const updateRestTime = (newTime: number) => {
    setRestTime(newTime)
    setTimeLeft(newTime)
    setIntervalSettingsVisible(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleInfoPress = async (exercise) => {
    try {
      // 実際のアプリではAPIからエクササイズ詳細を取得
      // const details = await workoutApi.getExerciseDetails(exercise.id);
      
      // 仮の詳細データ
      const exerciseData = {
        name: exercise.name,
        description: `${exercise.name}は効果的な筋力トレーニングエクササイズです。正しいフォームで行うことで最大の効果を得られます。`,
        tips: [
          "呼吸を意識して行う",
          "背筋をまっすぐに保つ",
          "関節に負担をかけないよう注意する",
          "フォームを優先し、無理な重量は避ける",
        ],
      }

      setSelectedExercise(exerciseData)
      setVideoModalVisible(true)
    } catch (error) {
      console.error('エクササイズ詳細取得エラー:', error)
      Alert.alert('エラー', 'エクササイズ情報の取得に失敗しました')
    }
  }

  // 編集内容を保存
  const saveWorkoutChanges = async () => {
    // デバッグ用ログ
    console.log('saveWorkoutChanges - workout object:', JSON.stringify(workout, null, 2));
    
    const dayId = workout?.dayId || workout?.id;
    if (!dayId) {
      Alert.alert('エラー', 'トレーニング情報が見つかりません')
      return false
    }

    try {
      setIsSaving(true)
      
      // 現在の種目データを適切な形式に変換
      const exercisesData = exercises.map(exercise => {
        // セットデータから回数を取得（最初の完了していないセットまたは最初のセット）
        const firstSet = exercise.sets.find(set => set.reps) || exercise.sets[0];
        const repsValue = firstSet?.reps || '8';
        
        return {
          id: exercise.id || `temp-${Date.now()}-${Math.random()}`, // IDが無い場合は一時的なIDを生成
          name: exercise.name,
          sets: exercise.sets.length, // セット数
          reps: repsValue.includes('-') ? repsValue : `${repsValue}-${repsValue}`, // 範囲形式に変換
        };
      })

      const dayData = {
        title: workout.title,
        estimated_duration: parseInt(workout.duration) || 60,
        exercises: exercisesData
      }

      console.log('saveWorkoutChanges - dayId:', dayId);
      console.log('saveWorkoutChanges - dayData:', JSON.stringify(dayData, null, 2));

      await workoutApi.updateDayWorkout(dayId, dayData)
      
      Alert.alert('保存完了', 'トレーニング内容を保存しました')
      return true
    } catch (error) {
      console.error('保存エラー:', error)
      Alert.alert('エラー', 'トレーニング内容の保存に失敗しました')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // 編集モードの切り替え
  const toggleEditMode = async () => {
    if (isEditMode) {
      // 編集モードを終了する場合、保存確認
      Alert.alert(
        '変更を保存',
        '編集した内容を保存しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel'
          },
          {
            text: '保存しない',
            style: 'destructive',
            onPress: () => setIsEditMode(false)
          },
          {
            text: '保存する',
            onPress: async () => {
              const success = await saveWorkoutChanges()
              if (success) {
                setIsEditMode(false)
              }
            }
          }
        ]
      )
    } else {
      setIsEditMode(true)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>{workout.title}</Text>
            <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
              <Clock size={14} color="#fff" />
              <Text style={styles.durationText}>{workout.duration}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.editModeButton, { backgroundColor: isEditMode ? colors.primary : colors.card, borderColor: colors.border }]}
            onPress={toggleEditMode}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size={16} color={isEditMode ? "#fff" : colors.text} />
            ) : (
              <Edit3 size={16} color={isEditMode ? "#fff" : colors.text} />
            )}
            <Text style={[styles.editModeText, { color: isEditMode ? "#fff" : colors.text }]}>
              {isSaving ? "保存中..." : isEditMode ? "完了" : "編集"}
            </Text>
          </TouchableOpacity>
        </View>

        {!workoutCompleted ? (
          <>
            <Card style={[styles.timerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.timerHeader}>
                <Text style={[styles.timerTitle, { color: colors.text }]}>休憩タイマー</Text>
                {isEditMode && (
                  <TouchableOpacity
                    style={[styles.intervalButton, { backgroundColor: colors.secondary }]}
                    onPress={() => setIntervalSettingsVisible(true)}
                  >
                    <Settings size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.timerDisplay, { color: colors.primary }]}>{formatTime(timeLeft)}</Text>
              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.timerButton, { backgroundColor: colors.primary }]}
                  onPress={toggleTimer}
                >
                  {isTimerRunning ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timerButton, { backgroundColor: colors.secondary }]}
                  onPress={resetTimer}
                >
                  <RotateCcw size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </Card>

            {exercises.map((exercise, exerciseIndex) => (
              <Card
                key={exerciseIndex}
                style={[
                  styles.exerciseCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: exerciseIndex === activeExercise ? colors.primary : colors.border,
                    borderWidth: exerciseIndex === activeExercise ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                  <View style={styles.exerciseActions}>
                    <TouchableOpacity style={styles.infoButton} onPress={() => handleInfoPress(exercise)}>
                      <Info size={18} color={colors.primary} />
                    </TouchableOpacity>
                    {isEditMode && (
                      <>
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: colors.primary }]} 
                          onPress={() => replaceExercise(exerciseIndex)}
                        >
                          <Edit3 size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: colors.error }]} 
                          onPress={() => removeExercise(exerciseIndex)}
                        >
                          <Trash2 size={16} color="#fff" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.setsContainer}>
                  <View style={styles.setHeader}>
                    <Text style={[styles.setHeaderText, { color: colors.text }]}>セット</Text>
                    <Text style={[styles.setHeaderText, { color: colors.text }]}>重量 (kg)</Text>
                    <Text style={[styles.setHeaderText, { color: colors.text }]}>回数</Text>
                    <Text style={[styles.setHeaderText, { color: colors.text }]}>完了</Text>
                    {isEditMode && <Text style={[styles.setHeaderText, { color: colors.text }]}>削除</Text>}
                  </View>

                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.setRow}>
                      <Text style={[styles.setText, { color: colors.text }]}>{setIndex + 1}</Text>
                      <Input
                        value={set.weight}
                        onChangeText={(value) => handleWeightChange(exerciseIndex, setIndex, value)}
                        keyboardType="numeric"
                        style={[styles.setInput, { borderColor: colors.border, color: colors.text }]}
                        editable={!set.completed}
                      />
                      <Input
                        value={set.reps}
                        onChangeText={(value) => handleRepsChange(exerciseIndex, setIndex, value)}
                        keyboardType="numeric"
                        style={[styles.setInput, { borderColor: colors.border, color: colors.text }]}
                        editable={!set.completed}
                      />
                      <TouchableOpacity
                        style={[
                          styles.completeButton,
                          {
                            backgroundColor: set.completed ? colors.success : colors.card,
                            borderColor: set.completed ? colors.success : colors.border,
                          },
                        ]}
                        onPress={() => handleSetComplete(exerciseIndex, setIndex)}
                        disabled={set.completed}
                      >
                        <CheckCircle size={20} color={set.completed ? "#fff" : colors.border} />
                      </TouchableOpacity>
                      {isEditMode && (
                        <TouchableOpacity
                          style={[styles.removeSetButton, { backgroundColor: colors.error }]}
                          onPress={() => removeSet(exerciseIndex, setIndex)}
                        >
                          <Trash2 size={16} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {isEditMode && (
                    <TouchableOpacity
                      style={[styles.addSetButton, { backgroundColor: colors.primary }]}
                      onPress={() => addSet(exerciseIndex)}
                    >
                      <Plus size={16} color="#fff" />
                      <Text style={styles.addSetText}>セットを追加</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))}

            {isEditMode && (
              <TouchableOpacity
                style={[styles.addExerciseButton, { backgroundColor: colors.primary }]}
                onPress={addExercise}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.addExerciseText}>種目を追加</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Card style={[styles.completionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.completionContent}>
              <CheckCircle size={60} color={colors.success} />
              <Text style={[styles.completionTitle, { color: colors.text }]}>トレーニング完了！</Text>
              <Text style={[styles.completionText, { color: colors.text }]}>
                お疲れ様でした！本日のトレーニングを完了しました。
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{workout.exercises.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>エクササイズ</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {workout.exercises.reduce((total, ex) => total + ex.sets, 0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>セット</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{workout.duration}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>トレーニング時間</Text>
                </View>
              </View>

              <Button onPress={handleShare} style={[styles.shareButton, { backgroundColor: colors.primary }]}>
                <Share2 size={20} color="#fff" />
                <Text style={styles.shareButtonText}>SNSでシェアする</Text>
              </Button>
            </View>
          </Card>
        )}
      </ScrollView>

      {selectedExercise && (
        <ExerciseVideoModal
          isVisible={videoModalVisible}
          onClose={() => setVideoModalVisible(false)}
          exercise={selectedExercise}
        />
      )}

      <ExerciseSelectorModal
        visible={exerciseSelectorVisible}
        onClose={() => setExerciseSelectorVisible(false)}
        onSelect={handleExerciseSelect}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={intervalSettingsVisible}
        onRequestClose={() => setIntervalSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.intervalModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>インターバル設定</Text>
            
            <View style={styles.intervalOptions}>
              {[30, 60, 90, 120, 180].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.intervalOption,
                    { 
                      backgroundColor: restTime === seconds ? colors.primary : colors.card,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => updateRestTime(seconds)}
                >
                  <Text style={[
                    styles.intervalOptionText,
                    { color: restTime === seconds ? "#fff" : colors.text }
                  ]}>
                    {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.secondary }]}
              onPress={() => setIntervalSettingsVisible(false)}
            >
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <WorkoutCompleteModal
        isVisible={completeModalVisible}
        onClose={() => setCompleteModalVisible(false)}
        workout={{
          title: workout.title,
          duration: workout.duration,
          exerciseCount: workout.exercises.length,
          totalSets: workout.exercises.reduce((total, ex) => total + ex.sets, 0),
          calories: 320, // Mock calorie data
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 5,
  },
  editModeButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
  },
  editModeText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  timerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "center",
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  timerDisplay: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 15,
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  timerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  intervalButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
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
    marginBottom: 15,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
  },
  exerciseActions: {
    flexDirection: "row",
    gap: 5,
  },
  infoButton: {
    padding: 5,
  },
  actionButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
  },
  setsContainer: {
    marginBottom: 10,
  },
  setHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    marginBottom: 10,
  },
  setHeaderText: {
    fontSize: 14,
    fontWeight: "500",
    width: 70,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  setText: {
    fontSize: 16,
    width: 30,
    textAlign: "center",
  },
  setInput: {
    width: 70,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "center",
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  completionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  completionContent: {
    alignItems: "center",
    padding: 20,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  completionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 30,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  removeSetButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
  },
  addSetButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  addExerciseButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
  },
  addExerciseText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  intervalModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  intervalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  intervalOption: {
    padding: 10,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
  },
  intervalOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
})