import { View, StyleSheet } from "react-native"
import Slider from "@react-native-community/slider"

interface SliderProps {
  value: number
  minimumValue: number
  maximumValue: number
  step: number
  onValueChange: (value: number[]) => void
  minimumTrackTintColor?: string
  maximumTrackTintColor?: string
  thumbTintColor?: string
}

export const SliderComponent = ({
  value,
  minimumValue,
  maximumValue,
  step,
  onValueChange,
  minimumTrackTintColor = "#0891b2",
  maximumTrackTintColor = "#e2e8f0",
  thumbTintColor = "#0891b2",
}: SliderProps) => {
  return (
    <View style={styles.container}>
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={(val) => onValueChange([val])}
        minimumTrackTintColor={minimumTrackTintColor}
        maximumTrackTintColor={maximumTrackTintColor}
        thumbTintColor={thumbTintColor}
        style={styles.slider}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  slider: {
    width: "100%",
    height: 40,
  },
})

