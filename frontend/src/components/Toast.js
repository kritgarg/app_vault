import React, { useEffect } from "react";
import { StyleSheet, Text, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

/**
 * Premium reusable Toast component using react-native-reanimated for fade animations.
 * @param {object} props
 * @param {string} props.message - Text to show in the toast.
 * @param {boolean} props.visible - Controls visibility.
 * @param {function} props.onHide - Callback fired when the toast finishes fading out.
 */
export default function Toast({ message, visible, onHide }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Fade in toast
      opacity.value = withTiming(1, { duration: 250 });

      // Automatically trigger fade out after 2 seconds
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 250 }, (finished) => {
          if (finished && onHide) {
            runOnJS(onHide)();
          }
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, onHide, opacity]);

  // Simple Y translation interpolation to animate the toast sliding up slightly as it fades in
  function interpolateOpacityToY(value) {
    "worklet";
    return (1 - value) * 15; // Translates from 15px to 0px
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateY: interpolateOpacityToY(opacity.value),
      },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <Text style={styles.toastText}>✅ {message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 50,
    left: 40,
    right: 40,
    backgroundColor: "rgba(0, 179, 126, 0.95)", // Glassy emerald accent
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
