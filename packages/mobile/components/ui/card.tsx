

import React from "react"
import { View, StyleSheet, type ViewProps } from "react-native"
import { useTheme } from "../../context/theme-context"

interface CardProps extends ViewProps {
  children: React.ReactNode
}

export const Card = React.forwardRef<View, CardProps>(({ style, children, ...props }, ref) => {
  const { colors } = useTheme()

  return (
    <View
      ref={ref}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
})

