import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useAuth } from "../context/auth-context"
import { useTheme } from "../context/theme-context"
import { Mail, Lock, Apple, Facebook } from "lucide-react-native"

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signIn, signUp, signInWithSocial, isLoading } = useAuth()
  const { colors } = useTheme()

  const handleAuth = async () => {
    if (isLogin) {
      await signIn(email, password)
    } else {
      await signUp(email, password)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image source={{ uri: "/placeholder.svg?height=100&width=100" }} style={styles.logo} />
            <Text style={[styles.appName, { color: colors.primary }]}>MUSCLE BOOST</Text>
            <Text style={[styles.tagline, { color: colors.text }]}>20代のための筋力向上アプリ</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={colors.primary} style={styles.inputIcon} />
              <Input
                placeholder="メールアドレス"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={colors.primary} style={styles.inputIcon} />
              <Input
                placeholder="パスワード"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <Button
              onPress={handleAuth}
              disabled={isLoading}
              style={[styles.authButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.authButtonText}>{isLogin ? "ログイン" : "新規登録"}</Text>
            </Button>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={[styles.switchText, { color: colors.primary }]}>
                {isLogin ? "新規登録はこちら" : "ログインはこちら"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text }]}>または</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: "#000" }]}
              onPress={() => signInWithSocial("apple")}
            >
              <Apple size={20} color="#fff" />
              <Text style={styles.socialButtonText}>Appleでサインイン</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: "#4267B2" }]}
              onPress={() => signInWithSocial("facebook")}
            >
              <Facebook size={20} color="#fff" />
              <Text style={styles.socialButtonText}>Facebookでログイン</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: "#DB4437" }]}
              onPress={() => signInWithSocial("google")}
            >
              <Image source={{ uri: "/placeholder.svg?height=20&width=20" }} style={styles.googleIcon} />
              <Text style={styles.socialButtonText}>Googleでログイン</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    opacity: 0.8,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  authButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  authButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchText: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialContainer: {
    gap: 15,
  },
  socialButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
})

