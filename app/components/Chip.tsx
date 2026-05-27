import React, { useRef } from 'react';
import { Pressable, Text, View, Animated, StyleSheet } from 'react-native';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

interface Props {
  children: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Chip({ children, active, onPress, icon }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 2 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button" accessibilityState={{ selected: !!active }}>
      <Animated.View style={[styles.base, active ? styles.active : styles.inactive, { transform: [{ scale }] }]}>
        {icon != null && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  active: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  inactive: {
    backgroundColor: colors.cream,
    borderColor: colors.line2,
  },
  iconWrap: {
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
  },
  labelActive: {
    color: colors.cream2,
    fontFamily: fonts.sansSemi,
  },
  labelInactive: {
    color: colors.ink2,
    fontFamily: fonts.sansMedium,
  },
});
