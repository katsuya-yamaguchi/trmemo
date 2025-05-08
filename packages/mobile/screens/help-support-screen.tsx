import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useTheme } from '../context/theme-context';
import { ChevronLeft, LifeBuoy, MessageSquare, ExternalLink, FileText } from 'lucide-react-native'; // Example icons

// Mock data for help topics
const helpTopics = [
  // { id: '1', title: 'よくある質問 (FAQ)', icon: <FileText />, screen: 'FAQ' }, // Placeholder, could navigate to a specific FAQ screen or open a web link
  // { id: '2', title: 'アプリの使い方', icon: <LifeBuoy />, screen: 'AppUsageGuide' }, // Placeholder
  { id: '3', title: 'お問い合わせ', icon: <MessageSquare />, screen: 'ContactUsScreen' }, // Changed to specific screen name for navigation
  { id: '4', title: '利用規約', icon: <FileText/>, screen: 'TermsOfService' }, // Changed from action to screen
  { id: '5', title: 'プライバシーポリシー', icon: <FileText/>, action: () => Linking.openURL('https://example.com/privacy') }, // Example external link
];

export default function HelpSupportScreen({ navigation }) {
  const { colors } = useTheme();
  const textMutedColor = colors.textMuted || colors.text; // Fallback for textMuted

  const handlePressTopic = (topic) => {
    if (topic.action) {
      topic.action();
    } else if (topic.screen) {
      if (topic.screen === 'ContactUsScreen') {
        navigation.navigate('ContactUsScreen'); // Navigate to ContactUsScreen
      } else if (topic.screen === 'TermsOfService') { // Added condition for TermsOfService
        navigation.navigate('TermsOfService');
      } else {
        console.log(`Navigate to ${topic.screen}`);
        // Potentially navigate to other screens like FAQ, AppUsageGuide when they are created
        // navigation.navigate(topic.screen); 
      }
    } else {
      console.warn('No action or screen defined for this topic');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ヘルプ・サポート</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>
        <Text style={[styles.introText, { color: textMutedColor, borderBottomColor: colors.border}]}>
          お困りのことやご不明な点がございましたら、以下のオプションからご確認ください。
        </Text>

        {helpTopics.map((topic, index) => (
          <TouchableOpacity 
            key={topic.id} 
            style={[
              styles.topicItem,
              { backgroundColor: colors.card, borderColor: colors.border },
              index === helpTopics.length -1 && {borderBottomWidth: 0} // No border for last item if inside a card container
            ]}
            onPress={() => handlePressTopic(topic)}
          >
            <View style={styles.topicIconContainer}>
             {React.cloneElement(topic.icon, { size: 22, color: colors.primary })}
            </View>
            <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
            <ChevronLeft size={20} color={textMutedColor} style={styles.topicArrow} />{/* Using ChevronLeft as placeholder for right arrow by rotating or using ChevronRight*/}
          </TouchableOpacity>
        ))}

        <View style={[styles.contactSection, {marginTop: 30, borderColor: colors.border /* Use theme border */}]}>
            <Text style={[styles.contactHeader, {color: textMutedColor}]}>解決しない場合</Text>
            <TouchableOpacity 
                style={[styles.contactButton, {backgroundColor: colors.primary}]} 
                onPress={() => Linking.openURL('mailto:support@example.com')}
            >
                <MessageSquare size={20} color="#fff" style={{marginRight: 8}}/>
                <Text style={styles.contactButtonText}>メールで問い合わせる</Text>
            </TouchableOpacity>
        </View>
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
  introText: {
    fontSize: 15,
    marginBottom: 20,
    paddingBottom: 15,
    lineHeight: 22,
    borderBottomWidth: 1,
    textAlign: 'center',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12, // Spacing between items
  },
  topicIconContainer: {
      marginRight: 15,
      width: 24, // to align text nicely
      alignItems: 'center',
  },
  topicTitle: {
    fontSize: 16,
    flex: 1,
  },
  topicArrow: {
    transform: [{ rotate: '180deg' }], // Placeholder for ChevronRight
    opacity: 0.5,
  },
  contactSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  contactHeader: {
      fontSize: 14,
      marginBottom: 15,
  },
  contactButton: {
      flexDirection: 'row',
      paddingHorizontal: 25,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
  },
  contactButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
  }
}); 