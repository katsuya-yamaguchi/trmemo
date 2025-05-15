import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView, ActivityIndicator, Image } from "react-native"
import { useTheme } from "../context/theme-context"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/card"
import { User, Bell, Moon, LogOut, ChevronRight, Shield, HelpCircle, FileText, Share2, UserCircle } from "lucide-react-native"
import { useNavigation, NavigationProp } from "@react-navigation/native"
import { RootStackParamList } from "../types/navigation"
import { userApi } from "../services/api"

// APIから返されるプロファイルデータの型定義
interface UserProfileData {
  id: string;
  email: string;
  name: string | null;
  profile_image_url: string | null;
  // two_factor_enabled: boolean | null; // 必要なら追加
  // created_at: string | null; // 必要なら追加
}

export default function ProfileScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState("08:00")
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          setLoadingProfile(true)
          const profileData = await userApi.getProfile()
          setUserProfile(profileData)
        } catch (error) {
          console.error("Failed to fetch user profile:", error)
          Alert.alert("エラー", "プロフィール情報の取得に失敗しました。")
        } finally {
          setLoadingProfile(false)
        }
      } else {
        setLoadingProfile(false)
        setUserProfile(null)
      }
    }

    fetchUserProfile()
  }, [user])

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

  const renderAvatar = () => {
    if (loadingProfile) {
      return <ActivityIndicator size="small" color="#fff" />
    }
    if (userProfile?.profile_image_url) {
      return <Image source={{ uri: userProfile.profile_image_url }} style={styles.avatarImage} />
    }
    return <User size={30} color="#fff" />
  }
  
  const displayName = loadingProfile 
    ? (user?.email?.split("@")[0] || "ユーザー") 
    : (userProfile?.name || userProfile?.email?.split("@")[0] || "ユーザー")

  const displayEmail = loadingProfile 
    ? (user?.email || "user@example.com") 
    : (userProfile?.email || "user@example.com")

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>プロフィール</Text>
        </View>

        <Card style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              {renderAvatar()}
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.userEmail, { color: colors.text }]}>{displayEmail}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AccountInfo')}>
            <Text style={[styles.editButtonText, { color: colors.primary }]}>アカウント情報を表示</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>アカウント設定</Text>

          <Card style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => navigation.navigate('AccountInfo')}
            >
              <View style={styles.settingLeft}>
                <UserCircle size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>アカウント情報</Text>
              </View>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('PrivacySettings')}
            >
              <View style={styles.settingLeft}>
                <Shield size={20} color={colors.text} style={styles.settingIcon} />
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
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <View style={styles.settingLeft}>
                <HelpCircle size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>ヘルプ・サポート</Text>
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
    overflow: 'hidden', // 画像が丸く収まるように
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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

