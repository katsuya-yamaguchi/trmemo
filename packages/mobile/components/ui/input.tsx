

import React from "react"
import { TextInput, type TextInputProps, StyleSheet } from "react-native"
import { useTheme } from "../../context/theme-context"

interface InputProps extends TextInputProps {
  // Add any additional props here
}

export const Input = React.forwardRef<TextInput, InputProps>(({ style, ...props }, ref) => {
  const { colors } = useTheme()

  return (
    <TextInput
      ref={ref}
      style={[
        styles.input,
        {
          backgroundColor: colors.background,
          color: colors.text,
          borderColor: colors.border,
        },
        style,
      ]}
      placeholderTextColor={colors.text + "80"} // 50% opacity
      {...props}
    />
  )
})

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
})

