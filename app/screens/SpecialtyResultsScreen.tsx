import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import type { RootStackScreenProps } from '@app/navigation/types';
import { HospitalCard } from '@app/components/HospitalCard';
import { Icon } from '@app/components/Icon';
import { Chip } from '@app/components/Chip';
import { Hero, Body, Eyebrow } from '@app/components/Type';
import { Screen } from '@app/components/Screen';
import { useAppStore } from '@app/store/useAppStore';
import { hospitalsBySpecialty, PlacesError } from '@app/services/placesService';
import { getCurrentLocation, getLastKnownLocation } from '@app/services/locationService';
import { SPECIALTY_BY_KEY } from '@app/data/specialties';
import { estimatesFor } from '@app/data/costs';
import { colors } from '@app/theme/colors';
import type { Hospital } from '@app/types';

type SortKey = 'distance' | 'name';

export function SpecialtyResultsScreen({ route, navigation }: RootStackScreenProps<'SpecialtyResults'>) {
  const { specialty } = route.params;
  const apiKeys = useAppStore((s) => s.apiKeys);
  const setLastLocation = useAppStore((s) => s.setLastLocation);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('distance');

  const meta = SPECIALTY_BY_KEY[specialty];
  const costs = useMemo(() => estimatesFor(specialty), [specialty]);

  useEffect(() => {
    (async () => {
      try {
        let loc = await getLastKnownLocation();
        if (!loc) loc = await getCurrentLocation();
        setLastLocation(loc);
        const list = await hospitalsBySpecialty({ apiKey: apiKeys.googlePlaces, origin: loc, specialty });
        setHospitals(list);
      } catch (e) {
        setError(e instanceof PlacesError ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [apiKeys.googlePlaces, specialty, setLastLocation]);

  const sorted = useMemo(() => {
    const arr = [...hospitals];
    if (sortKey === 'distance') arr.sort((a, b) => a.distanceKm - b.distanceKm);
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [hospitals, sortKey]);

  return (
    <Screen bg={colors.cream}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, flexDirection: 'row' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
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
        </View>

        <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Specialty</Eyebrow>
          <Hero>{meta.label}.</Hero>
          <Body size={15} style={{ marginTop: 8 }}>{meta.description}</Body>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 18, gap: 6 }}>
          <Chip active={sortKey === 'distance'} onPress={() => setSortKey('distance')} icon={<Icon name="pin" size={12} stroke={sortKey === 'distance' ? colors.cream2 : colors.ink2} />}>
            Nearest
          </Chip>
          <Chip active={sortKey === 'name'} onPress={() => setSortKey('name')}>A–Z</Chip>
        </ScrollView>

        <View style={{ paddingHorizontal: 18, paddingTop: 14, gap: 10 }}>
          {loading && (
            <View style={{ padding: 16, backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
              <Body size={14}>Finding specialists…</Body>
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
              condition=""
              costs={costs}
              showCost
              onShare={() => navigation.navigate('ShareSheet', { hospital: h, condition: '' })}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
