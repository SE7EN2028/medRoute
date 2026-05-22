import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { TriageResult, Specialty, Hospital } from '@app/types';

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  TriageLoading: { symptom: string };
  Emergency: { triage: TriageResult };
  Results: { triage: TriageResult };
  SpecialtyResults: { specialty: Specialty };
  ShareSheet: { hospital: Hospital; condition: string; isEmergency?: boolean };
};

export type TabParamList = {
  Home: undefined;
  FindCare: undefined;
  BloodCamps: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
