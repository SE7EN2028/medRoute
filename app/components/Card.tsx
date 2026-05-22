import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { colors } from '@app/theme/colors';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  style?: ViewStyle | ViewStyle[];
  bg?: string;
  borderColor?: string;
}

export function Card({ children, onPress, padding = 16, style, bg = colors.paper, borderColor = colors.line }: Props) {
  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor,
    padding,
  };
  const merged = Array.isArray(style) ? [base, ...style] : [base, style as ViewStyle];
  if (!onPress) return <View style={merged}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        merged,
        { opacity: pressed ? 0.86 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}
