import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@app/theme/colors';

interface Props {
  children: React.ReactNode;
  bg?: string;
  topBorder?: boolean;
  style?: ViewStyle;
}

/**
 * Pins child content above the home indicator. Uses useSafeAreaInsets() so it
 * works even when nested inside another SafeAreaView (nested SAVs can collapse
 * insets to 0). Always reserves at least 14px below the action.
 */
export function BottomBar({ children, bg = colors.cream, topBorder, style }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 14);
  return (
    <View
      style={[
        {
          paddingHorizontal: 22,
          paddingTop: 12,
          paddingBottom: bottomPad,
          backgroundColor: bg,
          borderTopWidth: topBorder ? 1 : 0,
          borderTopColor: colors.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
