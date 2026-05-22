import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

export type BadgeTone = 'neutral' | 'sage' | 'brick' | 'amber' | 'terra';

interface Props {
  children: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'rgba(26,26,23,0.06)', fg: colors.ink2 },
  sage:    { bg: colors.sageTint,        fg: colors.sage },
  brick:   { bg: colors.brickTint,       fg: colors.brick2 },
  amber:   { bg: colors.amberTint,       fg: colors.amberInk },
  terra:   { bg: colors.terraTint,       fg: '#8B4E32' },
};

export function Badge({ children, tone = 'neutral', size = 'md' }: Props) {
  const t = TONES[tone];
  const dims = size === 'sm'
    ? { height: 20, px: 8, fs: 10.5 }
    : { height: 24, px: 10, fs: 11.5 };
  return (
    <View
      style={{
        height: dims.height,
        paddingHorizontal: dims.px,
        borderRadius: 999,
        backgroundColor: t.bg,
        alignSelf: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: t.fg, fontSize: dims.fs, fontFamily: fonts.sansMedium, letterSpacing: 0.2 }}>
        {children}
      </Text>
    </View>
  );
}
