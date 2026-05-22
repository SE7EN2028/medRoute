// Font names match what useFonts() registers. Use these in `style={{ fontFamily }}`
// rather than tailwind classes — NativeWind doesn't ship custom font helpers by default.
export const fonts = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemi: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export type FontKey = keyof typeof fonts;
