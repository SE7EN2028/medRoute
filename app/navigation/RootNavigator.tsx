import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import type { RootStackParamList } from './types';
import { useAppStore } from '@app/store/useAppStore';
import { TabNavigator } from './TabNavigator';
import { OnboardingScreen } from '@app/screens/OnboardingScreen';
import { EmergencyScreen } from '@app/screens/EmergencyScreen';
import { ResultsScreen } from '@app/screens/ResultsScreen';
import { SpecialtyResultsScreen } from '@app/screens/SpecialtyResultsScreen';
import { TriageLoadingScreen } from '@app/screens/TriageLoadingScreen';
import { ShareSheetScreen } from '@app/screens/ShareSheetScreen';
import { colors } from '@app/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream,
    card: colors.paper,
    text: colors.ink,
    border: colors.line,
    primary: colors.sage,
  },
};

export function RootNavigator() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarding = useAppStore((s) => s.onboarding);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  const initial: keyof RootStackParamList =
    onboarding.hasCompletedOnboarding && onboarding.hasAcceptedDisclaimer ? 'Tabs' : 'Onboarding';

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initial}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="TriageLoading" component={TriageLoadingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Emergency" component={EmergencyScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="SpecialtyResults" component={SpecialtyResultsScreen} />
        <Stack.Screen
          name="ShareSheet"
          component={ShareSheetScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
