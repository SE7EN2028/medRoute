import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

interface Props {
  children: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Chip({ children, active, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        height: 34,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? colors.ink : colors.paper,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.line2,
        opacity: pressed ? 0.86 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
      <Text style={{ color: active ? colors.cream2 : colors.ink2, fontFamily: fonts.sansMedium, fontSize: 13 }}>
        {children}
      </Text>
    </Pressable>
  );
}
