import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/theme-context';
import { useAuth } from '../context/auth-context';
import { ChevronLeft, User, Mail } from 'lucide-react-native'; // Assuming you use lucide icons

export default function AccountInfoScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth(); // Get user info from auth context

  // directly in the style object can sometimes lead to issues with linters/compilers.
  // It's safer to resolve it to a variable first.
  const textDetailColor = colors.text; // Use colors.text directly as textDetail is not defined

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>アカウント情報</Text>
        <View style={styles.placeholder} /> 
      </View>

      <ScrollView style={styles.container}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <User size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.label, { color: colors.text }]}>ユーザー名</Text>
            <Text style={[styles.value, { color: textDetailColor }]}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || '未設定'}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Mail size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.label, { color: colors.text }]}>メールアドレス</Text>
            <Text style={[styles.value, { color: textDetailColor }]}>{user?.email || '未設定'}</Text>
          </View>
        </View>

        {/* TODO: Add password change option later */}
        {
          /*
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={() => {
              // Navigate to password change screen 
            }}
          >
            <Text style={styles.buttonText}>パスワードを変更</Text>
          </TouchableOpacity>
          */
        }
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
    marginLeft: -8, // Adjust for better touch area
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: { // To balance the header title
    width: 24 + 16, // Icon size + padding
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden', // Ensures border radius applies to children separators
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    flex: 1, // Takes available space
  },
  value: {
    fontSize: 16,
    opacity: 0.7,
  },
  separator: {
    height: 1,
    marginLeft: 16, // Align with text, not icon
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 