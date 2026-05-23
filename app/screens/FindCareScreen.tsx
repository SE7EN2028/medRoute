import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import type { TabScreenProps } from '@app/navigation/types';
import { Icon, type IconName } from '@app/components/Icon';
import { Chip } from '@app/components/Chip';
import { Hero, Body, Caption, Eyebrow } from '@app/components/Type';
import { Screen, TAB_BAR_BOTTOM_PAD } from '@app/components/Screen';
import { SPECIALTIES } from '@app/data/specialties';
import type { Specialty } from '@app/types';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

const SPECIALTY_ICONS: Record<Specialty, { icon: IconName; tint: string; count: number }> = {
  general:           { icon: 'heart-pulse', tint: colors.sageTint,  count: 24 },
  cardiology:        { icon: 'heart',       tint: colors.brickTint, count: 22 },
  orthopedics:       { icon: 'shield',      tint: '#E8E2D5',         count: 10 },
  pediatrics:        { icon: 'sun',         tint: colors.amberTint, count: 27 },
  dermatology:       { icon: 'sparkle',     tint: colors.terraTint, count: 28 },
  neurology:         { icon: 'sparkles',    tint: colors.sageTint,  count: 26 },
  gastroenterology:  { icon: 'water',       tint: colors.amberTint, count: 37 },
  pulmonology:       { icon: 'wave',        tint: colors.sageTint,  count: 14 },
  ent:               { icon: 'wave',        tint: colors.brickTint, count: 29 },
  ophthalmology:     { icon: 'eye',         tint: colors.sageTint,  count: 27 },
  obgyn:             { icon: 'heart',       tint: colors.brickTint, count: 36 },
  psychiatry:        { icon: 'leaf',        tint: colors.terraTint, count: 20 },
  urology:           { icon: 'water',       tint: colors.sageTint,  count: 16 },
  oncology:          { icon: 'shield-plus', tint: colors.brickTint, count: 11 },
  toxicology:        { icon: 'alert',       tint: colors.amberTint, count: 4 },
  emergency_medicine:{ icon: 'plus',        tint: colors.brickTint, count: 10 },
};

export function FindCareScreen({ navigation }: TabScreenProps<'FindCare'>) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return SPECIALTIES;
    const q = query.toLowerCase();
    return SPECIALTIES.filter((s) => s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [query]);

  return (
    <Screen bg={colors.cream}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_PAD }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <Eyebrow>Browse by need</Eyebrow>
          <Hero style={{ marginTop: 12 }}>Find the right{'\n'}kind of care.</Hero>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 18, paddingTop: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.paper,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 16,
            }}
          >
            <Icon name="compass" size={17} stroke={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search specialties, conditions, hospitals…"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, marginLeft: 10, fontSize: 14, color: colors.ink, fontFamily: fonts.sans, padding: 0 }}
            />
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, gap: 6 }}>
          <Chip active>All</Chip>
          <Chip icon={<Icon name="flame" size={11} stroke={colors.brick2} />}>Urgent care</Chip>
          <Chip>Telemedicine</Chip>
          <Chip>Open now</Chip>
          <Chip>Insurance ✓</Chip>
        </ScrollView>

        {/* Grid */}
        <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Specialties</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {filtered.map((s) => {
              const meta = SPECIALTY_ICONS[s.key];
              return (
                <View key={s.key} style={{ width: '50%', padding: 4 }}>
                  <Pressable
                    onPress={() => navigation.navigate('SpecialtyResults', { specialty: s.key })}
                    accessibilityRole="button"
                    accessibilityLabel={s.label}
                    style={({ pressed }) => ({
                      backgroundColor: colors.paper,
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: 18,
                      padding: 14,
                      minHeight: 124,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: meta.tint,
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <Icon name={meta.icon} size={20} stroke={colors.ink} strokeWidth={1.4} />
                    </View>
                    <Body weight="semi" size={14}>{s.label}</Body>
                    <Caption style={{ marginTop: 4 }}>{meta.count} clinics nearby</Caption>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recently viewed */}
        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Recently viewed</Eyebrow>
          <View
            style={{
              backgroundColor: colors.paper,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.line,
              overflow: 'hidden',
            }}
          >
            {[
              { name: 'Apex City Hospital',         sub: 'Cardiology · Visited recently' },
              { name: 'Dr. Mehra — Dermatology',     sub: 'Last appointment' },
              { name: 'Greenleaf Family Clinic',     sub: 'Pediatrics · 2 prior visits' },
            ].map((x, i, arr) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={x.name}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: colors.line,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: colors.cream,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Icon name="history" size={16} stroke={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body weight="semi" size={14} color={colors.ink}>{x.name}</Body>
                  <Caption style={{ marginTop: 2 }}>{x.sub}</Caption>
                </View>
                <Icon name="chevron-r" size={14} stroke={colors.muted2} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
