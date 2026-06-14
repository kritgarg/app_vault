import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";

/**
 * Custom 3D Card Flip component powered by react-native-reanimated.
 * Tapping triggers a y-axis rotation.
 * @param {object} props
 * @param {React.ReactNode} props.frontComponent - The component for the front face.
 * @param {React.ReactNode} props.backComponent - The component for the back face.
 */
export default function FlipCard({ frontComponent, backComponent }) {
  // Shared rotation value going from 0 (front) to 180 (back) degrees
  const rotate = useSharedValue(0);

  const handleFlip = () => {
    // 600ms timing curve for a realistic, smooth flip duration
    rotate.value = withTiming(rotate.value === 0 ? 180 : 0, { duration: 600 });
  };

  // Front view styles
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(rotate.value, [0, 180], [0, 180]);
    
    return {
      transform: [
        { perspective: 1000 }, // Creates 3D depth illusion
        { rotateY: `${spin}deg` },
      ],
      // Hide front face when flipped past 90 degrees to prevent backward-text rendering
      opacity: rotate.value < 90 ? 1 : 0,
    };
  });

  // Back view styles
  const backAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(rotate.value, [0, 180], [180, 360]);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${spin}deg` },
      ],
      // Show back face only when flipped past 90 degrees
      opacity: rotate.value >= 90 ? 1 : 0,
    };
  });

  return (
    <Pressable onPress={handleFlip} style={styles.container}>
      <Animated.View style={[styles.card, frontAnimatedStyle]}>
        {frontComponent}
      </Animated.View>
      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        {backComponent}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden", // Native property to hide back view during spins
  },
  cardBack: {
    position: "absolute",
    top: 0,
  },
});
