import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import { HomeScreen } from '@app/screens/HomeScreen';
import { FindCareScreen } from '@app/screens/FindCareScreen';
import { BloodCampsScreen } from '@app/screens/BloodCampsScreen';
import { ProfileScreen } from '@app/screens/ProfileScreen';
import { FloatingTabBar } from '@app/components/FloatingTabBar';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // we render our own
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="FindCare" component={FindCareScreen} />
      <Tab.Screen name="BloodCamps" component={BloodCampsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
