import React, { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useIsFocused, useNavigationState } from '@react-navigation/native';
import { Dimensions } from 'react-native';

const W = Dimensions.get('window').width;
const ENTER_SPRING = { damping: 22, stiffness: 200, mass: 1 };
const EXIT_SPRING  = { damping: 24, stiffness: 260, mass: 0.9 };

interface Props {
  children: React.ReactNode;
  tabIndex: number;
}

export function AnimatedTabScreen({ children, tabIndex }: Props) {
  const isFocused    = useIsFocused();
  const activeIndex  = useNavigationState(s => s.index);
  const prevActive   = useRef(activeIndex);

  const translateX = useSharedValue(isFocused ? 0 : W);
  const opacity    = useSharedValue(isFocused ? 1 : 0);

  // Run BEFORE prevActive update so we read the old index
  useEffect(() => {
    cancelAnimation(translateX);
    cancelAnimation(opacity);

    if (isFocused) {
      const fromRight = prevActive.current < tabIndex;
      opacity.value    = 0;
      translateX.value = fromRight ? W : -W;
      translateX.value = withSpring(0, ENTER_SPRING);
      opacity.value    = withTiming(1, { duration: 180 });
    } else {
      const exitToLeft = activeIndex > tabIndex;
      translateX.value = withSpring(exitToLeft ? -W * 0.3 : W * 0.3, EXIT_SPRING);
      opacity.value    = withTiming(0, { duration: 160 });
    }
  }, [isFocused]);

  // Update ref AFTER the above effect
  useEffect(() => {
    prevActive.current = activeIndex;
  }, [activeIndex]);

  const animStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}
