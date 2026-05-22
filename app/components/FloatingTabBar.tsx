import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, type IconName } from './Icon';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

const TAB_ICONS: Record<string, IconName> = {
  Home: 'home',
  FindCare: 'compass',
  BloodCamps: 'droplet',
  Profile: 'user',
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  FindCare: 'Find Care',
  BloodCamps: 'Blood Camps',
  Profile: 'Profile',
};

/**
 * Flat solid tab bar — Haven style. Cream2 background with subtle top border line.
 * Active tab: sage tint + 22×2 underline above icon.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: colors.cream2,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}
    >
      {state.routes.map((route, i) => {
        const isActive = state.index === i;
        const iconName = TAB_ICONS[route.name] ?? 'home';
        const label = TAB_LABELS[route.name] ?? route.name;
        const tint = isActive ? colors.sage : colors.muted;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
              opacity: pressed ? 0.7 : 1,
              position: 'relative',
            })}
          >
            {isActive && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 22,
                  height: 2,
                  borderRadius: 999,
                  backgroundColor: colors.sage,
                }}
              />
            )}
            <Icon name={iconName} size={22} stroke={tint} strokeWidth={isActive ? 1.9 : 1.5} />
            <Text
              style={{
                fontSize: 10.5,
                marginTop: 4,
                color: tint,
                fontFamily: isActive ? fonts.sansSemi : fonts.sansMedium,
                letterSpacing: -0.1,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
