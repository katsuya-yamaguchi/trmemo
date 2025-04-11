

import type React from "react"
import { createContext, useContext, useState } from "react"
import { useColorScheme } from "react-native"

type ThemeContextType = {
  isDarkMode: boolean
  toggleTheme: () => void
  colors: {
    background: string
    text: string
    primary: string
    secondary: string
    card: string
    border: string
    success: string
    error: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark")

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const lightColors = {
    background: "#ffffff",
    text: "#1f2937",
    primary: "#0891b2",
    secondary: "#0e7490",
    card: "#f1f5f9",
    border: "#e2e8f0",
    success: "#10b981",
    error: "#ef4444",
  }

  const darkColors = {
    background: "#1f2937",
    text: "#f1f5f9",
    primary: "#06b6d4",
    secondary: "#0e7490",
    card: "#374151",
    border: "#4b5563",
    success: "#10b981",
    error: "#ef4444",
  }

  const colors = isDarkMode ? darkColors : lightColors

  return <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

