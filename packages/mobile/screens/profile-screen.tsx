import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView } from "react-native"
import { useTheme } from "../context/theme-context"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/card"
import { User, Bell, Moon, LogOut, ChevronRight, Shield, HelpCircle, FileText, Share2 } from "lucide-react-native"

export default function ProfileScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState("08:00")

  const handleSignOut = async () => {
    Alert.alert("ログアウト", "ログアウトしてもよろしいですか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "ログアウト",
        onPress: signOut,
        style: "destructive",
      },
    ])
  }

  const handleNotificationToggle = () => {
    if (notificationsEnabled) {
      Alert.alert("通知をオフにする", "トレーニングのリマインダーが届かなくなります。よろしいですか？", [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "オフにする",
          onPress: () => setNotificationsEnabled(false),
        },
      ])
    } else {
      // In a real app, this would request notification permissions
      setNotificationsEnabled(true)
    }
  }

  const handleTimeChange = () => {
    // In a real app, this would open a time picker
    Alert.alert("リマインダー時刻", "通知を受け取る時間を選択してください", [
      {
        text: "朝 8:00",
        onPress: () => setReminderTime("08:00"),
      },
      {
        text: "昼 12:00",
        onPress: () => setReminderTime("12:00"),
      },
      {
        text: "夕方 18:00",
        onPress: () => setReminderTime("18:00"),
      },
      {
        text: "夜 20:00",
        onPress: () => setReminderTime("20:00"),
      },
      {
        text: "キャンセル",
        style: "cancel",
      },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>プロフィール</Text>
        </View>

        <Card style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <User size={30} color="#fff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.email?.split("@")[0] || "ユーザー"}</Text>
              <Text style={[styles.userEmail, { color: colors.text }]}>{user?.email || "user@example.com"}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={[styles.editButtonText, { color: colors.primary }]}>プロフィールを編集</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>アカウント設定</Text>

          <Card style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <User size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>アカウント情報</Text>
              </View>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Shield size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>プライバシー設定</Text>
              </View>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
              <View style={styles.settingLeft}>
                <LogOut size={20} color="#ef4444" style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: "#ef4444" }]}>ログアウト</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>通知設定</Text>

          <Card style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Bell size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>通知</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[styles.settingItem, !notificationsEnabled && styles.disabledSetting]}
              onPress={handleTimeChange}
              disabled={!notificationsEnabled}
            >
              <View style={styles.settingLeft}>
                <Text style={[styles.settingText, { color: colors.text, opacity: notificationsEnabled ? 1 : 0.5 }]}>
                  リマインダー時刻
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: colors.primary, opacity: notificationsEnabled ? 1 : 0.5 }]}>
                  {reminderTime}
                </Text>
                <ChevronRight size={20} color={colors.text} style={{ opacity: notificationsEnabled ? 1 : 0.5 }} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>アプリ設定</Text>

          <Card style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Moon size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>ダークモード</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Share2 size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>SNS連携</Text>
              </View>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>その他</Text>

          <Card style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <HelpCircle size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>ヘルプ・サポート</Text>
              </View>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <FileText size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>利用規約・プライバシーポリシー</Text>
              </View>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingText, { color: colors.text }]}>アプリバージョン</Text>
              </View>
              <Text style={[styles.versionText, { color: colors.text }]}>1.0.0</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  editButton: {
    alignSelf: "flex-end",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  disabledSetting: {
    opacity: 0.7,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 5,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.7,
  },
})

