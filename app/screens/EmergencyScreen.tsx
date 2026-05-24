import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '@app/navigation/types';
import { Icon, type IconName } from '@app/components/Icon';
import { HospitalCard } from '@app/components/HospitalCard';
import { Display, Body, Caption } from '@app/components/Type';
import { useAppStore } from '@app/store/useAppStore';
import { nearestEmergencyHospitals, PlacesError } from '@app/services/placesService';
import { getLocationOrDefault } from '@app/services/locationService';
import { callNumber } from '@app/services/shareService';
import type { Hospital } from '@app/types';
import { SPECIALTY_BY_KEY } from '@app/data/specialties';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

const STEP_ICONS: Record<number, IconName> = { 0: 'shield', 1: 'pill', 2: 'phone-fill' };

export function EmergencyScreen({ route, navigation }: RootStackScreenProps<'Emergency'>) {
  const { triage } = route.params;
  const apiKeys = useAppStore((s) => s.apiKeys);
  const setLastHospitals = useAppStore((s) => s.setLastHospitals);
  const setLastLocation = useAppStore((s) => s.setLastLocation);
  const manualLocation = useAppStore((s) => s.manualLocation);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const manual = manualLocation ? { lat: manualLocation.lat, lng: manualLocation.lng } : null;
        const { location } = await getLocationOrDefault(manual);
        setLastLocation(location);
        const list = await nearestEmergencyHospitals({ apiKey: apiKeys.googlePlaces, origin: location });
        setHospitals(list);
        setLastHospitals(list);
      } catch (e) {
        setError(e instanceof PlacesError ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [apiKeys.googlePlaces, manualLocation, setLastHospitals, setLastLocation]);

  const callEmergency = async (num: string) => {
    try { await callNumber(num); } catch (e) { Alert.alert('Could not dial', String(e)); }
  };

  const specialtyLabel = SPECIALTY_BY_KEY[triage.specialty]?.label ?? 'Emergency';

  return (
    <View style={{ flex: 1, backgroundColor: colors.brickDeep }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 38, height: 38, borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Icon name="arrow-left" size={18} stroke="#fff" />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.14)',
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#FFB8A8', marginRight: 8 }} />
              <Text style={{ fontSize: 11.5, letterSpacing: 1.8, textTransform: 'uppercase', color: '#fff', fontFamily: fonts.sansSemi }}>
                Possible emergency
              </Text>
            </View>
            <Display color="#fff" style={{ marginTop: 14 }}>This needs urgent care.{'\n'}Let’s act calmly.</Display>
            <Body size={15} color="rgba(255,255,255,0.78)" style={{ marginTop: 12 }}>
              Your symptoms suggest{' '}
              <Text style={{ color: '#fff', fontFamily: fonts.sansSemi }}>{specialtyLabel.toLowerCase()}</Text>
              . Follow these steps while help is on the way.
            </Body>
          </View>

          {/* Big call button */}
          <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
            <Pressable
              onPress={() => callEmergency('108')}
              accessibilityRole="button"
              accessibilityLabel="Call 108 emergency"
              style={({ pressed }) => ({
                width: '100%',
                height: 76,
                borderRadius: 22,
                backgroundColor: colors.brick,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 14,
                paddingRight: 18,
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#000',
                shadowOpacity: 0.35,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 10 },
                elevation: 6,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Icon name="phone-fill" size={22} stroke={colors.brick} />
                </View>
                <View>
                  <Text style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)', fontFamily: fonts.sansSemi }}>
                    Emergency
                  </Text>
                  <Text style={{ fontSize: 24, color: '#fff', marginTop: 1, fontFamily: fonts.sansSemi }}>Call 108</Text>
                </View>
              </View>
              <Pressable
                onPress={(e) => { e.stopPropagation?.(); callEmergency('102'); }}
                accessibilityLabel="Call 102 ambulance"
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.85 }}
              >
                <Text style={{ color: '#fff', fontSize: 12, marginRight: 6, fontFamily: fonts.sansSemi }}>Or 102</Text>
                <Icon name="chevron-r" size={14} stroke="#fff" />
              </Pressable>
            </Pressable>
          </View>

          {triage.selfCare ? (
            <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
              <View
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, fontFamily: fonts.sans }}>
                  {triage.selfCare}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
            <Text style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', marginBottom: 12, fontFamily: fonts.sansSemi }}>
              While you wait — do these
            </Text>
            <View style={{ gap: 10 }}>
              {triage.immediateSteps.map((step, i) => {
                const parts = step.split('.');
                const title = parts[0]?.trim() ?? step;
                const body = parts.slice(1).join('.').trim();
                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: 18,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                    }}
                  >
                    <View
                      style={{
                        width: 36, height: 36, borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.16)',
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 12, position: 'relative',
                      }}
                    >
                      <Icon name={STEP_ICONS[i] ?? 'shield'} size={18} stroke="#fff" />
                      <View
                        style={{
                          position: 'absolute', top: -4, right: -4,
                          width: 18, height: 18, borderRadius: 999,
                          backgroundColor: '#fff',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 10, color: colors.brick2, fontFamily: fonts.sansBold }}>{i + 1}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: '#fff', fontFamily: fonts.sansSemi, lineHeight: 21 }}>{title}</Text>
                      {body ? (
                        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 19, fontFamily: fonts.sans }}>
                          {body}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </SafeAreaView>

        {/* Nearest ER section */}
        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.cream,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 22,
            paddingTop: 24,
            paddingBottom: 40,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.muted, fontFamily: fonts.sansSemi }}>
              Nearest emergency rooms
            </Text>
            <Caption>Sorted by distance</Caption>
          </View>
          <Body size={13} style={{ marginBottom: 14 }}>
            Tap "Share" to send your location to a contact.
          </Body>

          {loading && (
            <View style={{ padding: 16, backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
              <Body size={14}>Finding nearest ERs…</Body>
            </View>
          )}
          {error && (
            <View style={{ padding: 14, backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: colors.line }}>
              <Body weight="semi" color={colors.brick2}>Could not load hospitals</Body>
              <Body size={12} style={{ marginTop: 4 }}>{error}</Body>
            </View>
          )}
          <View style={{ gap: 10 }}>
            {hospitals.slice(0, 3).map((h) => (
              <HospitalCard
                key={h.placeId}
                hospital={h}
                condition={triage.rawSymptom}
                isEmergency
                onShare={() => navigation.navigate('ShareSheet', { hospital: h, condition: triage.rawSymptom, isEmergency: true })}
              />
            ))}
          </View>

          <View
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              backgroundColor: colors.paper,
              borderWidth: 1,
              borderColor: colors.line,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <Icon name="info" size={16} stroke={colors.muted} />
            <Body size={12} style={{ flex: 1, marginLeft: 10 }}>
              This is not a substitute for emergency services.{' '}
              <Text style={{ color: colors.ink2, fontFamily: fonts.sansSemi }}>Call 108 immediately</Text> for any life-threatening situation.
            </Body>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
