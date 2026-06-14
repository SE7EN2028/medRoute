import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { useIsFocused, useNavigationState } from '@react-navigation/native';

const W = Dimensions.get('window').width;

interface Props {
  children: React.ReactNode;
  tabIndex: number;
}

export function AnimatedTabScreen({ children, tabIndex }: Props) {
  const isFocused   = useIsFocused();
  const activeIndex = useNavigationState(s => s.index);
  const prevActive  = useRef(activeIndex);

  const translateX = useRef(new Animated.Value(isFocused ? 0 : W)).current;
  const opacity    = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    if (isFocused) {
      const fromRight = prevActive.current < tabIndex;
      translateX.setValue(fromRight ? W : -W);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, tension: 200, friction: 22, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      const exitToLeft = activeIndex > tabIndex;
      Animated.parallel([
        Animated.spring(translateX, { toValue: exitToLeft ? -W * 0.3 : W * 0.3, tension: 260, friction: 24, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [isFocused]);

  useEffect(() => {
    prevActive.current = activeIndex;
  }, [activeIndex]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}
