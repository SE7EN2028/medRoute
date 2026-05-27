import React, { useEffect, useRef } from 'react';
import { Pressable, View, Animated, StyleSheet } from 'react-native';
import { colors } from '@app/theme/colors';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  accessibilityLabel?: string;
}

export function Toggle({ value, onChange, accessibilityLabel }: Props) {
  const translateX = useRef(new Animated.Value(value ? 18 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 18 : 0,
      useNativeDriver: true,
      speed: 32,
      bounciness: 3,
    }).start();
  }, [value]);

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.terra,
    shadowColor: colors.terra,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  trackOff: {
    backgroundColor: '#C8C2BB',
    shadowColor: '#1A1A17',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.paper,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
