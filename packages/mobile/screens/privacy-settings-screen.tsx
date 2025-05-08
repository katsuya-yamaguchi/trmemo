import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useTheme } from '../context/theme-context';
import { ChevronLeft, Eye, Share2, ShieldCheck } from 'lucide-react-native'; // Example icons

export default function PrivacySettingsScreen({ navigation }) {
  const { colors } = useTheme();

  // Mock state for privacy settings
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [allowDataSharing, setAllowDataSharing] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const textMutedColor = colors.textMuted || colors.text; // Fallback for textMuted

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>プライバシー設定</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Eye size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.label, { color: colors.text }]}>プロフィールの公開</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
              onValueChange={setIsProfilePublic}
              value={isProfilePublic}
            />
          </View>
          <Text style={[styles.description, { color: textMutedColor }]}>
            他のユーザーにあなたのプロフィール情報（活動履歴など）を公開します。
          </Text>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Share2 size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.label, { color: colors.text }]}>データ共有の許可</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
              onValueChange={setAllowDataSharing}
              value={allowDataSharing}
            />
          </View>
          <Text style={[styles.description, { color: textMutedColor }]}>
            匿名化されたデータをサービス改善のために共有することを許可します。
          </Text>
           <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <ShieldCheck size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.label, { color: colors.text }]}>二段階認証</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
              onValueChange={setTwoFactorAuth}
              value={twoFactorAuth}
            />
          </View>
          <Text style={[styles.description, { color: textMutedColor }]}>
            セキュリティ強化のため、ログイン時に二段階認証を有効にします。
          </Text>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={() => {/* Navigate to full privacy policy */}}>
            <Text style={[styles.linkText, {color: colors.primary}]}>プライバシーポリシー全文を読む</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    paddingBottom: 8, // For description text padding
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensure switch is on the right
    paddingVertical: 12, // Reduced padding for rows with descriptions
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    flex: 1, 
  },
  separator: {
    height: 1,
    marginLeft: 16 + 20 + 12, // Icon width + icon margin + text margin alignment
    marginVertical: 8, // Space around separator
  },
  description: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12, // Space after description
    opacity: 0.7,
    lineHeight: 18,
  },
  linkButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
}); 