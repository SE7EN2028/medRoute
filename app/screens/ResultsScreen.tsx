import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { RootStackScreenProps } from '@app/navigation/types';
import { HospitalCard } from '@app/components/HospitalCard';
import { Icon } from '@app/components/Icon';
import { Chip } from '@app/components/Chip';
import { Card } from '@app/components/Card';
import { Badge } from '@app/components/Badge';
import { Hero, Body, Caption, Eyebrow } from '@app/components/Type';
import { Screen } from '@app/components/Screen';
import { useAppStore } from '@app/store/useAppStore';
import { hospitalsBySpecialty, PlacesError } from '@app/services/placesService';
import { getLocationOrDefault } from '@app/services/locationService';
import { SPECIALTY_BY_KEY } from '@app/data/specialties';
import { estimatesFor } from '@app/data/costs';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';
import type { Hospital } from '@app/types';

type SortKey = 'distance' | 'name';

export function ResultsScreen({ route, navigation }: RootStackScreenProps<'Results'>) {
  const { triage } = route.params;
  const apiKeys = useAppStore((s) => s.apiKeys);
  const setLastLocation = useAppStore((s) => s.setLastLocation);
  const manualLocation = useAppStore((s) => s.manualLocation);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('distance');

  const meta = SPECIALTY_BY_KEY[triage.specialty];
  const costs = useMemo(() => estimatesFor(triage.specialty), [triage.specialty]);
  const isUrgent = triage.severity === 'urgent';

  useEffect(() => {
    (async () => {
      try {
        const manual = manualLocation ? { lat: manualLocation.lat, lng: manualLocation.lng } : null;
        const { location } = await getLocationOrDefault(manual);
        setLastLocation(location);
        const list = await hospitalsBySpecialty({ apiKey: apiKeys.googlePlaces, origin: location, specialty: triage.specialty });
        setHospitals(list);
      } catch (e) {
        setError(e instanceof PlacesError ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [apiKeys.googlePlaces, manualLocation, triage.specialty, setLastLocation]);

  const sorted = useMemo(() => {
    const arr = [...hospitals];
    if (sortKey === 'distance') arr.sort((a, b) => a.distanceKm - b.distanceKm);
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [hospitals, sortKey]);

  return (
    <Screen bg={colors.cream}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 38, height: 38, borderRadius: 999,
              backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon name="arrow-left" size={18} stroke={colors.ink} />
          </Pressable>
          <Badge tone={isUrgent ? 'amber' : 'sage'}>{isUrgent ? 'See within 24h' : 'Routine visit'}</Badge>
        </View>

        <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Likely match</Eyebrow>
          <Hero>
            You likely need a{'\n'}
            <Text style={{ color: colors.sage, fontFamily: fonts.serif }}>{meta.label}.</Text>
          </Hero>
          <Body size={15} style={{ marginTop: 12 }}>
            {triage.rationale || 'Based on your description.'} Confidence{' '}
            <Text style={{ color: colors.ink2, fontFamily: fonts.sansSemi }}>{(triage.confidence * 100).toFixed(0)}%</Text>.
          </Body>
        </View>

        {/* Quick remedy — conversational care tip from the LLM */}
        {triage.selfCare ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
            <Card bg={colors.terraTint} borderColor="#EBC9B8">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Icon name="sparkle" size={15} stroke={colors.terra} />
                <Text style={{ marginLeft: 8, fontSize: 13, color: '#8B4E32', fontFamily: fonts.sansSemi }}>
                  Quick remedy
                </Text>
              </View>
              <Body size={14} color={colors.ink2} style={{ lineHeight: 20 }}>
                {triage.selfCare}
              </Body>
            </Card>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 18, paddingTop: 14 }}>
          <Card bg={colors.sageTint} borderColor={colors.sageTint2}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Icon name="leaf" size={16} stroke={colors.sage} />
              <Text style={{ marginLeft: 8, fontSize: 13, color: colors.sage, fontFamily: fonts.sansSemi }}>
                While you book
              </Text>
            </View>
            {triage.immediateSteps.map((step, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 6,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.sageTint2,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.sage, fontFamily: fonts.serif, width: 18, paddingTop: 1 }}>{i + 1}.</Text>
                <Body size={14} style={{ flex: 1 }}>{step}</Body>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <Eyebrow>Nearby clinics</Eyebrow>
          <Text style={{ fontSize: 22, color: colors.ink, marginTop: 4, fontFamily: fonts.serif, paddingTop: 3 }}>
            {sorted.length} matches near you
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, gap: 6 }}>
          <Chip active={sortKey === 'distance'} onPress={() => setSortKey('distance')} icon={<Icon name="pin" size={12} stroke={sortKey === 'distance' ? colors.cream2 : colors.ink2} />}>
            Nearest
          </Chip>
          <Chip icon={<Icon name="star" size={11} stroke={colors.amber} />}>Highest rated</Chip>
          <Chip>Lowest cost</Chip>
          <Chip>Open now</Chip>
          <Chip active={sortKey === 'name'} onPress={() => setSortKey('name')}>A–Z</Chip>
        </ScrollView>

        <View style={{ paddingHorizontal: 18, paddingTop: 14, gap: 10 }}>
          {loading && (
            <View style={{ padding: 16, backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
              <Body size={14}>Finding nearby specialists…</Body>
            </View>
          )}
          {error && (
            <View style={{ padding: 14, backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: colors.line }}>
              <Body weight="semi" color={colors.brick2}>Could not load hospitals</Body>
              <Body size={12} style={{ marginTop: 4 }}>{error}</Body>
            </View>
          )}
          {sorted.map((h) => (
            <HospitalCard
              key={h.placeId}
              hospital={h}
              condition={triage.rawSymptom}
              costs={costs}
              showCost
              onShare={() => navigation.navigate('ShareSheet', { hospital: h, condition: triage.rawSymptom })}
            />
          ))}
        </View>

        <View style={{ paddingHorizontal: 22, paddingTop: 16 }}>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(26,26,23,0.04)', flexDirection: 'row', alignItems: 'flex-start' }}>
            <Icon name="info" size={14} stroke={colors.muted} />
            <Body size={12} style={{ flex: 1, marginLeft: 8 }}>
              Cost is estimated and varies by hospital. Ratings (when shown) are general — not treatment-specific.
            </Body>
          </View>
        </View>

        <Body size={11} align="center" color={colors.muted2} style={{ paddingHorizontal: 22, paddingTop: 14 }}>
          MedRoute is informational only — not a substitute for medical advice.
        </Body>
      </ScrollView>
    </Screen>
  );
}
