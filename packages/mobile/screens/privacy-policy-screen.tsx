import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { useTheme } from '../context/theme-context';
import { ChevronLeft } from 'lucide-react-native';
import { workoutApi } from '../services/api';
import MarkdownDisplay from 'react-native-markdown-display';

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const [policyContent, setPolicyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await workoutApi.getPrivacyPolicy();
        if (response && typeof response.content === 'string') {
          setPolicyContent(response.content);
        } else {
          throw new Error('プライバシーポリシーの形式が正しくありません。');
        }
      } catch (err: any) {
        console.error('Failed to fetch privacy policy:', err);
        setError(err.message || 'プライバシーポリシーの取得に失敗しました。');
        Alert.alert('エラー', err.message || 'プライバシーポリシーの取得に失敗しました。');
      }
      setIsLoading(false);
    };

    fetchPolicy();
  }, []);

  const markdownStyles = StyleSheet.create({
    body: { color: colors.text, fontSize: 15, lineHeight: 24 },
    heading1: { color: colors.text, fontSize: 28, fontWeight: 'bold', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 5 },
    heading2: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 18, marginBottom: 8 },
    heading3: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 6 },
    link: { color: colors.primary, textDecorationLine: 'underline' },
    bullet_list_icon: { color: colors.text },
    ordered_list_icon: { color: colors.text },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>プライバシーポリシー</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error || 'red' }]}>{error}</Text>
        ) : (
          <MarkdownDisplay style={markdownStyles}>
            {policyContent}
          </MarkdownDisplay>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingVertical: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24 + 16,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
  },
}); 