import React from 'react';
import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Home, Dumbbell, BarChart2, User, Library } from "lucide-react-native"

// Screens
import AuthScreen from "./screens/auth-screen"
import HomeScreen from "./screens/home-screen"
import TrainingScreen from "./screens/training-screen"
import ProgressScreen from "./screens/progress-screen"
import ProfileScreen from "./screens/profile-screen"
import TrainingDetailScreen from "./screens/training-detail-screen"
import OnboardingScreen from "./screens/onboarding-screen"
import ExerciseLibraryScreen from "./screens/exercise-library-screen"

// Context
import { AuthProvider, useAuth } from "./context/auth-context"
import { ThemeProvider } from "./context/theme-context"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === "ホーム") {
            return <Home size={size} color={color} />
          } else if (route.name === "トレーニング") {
            return <Dumbbell size={size} color={color} />
          } else if (route.name === "進捗") {
            return <BarChart2 size={size} color={color} />
          } else if (route.name === "プロフィール") {
            return <User size={size} color={color} />
          } else if (route.name === "ライブラリ") {
            return <Library size={size} color={color} />
          }
        },
        tabBarActiveTintColor: "#0891b2",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="ホーム" component={HomeScreen} />
      <Tab.Screen name="トレーニング" component={TrainingScreen} />
      <Tab.Screen name="ライブラリ" component={ExerciseLibraryScreen} />
      <Tab.Screen name="進捗" component={ProgressScreen} />
      <Tab.Screen name="プロフィール" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, isLoading } = useAuth()
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  // Simulate checking if user has completed onboarding
  useEffect(() => {
    if (user) {
      // In a real app, you would check if the user has completed onboarding
      // For now, we'll just set it to true after a delay
      const timer = setTimeout(() => {
        setHasCompletedOnboarding(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [user])

  if (isLoading) {
    return null // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="TrainingDetail"
            component={TrainingDetailScreen}
            options={{
              headerShown: true,
              title: "トレーニング詳細",
              headerBackTitle: "戻る",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

