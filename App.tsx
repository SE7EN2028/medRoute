import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts as useDMSans,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { RootNavigator } from '@app/navigation/RootNavigator';
import { colors } from '@app/theme/colors';

export default function App() {
  const [fontsLoaded] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    InstrumentSerif_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? (
          <RootNavigator />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
            <ActivityIndicator color={colors.sage} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
