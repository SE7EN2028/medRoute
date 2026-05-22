import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

export type BtnVariant =
  | 'primary' | 'sage' | 'brick' | 'terra'
  | 'outline' | 'ghost' | 'soft' | 'bricksoft' | 'paper';
export type BtnSize = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: BtnVariant;
  size?: BtnSize;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  accessibilityLabel?: string;
}

const SIZES: Record<BtnSize, { px: number; height: number; fs: number }> = {
  sm: { px: 14, height: 38, fs: 14 },
  md: { px: 18, height: 48, fs: 15 },
  lg: { px: 22, height: 56, fs: 16 },
  xl: { px: 26, height: 64, fs: 17 },
};

interface VariantSpec {
  bg: string;
  fg: string;
  border: string;
  disabledBg: string;
  disabledFg: string;
}

const DISABLED_BG = '#B5AFA3';
const DISABLED_FG = '#FFFFFF';

const V: Record<BtnVariant, VariantSpec> = {
  primary:   { bg: '#000000',        fg: '#FFFFFF',     border: 'transparent', disabledBg: DISABLED_BG,          disabledFg: DISABLED_FG },
  sage:      { bg: '#2E6859',        fg: '#FFFFFF',     border: 'transparent', disabledBg: DISABLED_BG,          disabledFg: DISABLED_FG },
  brick:     { bg: '#B8463A',        fg: '#FFFFFF',     border: 'transparent', disabledBg: DISABLED_BG,          disabledFg: DISABLED_FG },
  terra:     { bg: '#C97B5C',        fg: '#FFFFFF',     border: 'transparent', disabledBg: DISABLED_BG,          disabledFg: DISABLED_FG },
  outline:   { bg: 'transparent',    fg: colors.ink,    border: colors.line2,  disabledBg: 'transparent',        disabledFg: colors.muted2 },
  ghost:     { bg: 'transparent',    fg: colors.ink,    border: 'transparent', disabledBg: 'transparent',        disabledFg: colors.muted2 },
  soft:      { bg: colors.sageTint,  fg: colors.sage,   border: 'transparent', disabledBg: colors.sageTint,      disabledFg: colors.muted },
  bricksoft: { bg: colors.brickTint, fg: colors.brick2, border: 'transparent', disabledBg: colors.brickTint,     disabledFg: colors.muted },
  paper:     { bg: '#FFFFFF',        fg: colors.ink,    border: colors.line,   disabledBg: '#FFFFFF',            disabledFg: colors.muted2 },
};

export function Btn({
  children, onPress, variant = 'primary', size = 'md',
  full, disabled, loading, icon, iconRight, accessibilityLabel,
}: Props) {
  const s = SIZES[size];
  const v = V[variant];
  const isDisabled = !!(disabled || loading);
  const bg = isDisabled ? v.disabledBg : v.bg;
  const fg = isDisabled ? v.disabledFg : v.fg;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => ({
        alignSelf: full ? 'stretch' : 'flex-start',
        opacity: pressed && !isDisabled ? 0.85 : 1,
        transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: v.border === 'transparent' ? 0 : 1,
          borderColor: v.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color={fg} style={{ marginRight: 8 }} />
        ) : icon ? (
          <View style={{ marginRight: 8 }}>{icon}</View>
        ) : null}
        <Text
          style={{
            color: fg,
            fontSize: s.fs,
            fontFamily: fonts.sansSemi,
            letterSpacing: -0.15,
          }}
        >
          {children}
        </Text>
        {iconRight ? <View style={{ marginLeft: 8 }}>{iconRight}</View> : null}
      </View>
    </Pressable>
  );
}
