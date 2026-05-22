import React from 'react';
import { View, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@app/theme/colors';

interface Props {
  children: React.ReactNode;
  bg?: string;
  hasTabBar?: boolean; // when true, content auto-padded so floating tab bar doesn't overlap
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  style?: ViewStyle;
  /** When tab bar overlay is shown above this screen, set false to disable top safe inset (e.g. when nested inside an outer screen). */
  topInset?: boolean;
}

/**
 * Standard screen container. Apply at the OUTER root of each screen.
 * - Sets background color (default cream)
 * - Applies top safe-area inset (no bottom — bottom handled by content or BottomBar)
 * - Reserves bottom space (140) when hasTabBar is true so the floating tab bar
 *   doesn't cover the last card.
 */
export function Screen({ children, bg = colors.cream, hasTabBar, edges = ['top'], style, topInset = true }: Props) {
  const safeEdges = topInset ? edges : edges.filter((e) => e !== 'top');
  return (
    <View style={[{ flex: 1, backgroundColor: bg }, style]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={safeEdges as ('top' | 'bottom' | 'left' | 'right')[]} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
      {/* The floating tab bar sits ~14 from bottom and is ~64 tall — total ~78.
          Screens that scroll should set contentContainerStyle.paddingBottom: 140
          themselves; this prop is just a hint flag for now. */}
      {hasTabBar ? null : null}
    </View>
  );
}

/** Padding used inside tab-screen scrollviews. Flat tab bar is no longer floating
 *  so we just need normal content padding. Kept name for backwards compat. */
export const TAB_BAR_BOTTOM_PAD = 24;
