import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useTheme } from '../context/theme-context';
import { ChevronLeft, Mail, Send } from 'lucide-react-native'; 

const SUPPORT_EMAIL = 'support@example.com'; // Replace with your actual support email

export default function ContactUsScreen({ navigation }) {
  const { colors } = useTheme();
  const textMutedColor = colors.text; // Use colors.text directly as textMuted is not defined

  const handleEmailPress = async () => {
    const subject = 'アプリに関するお問い合わせ';
    // You can add more device/user info to the body if needed
    const body = `\n\n---\nアプリバージョン: 1.0.0\nOS: [ユーザーのOS情報]\nユーザーID: [ユーザーIDなど]`; 
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('エラー', 'メールアプリを開けませんでした。メール設定を確認してください。');
      }
    } catch (error) {
      console.error('Failed to open mail app:', error);
      Alert.alert('エラー', 'メールアプリの起動中に問題が発生しました。');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>お問い合わせ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.iconContainer, {backgroundColor: colors.primary + '20' /* Lighter primary */}]}>
            <Mail size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>サポートが必要ですか？</Text>
        <Text style={[styles.description, { color: textMutedColor }]}>
          アプリに関するご質問、ご要望、不具合報告などがございましたら、お気軽に下記のボタンからメールでお問い合わせください。
        </Text>
        <Text style={[styles.supportEmailText, { color: textMutedColor }]}>
          サポートメールアドレス: {SUPPORT_EMAIL}
        </Text>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={handleEmailPress}
        >
          <Send size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>メールで問い合わせる</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
            <Text style={[styles.infoText, {color: textMutedColor}]}>・お問い合わせには数日かかる場合がございます。</Text>
            <Text style={[styles.infoText, {color: textMutedColor}]}>・可能な限り詳細な情報をご記入ください。</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Ensures content can scroll if it overflows, and centers if not
    padding: 20,
    alignItems: 'center', // Center content horizontally
    justifyContent: 'center', // Center content vertically if not enough to scroll
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
  iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10, // Avoid text sticking to edges
  },
  supportEmailText: {
      fontSize: 14,
      marginBottom: 30,
      opacity: 0.8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%', // Make button wider
    maxWidth: 350, // Max width for larger screens
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
      marginTop: 30,
      alignSelf: 'stretch',
      paddingHorizontal: 10,
  },
  infoText: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8,
      opacity: 0.7,
  }
}); 