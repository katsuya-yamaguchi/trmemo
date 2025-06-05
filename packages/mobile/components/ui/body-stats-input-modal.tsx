import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../context/theme-context';
import { Button } from './button';
import { userApi } from '../../services/api';
import { BodyStatInput } from '../../types/body-stats';

interface BodyStatsInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function BodyStatsInputModal({ visible, onClose, onSave }: BodyStatsInputModalProps) {
  const { colors } = useTheme();
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : undefined;

    // バリデーション
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('エラー', '正しい体重を入力してください');
      return;
    }

    if (bodyFat && (isNaN(bodyFatNum!) || bodyFatNum! < 0 || bodyFatNum! > 100)) {
      Alert.alert('エラー', '体脂肪率は0-100の範囲で入力してください');
      return;
    }

    setLoading(true);
    try {
      const bodyStats: BodyStatInput = {
        weight: weightNum,
        body_fat_percentage: bodyFatNum,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      };

      const response = await userApi.recordBodyStats(bodyStats);
      
      if (response.success) {
        Alert.alert('成功', '体重データを記録しました', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onSave(); // データリフレッシュ
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert('エラー', response.error || '記録に失敗しました');
      }
    } catch (error: any) {
      Alert.alert('エラー', error.message || '記録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setWeight('');
    setBodyFat('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                体重・体脂肪率を記録
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  体重 (kg) *
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="例: 70.5"
                  placeholderTextColor={colors.text + '80'}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  体脂肪率 (%) <Text style={styles.optional}>任意</Text>
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  placeholder="例: 15.2"
                  placeholderTextColor={colors.text + '80'}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={handleClose}
                style={[styles.cancelButton, { borderColor: colors.border }]}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  キャンセル
                </Text>
              </Button>
              <Button
                onPress={handleSave}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? '記録中...' : '記録する'}
                </Text>
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  optional: {
    fontSize: 14,
    fontWeight: 'normal',
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 