import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import { HomeScreen } from '@app/screens/HomeScreen';
import { FindCareScreen } from '@app/screens/FindCareScreen';
import { BloodCampsScreen } from '@app/screens/BloodCampsScreen';
import { ProfileScreen } from '@app/screens/ProfileScreen';
import { FloatingTabBar } from '@app/components/FloatingTabBar';
import { AnimatedTabScreen } from '@app/components/AnimatedTabScreen';

const Tab = createBottomTabNavigator<TabParamList>();

function HomeTab(props: any) {
  return <AnimatedTabScreen tabIndex={0}><HomeScreen {...props} /></AnimatedTabScreen>;
}
function FindCareTab(props: any) {
  return <AnimatedTabScreen tabIndex={1}><FindCareScreen {...props} /></AnimatedTabScreen>;
}
function BloodCampsTab(props: any) {
  return <AnimatedTabScreen tabIndex={2}><BloodCampsScreen {...props} /></AnimatedTabScreen>;
}
function ProfileTab(props: any) {
  return <AnimatedTabScreen tabIndex={3}><ProfileScreen {...props} /></AnimatedTabScreen>;
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="FindCare" component={FindCareTab} />
      <Tab.Screen name="BloodCamps" component={BloodCampsTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}
