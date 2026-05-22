import React from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@app/theme/colors';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  accessibilityLabel?: string;
}

export function Toggle({ value, onChange, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 46,
        height: 28,
        borderRadius: 999,
        backgroundColor: value ? colors.terra : colors.ink,
        padding: 3,
        opacity: pressed ? 0.85 : 1,
        // Dark shadow when off, terra glow when on
        shadowColor: value ? colors.terra : '#1A1A17',
        shadowOpacity: value ? 0.35 : 0.45,
        shadowRadius: value ? 6 : 4,
        shadowOffset: { width: 0, height: value ? 3 : 2 },
        elevation: 3,
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: '#fff',
          transform: [{ translateX: value ? 18 : 0 }],
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      />
    </Pressable>
  );
}
