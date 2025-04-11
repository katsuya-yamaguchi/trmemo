import { useState } from "react"
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from "react-native"
import { useTheme } from "../context/theme-context"
import { Card } from "./ui/card"
import { Bell, Clock, Calendar, Award, ChevronRight } from "lucide-react-native"

export default function NotificationSettings() {
  const { colors } = useTheme()
  const [settings, setSettings] = useState({
    reminders: true,
    achievements: true,
    weeklyReports: true,
    tips: false,
  })
  const [reminderTime, setReminderTime] = useState("08:00")

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
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
    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Bell size={20} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingText, { color: colors.text }]}>トレーニングリマインダー</Text>
        </View>
        <Switch
          value={settings.reminders}
          onValueChange={() => toggleSetting("reminders")}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <TouchableOpacity
        style={[styles.settingItem, !settings.reminders && styles.disabledSetting]}
        onPress={handleTimeChange}
        disabled={!settings.reminders}
      >
        <View style={styles.settingLeft}>
          <Clock
            size={20}
            color={colors.primary}
            style={[styles.settingIcon, !settings.reminders && { opacity: 0.5 }]}
          />
          <Text style={[styles.settingText, { color: colors.text, opacity: settings.reminders ? 1 : 0.5 }]}>
            リマインダー時刻
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: colors.primary, opacity: settings.reminders ? 1 : 0.5 }]}>
            {reminderTime}
          </Text>
          <ChevronRight size={20} color={colors.text} style={{ opacity: settings.reminders ? 1 : 0.5 }} />
        </View>
      </TouchableOpacity>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Award size={20} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingText, { color: colors.text }]}>達成通知</Text>
        </View>
        <Switch
          value={settings.achievements}
          onValueChange={() => toggleSetting("achievements")}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Calendar size={20} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingText, { color: colors.text }]}>週間レポート</Text>
        </View>
        <Switch
          value={settings.weeklyReports}
          onValueChange={() => toggleSetting("weeklyReports")}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
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
})

