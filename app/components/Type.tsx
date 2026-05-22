import React from 'react';
import { Text, TextStyle, Platform } from 'react-native';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

// Instrument Serif clips capital tops when lineHeight ~= fontSize. We always
// give it lineHeight ≈ size * 1.14 and a small paddingTop. Android also needs
// includeFontPadding: false to behave like iOS.
function serifBase(size: number): TextStyle {
  return {
    fontFamily: fonts.serif,
    fontSize: size,
    lineHeight: Math.round(size * 1.14),
    color: colors.ink,
    letterSpacing: -size * 0.014,
    paddingTop: 3,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  };
}

interface TextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

/** Display: largest hero text (onboarding slide, app intro) — ~44pt */
export function Display({ children, style, numberOfLines, color, align }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[serifBase(44), color ? { color } : null, align ? { textAlign: align } : null, style as TextStyle]}
    >
      {children}
    </Text>
  );
}

/** Hero: standard screen title — ~36pt */
export function Hero({ children, style, numberOfLines, color, align }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[serifBase(36), color ? { color } : null, align ? { textAlign: align } : null, style as TextStyle]}
    >
      {children}
    </Text>
  );
}

/** Title: medium serif (results subtitle, sheet title) — ~28pt */
export function Title({ children, style, numberOfLines, color, align }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[serifBase(28), color ? { color } : null, align ? { textAlign: align } : null, style as TextStyle]}
    >
      {children}
    </Text>
  );
}

/** Subtitle: small serif accents (card titles) — ~22pt */
export function Subtitle({ children, style, numberOfLines, color, align }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[serifBase(22), color ? { color } : null, align ? { textAlign: align } : null, style as TextStyle]}
    >
      {children}
    </Text>
  );
}

/** Body: standard body sans (14–16pt) */
export function Body({
  children,
  style,
  numberOfLines,
  color = colors.ink2,
  align,
  size = 15,
  weight = 'regular',
}: TextProps & { size?: number; weight?: 'regular' | 'medium' | 'semi' | 'bold' }) {
  const fam =
    weight === 'medium' ? fonts.sansMedium :
    weight === 'semi' ? fonts.sansSemi :
    weight === 'bold' ? fonts.sansBold :
    fonts.sans;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fam, fontSize: size, lineHeight: Math.round(size * 1.5), color, letterSpacing: -0.1 },
        align ? { textAlign: align } : null,
        style as TextStyle,
      ]}
    >
      {children}
    </Text>
  );
}

/** Eyebrow: small all-caps label */
export function Eyebrow({ children, style, color = colors.muted, align }: TextProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color,
        },
        align ? { textAlign: align } : null,
        style as TextStyle,
      ]}
    >
      {children}
    </Text>
  );
}

/** Caption: small muted text (12px) */
export function Caption({ children, style, color = colors.muted, numberOfLines, align }: TextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, color, letterSpacing: -0.05 },
        align ? { textAlign: align } : null,
        style as TextStyle,
      ]}
    >
      {children}
    </Text>
  );
}
