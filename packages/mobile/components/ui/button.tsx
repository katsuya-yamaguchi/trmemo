

import React from "react"
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type TouchableOpacityProps } from "react-native"
import { useTheme } from "../../context/theme-context"

interface ButtonProps extends TouchableOpacityProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  isLoading?: boolean
  children: React.ReactNode
}

export const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  ({ variant = "default", size = "default", isLoading = false, style, disabled, children, ...props }, ref) => {
    const { colors } = useTheme()

    const getVariantStyles = () => {
      switch (variant) {
        case "outline":
          return {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: colors.primary,
          }
        case "ghost":
          return {
            backgroundColor: "transparent",
            borderWidth: 0,
          }
        default:
          return {
            backgroundColor: colors.primary,
            borderWidth: 0,
          }
      }
    }

    const getSizeStyles = () => {
      switch (size) {
        case "sm":
          return {
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
          }
        case "lg":
          return {
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 10,
          }
        default:
          return {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
          }
      }
    }

    const getTextColor = () => {
      if (disabled) return colors.text + "50" // 30% opacity

      switch (variant) {
        case "outline":
        case "ghost":
          return colors.primary
        default:
          return "#fff"
      }
    }

    return (
      <TouchableOpacity
        ref={ref}
        style={[styles.button, getVariantStyles(), getSizeStyles(), disabled && { opacity: 0.5 }, style]}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={getTextColor()} />
        ) : typeof children === "string" ? (
          <Text style={[styles.text, { color: getTextColor() }]}>{children}</Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    )
  },
)

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
})

