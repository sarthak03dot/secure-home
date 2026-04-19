import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

interface RadarScannerProps {
  isMotionDetected?: boolean;
}

const RadarScanner: React.FC<RadarScannerProps> = ({ isMotionDetected }) => {
  const rotationValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    rotationValue.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    if (isMotionDetected) {
      pulseValue.value = withRepeat(
        withTiming(1.3, { duration: 500 }),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 500 });
    }
  }, [isMotionDetected]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotationValue.value}deg` }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
      opacity: interpolate(pulseValue.value, [1, 1.3], [0.8, 1]),
    };
  });

  return (
    <View style={styles.container}>
      {/* Outer Rings */}
      <Svg height="220" width="220" viewBox="0 0 100 100" style={styles.svg}>
        <Circle cx="50" cy="50" r="48" stroke={COLORS.glassBorder} strokeWidth="0.5" fill="none" />
        <Circle cx="50" cy="50" r="35" stroke={COLORS.glassBorder} strokeWidth="0.5" fill="none" />
        <Circle cx="50" cy="50" r="20" stroke={COLORS.glassBorder} strokeWidth="0.5" fill="none" />
      </Svg>

      {/* Animated Sweep - Moved outside Svg */}
      <Animated.View style={[styles.sweepContainer, animatedStyle]}>
        <Svg height="220" width="220" viewBox="0 0 100 100">
          <Path
            d="M 50 50 L 50 2 A 48 48 0 0 1 98 50 Z"
            fill={COLORS.primary}
            opacity="0.2"
          />
          <Path
            d="M 50 50 L 50 2"
            stroke={COLORS.primary}
            strokeWidth="1"
            opacity="0.6"
          />
        </Svg>
      </Animated.View>

      {/* Center Point - Moved outside Svg */}
      <Animated.View style={[styles.centerPoint, pulseStyle]}>
        <View style={[
          styles.dot,
          { backgroundColor: isMotionDetected ? COLORS.danger : COLORS.primary }
        ]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  svg: {
    position: 'relative',
  },
  sweepContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    top: 0,
    left: 0,
  },
  centerPoint: {
    position: 'absolute',
    top: 47,
    left: 47,
    width: 6,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default RadarScanner;
