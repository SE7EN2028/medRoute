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
  BloodCamps: 'Blood',
  Profile: 'Profile',
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: 'transparent',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 62,
          backgroundColor: colors.cream2,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.line2,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.09,
          shadowRadius: 16,
          elevation: 8,
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
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Icon name={iconName} size={22} stroke={tint} strokeWidth={isActive ? 2 : 1.5} />
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 3,
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
    </View>
  );
}
