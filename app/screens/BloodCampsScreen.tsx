import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import * as Calendar from 'expo-calendar';
// Use legacy API — new File/Paths API doesn't ship the simple
// writeAsStringAsync helper we need for a one-off .ics blob.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { TabScreenProps } from '@app/navigation/types';
import { Icon } from '@app/components/Icon';
import { Chip } from '@app/components/Chip';
import { Badge } from '@app/components/Badge';
import { Btn } from '@app/components/Btn';
import { Hero, Title, Body, Caption, Eyebrow } from '@app/components/Type';
import { Screen, TAB_BAR_BOTTOM_PAD } from '@app/components/Screen';
import type { BloodCamp, BloodType } from '@app/types';
import { callNumber, openDirections } from '@app/services/shareService';
import { MOCK_BLOOD_CAMPS } from '@app/data/camps';
import { useAppStore } from '@app/store/useAppStore';
import { DEFAULT_LOCATION, getLastKnownLocation } from '@app/services/locationService';
import { haversineKm } from '@app/utils/distance';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

const BLOOD_TYPES: BloodType[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const POSITIONS = [
  { x: 30, y: 35 }, { x: 55, y: 50 }, { x: 42, y: 65 },
  { x: 70, y: 30 }, { x: 65, y: 75 }, { x: 78, y: 55 }, { x: 20, y: 78 },
];

type View_ = 'list' | 'map';

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out (${ms}ms)`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

// iCalendar timestamp: YYYYMMDDTHHMMSS (local, no Z)
function icsTime(date: string, time: string): string {
  const [y, m, d] = date.split('-');
  const [hh, mm] = time.split(':');
  return `${y}${m}${d}T${hh}${mm}00`;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function buildIcs(camp: BloodCamp): string {
  const uid = `${camp.id}-${Date.now()}@medroute`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MedRoute//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${icsTime(camp.date, camp.startTime)}`,
    `DTEND:${icsTime(camp.date, camp.endTime)}`,
    `SUMMARY:${escapeIcs(`Blood Donation — ${camp.name}`)}`,
    `LOCATION:${escapeIcs(camp.address)}`,
    `DESCRIPTION:${escapeIcs(`${camp.organizer}. Needs: ${camp.bloodTypesNeeded.join(', ')}.`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT1H',
    'DESCRIPTION:Blood donation in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// Native expo-calendar (works in dev builds with proper privacy strings).
// Falls back to .ics file share when native API is unavailable or hangs
// — that path works in Expo Go since iOS native Share sheet handles .ics
// import without needing app-level permissions.
async function addCampToCalendar(camp: BloodCamp) {
  // ── 1. try native expo-calendar first
  try {
    const calMod = Calendar as unknown as {
      requestCalendarPermissionsAsync: () => Promise<{ status: string }>;
      requestWriteOnlyCalendarPermissionsAsync?: () => Promise<{ status: string }>;
    };
    let granted = false;
    if (typeof calMod.requestWriteOnlyCalendarPermissionsAsync === 'function') {
      const w = await withTimeout(calMod.requestWriteOnlyCalendarPermissionsAsync(), 4000, 'Calendar permission');
      granted = w.status === 'granted';
    }
    if (!granted) {
      const perm = await withTimeout(calMod.requestCalendarPermissionsAsync(), 4000, 'Calendar permission');
      granted = perm.status === 'granted';
    }
    if (granted) {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writable = calendars.find((c) => c.allowsModifications) ?? calendars[0];
      if (writable) {
        const [y, m, d] = camp.date.split('-').map(Number);
        const [sh, sm] = camp.startTime.split(':').map(Number);
        const [eh, em] = camp.endTime.split(':').map(Number);
        await Calendar.createEventAsync(writable.id, {
          title: `Blood Donation — ${camp.name}`,
          startDate: new Date(y, m - 1, d, sh, sm),
          endDate: new Date(y, m - 1, d, eh, em),
          location: camp.address,
          notes: `${camp.organizer}. Needs: ${camp.bloodTypesNeeded.join(', ')}.`,
          alarms: [{ relativeOffset: -60 }],
        });
        Alert.alert('Saved', 'Reminder set in your calendar.');
        return;
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[calendar] native failed, falling back to .ics share', String(e));
  }

  // ── 2. fallback: write .ics file + open iOS Share sheet
  try {
    const ics = buildIcs(camp);
    const filename = `medroute-${camp.id}.ics`;
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, ics, { encoding: FileSystem.EncodingType.UTF8 });
    const can = await Sharing.isAvailableAsync();
    if (!can) {
      Alert.alert('Share unavailable', 'Could not open Share sheet on this device.');
      return;
    }
    await Sharing.shareAsync(path, {
      mimeType: 'text/calendar',
      UTI: 'public.calendar-event',
      dialogTitle: 'Add to Calendar',
    });
  } catch (e) {
    Alert.alert('Could not save', String(e));
  }
}

// Friendly date label: "Today" | "Tomorrow" | "Sat 25 May"
function friendlyDate(iso: string): { label: string; tile: { eyebrow: string; symbol: string } } {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const diff = Math.round((date.getTime() - today.getTime()) / dayMs);
  if (diff === 0) return { label: 'Today',    tile: { eyebrow: 'TODAY',    symbol: '✦' } };
  if (diff === 1) return { label: 'Tomorrow', tile: { eyebrow: 'TOMORROW', symbol: '→' } };
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  return {
    label: `${dayName} ${dayNum} ${months[date.getMonth()]}`,
    tile: { eyebrow: dayName.toUpperCase(), symbol: String(dayNum) },
  };
}

function CampCard({ c, onClick, distanceKm }: { c: BloodCamp; onClick: () => void; distanceKm: number }) {
  const urgent = !!c.urgent;
  const { label, tile } = friendlyDate(c.date);
  const slots = c.slots ?? 0;
  return (
    <Pressable
      onPress={onClick}
      accessibilityRole="button"
      accessibilityLabel={c.name}
      style={({ pressed }) => ({
        backgroundColor: colors.paper,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.line,
        gap: 12,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            {urgent && <Badge tone="brick" size="sm">● Urgent</Badge>}
            <Badge size="sm">{label}</Badge>
          </View>
          <Body weight="semi" size={16} color={colors.ink}>{c.name}</Body>
          <Caption style={{ marginTop: 2 }}>by {c.organizer}</Caption>
        </View>
        <View
          style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: urgent ? colors.brickTint : colors.sageTint,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 9,
              letterSpacing: 1,
              color: urgent ? colors.brick2 : colors.sage,
              opacity: 0.75,
              fontFamily: fonts.sansSemi,
            }}
          >
            {tile.eyebrow}
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: urgent ? colors.brick2 : colors.sage,
              marginTop: 2,
              fontFamily: fonts.serif,
              lineHeight: 20,
              paddingTop: 2,
            }}
          >
            {tile.symbol}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="clock" size={12} stroke={colors.muted} />
        <Caption style={{ marginLeft: 4 }}>
          {c.startTime.replace(':00', '')}–{c.endTime.replace(':00', '')}
        </Caption>
        <Text style={{ fontSize: 12.5, color: colors.muted2, marginHorizontal: 8 }}>·</Text>
        <Icon name="pin" size={12} stroke={colors.muted} />
        <Caption style={{ marginLeft: 4 }}>{distanceKm.toFixed(1)} km</Caption>
        <View style={{ flex: 1 }} />
        {slots > 0 && (
          <Text style={{ fontSize: 12.5, color: colors.sage, fontFamily: fonts.sansSemi }}>
            {slots} slots
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {c.bloodTypesNeeded.map((t) => (
          <View
            key={t}
            style={{
              paddingVertical: 4, paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: colors.cream,
              borderWidth: 1, borderColor: colors.line,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.ink2, fontFamily: fonts.mono }}>{t}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function MapView({ camps, onSelect }: { camps: BloodCamp[]; onSelect: (c: BloodCamp) => void }) {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
      <View
        style={{
          height: 320,
          borderRadius: 24,
          backgroundColor: '#EBE5D6',
          overflow: 'hidden',
          borderWidth: 1, borderColor: colors.line,
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute' }}>
          <Path d="M0 30 Q 30 25, 50 40 T 100 35" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} fill="none" />
          <Path d="M0 60 Q 25 70, 50 60 T 100 75" stroke="rgba(255,255,255,0.7)" strokeWidth={2} fill="none" />
          <Path d="M20 0 L 28 100" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="none" />
          <Path d="M70 0 Q 65 50, 75 100" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="none" />
          <Ellipse cx="40" cy="80" rx="14" ry="10" fill="rgba(106,142,90,0.18)" />
          <Ellipse cx="82" cy="20" rx="10" ry="7" fill="rgba(106,142,90,0.18)" />
        </Svg>

        <View style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -9, marginTop: -9 }}>
          <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: colors.sage, borderWidth: 3, borderColor: '#fff' }} />
        </View>

        {camps.slice(0, 7).map((c, i) => {
          const p = POSITIONS[i];
          const urgent = c.bloodTypesNeeded.length >= 4;
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c)}
              accessibilityLabel={c.name}
              hitSlop={6}
              style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: [{ translateX: -30 }, { translateY: -34 }] }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: urgent ? colors.brick : colors.paper,
                  borderWidth: urgent ? 0 : 1,
                  borderColor: colors.line,
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 3,
                }}
              >
                <Icon name="droplet" size={11} stroke={urgent ? '#fff' : colors.brick} />
                <Text style={{ marginLeft: 4, fontSize: 11, color: urgent ? '#fff' : colors.ink, fontFamily: fonts.sansSemi }}>
                  {c.bloodTypesNeeded[0]}
                </Text>
              </View>
            </Pressable>
          );
        })}

        <View
          style={{
            position: 'absolute',
            left: 12, bottom: 12,
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 12,
            paddingVertical: 6, paddingHorizontal: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.brick, marginRight: 4 }} />
            <Caption color={colors.ink2}>Urgent</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.sage, borderWidth: 2, borderColor: '#fff', marginRight: 4 }} />
            <Caption color={colors.ink2}>You</Caption>
          </View>
        </View>
      </View>
    </View>
  );
}

function CampDetail({ c, onClose }: { c: BloodCamp; onClose: () => void }) {
  const urgent = c.bloodTypesNeeded.length >= 4;
  return (
    <View
      style={{
        backgroundColor: colors.cream2,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 8,
        paddingBottom: 38,
      }}
    >
      <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(26,26,23,0.18)', alignSelf: 'center', marginTop: 6 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
        <Badge tone={urgent ? 'brick' : 'sage'} size="sm">{urgent ? 'Urgent drive' : 'Scheduled'}</Badge>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          style={({ pressed }) => ({
            width: 32, height: 32, borderRadius: 999,
            backgroundColor: 'rgba(26,26,23,0.06)',
            alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Icon name="x" size={15} stroke={colors.ink2} />
        </Pressable>
      </View>

      <Title style={{ marginTop: 12 }}>{c.name}</Title>
      <Caption style={{ marginTop: 4 }}>Hosted by {c.organizer}</Caption>

      <View
        style={{
          marginTop: 18, padding: 14, borderRadius: 18,
          backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line,
          flexDirection: 'row', flexWrap: 'wrap',
        }}
      >
        {[
          { l: 'When', v: `${c.date} · ${c.startTime}–${c.endTime}`, i: 'calendar' as const },
          { l: 'Where', v: c.address, i: 'pin' as const },
          { l: 'Needed', v: c.bloodTypesNeeded.join(', '), i: 'droplet' as const },
          { l: 'Contact', v: c.contactPhone, i: 'phone' as const },
        ].map((x, i) => (
          <View key={i} style={{ width: '50%', paddingVertical: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Icon name={x.i} size={11} stroke={colors.muted} />
              <Text style={{ fontSize: 10.5, color: colors.muted, marginLeft: 4, letterSpacing: 1, textTransform: 'uppercase', fontFamily: fonts.sansSemi }}>
                {x.l}
              </Text>
            </View>
            <Body weight="semi" size={13} color={colors.ink} numberOfLines={2}>{x.v}</Body>
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 14, padding: 14, borderRadius: 14,
          backgroundColor: colors.sageTint,
          flexDirection: 'row', alignItems: 'flex-start',
        }}
      >
        <Icon name="heart-pulse" size={18} stroke={colors.sage} />
        <Body size={13} style={{ flex: 1, marginLeft: 10 }}>
          Each donation can save up to <Text style={{ fontFamily: fonts.sansSemi }}>3 lives</Text>. Stay hydrated and eat a meal beforehand.
        </Body>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <View style={{ flex: 1 }}>
          <Btn variant="primary" size="lg" full onPress={() => addCampToCalendar(c)} icon={<Icon name="calendar" size={15} stroke={colors.cream2} />}>
            Add to calendar
          </Btn>
        </View>
        <Btn variant="paper" size="lg" onPress={() => callNumber(c.contactPhone)} icon={<Icon name="phone" size={15} stroke={colors.ink} />}>
          Call
        </Btn>
      </View>
      <View style={{ marginTop: 10 }}>
        <Btn
          variant="ghost"
          size="md"
          full
          onPress={() =>
            openDirections({
              placeId: c.id,
              name: c.name,
              address: c.address,
              location: c.location,
              distanceKm: 0,
            })
          }
        >
          Get directions
        </Btn>
      </View>
    </View>
  );
}

export function BloodCampsScreen(_: TabScreenProps<'BloodCamps'>) {
  const [view, setView] = useState<View_>('list');
  const [bloodFilter, setBloodFilter] = useState<BloodType | null>(null);
  const [selected, setSelected] = useState<BloodCamp | null>(null);

  // Anchor camps to user's location so they appear nearby.
  const manualLocation = useAppStore((s) => s.manualLocation);
  const [origin, setOrigin] = useState(
    manualLocation
      ? { lat: manualLocation.lat, lng: manualLocation.lng }
      : DEFAULT_LOCATION
  );

  useEffect(() => {
    if (manualLocation) {
      setOrigin({ lat: manualLocation.lat, lng: manualLocation.lng });
      return;
    }
    getLastKnownLocation().then((loc) => { if (loc) setOrigin(loc); }).catch(() => {});
  }, [manualLocation]);

  // Sort camps by real distance from origin; keep each camp's true location.
  const localized = useMemo(
    () =>
      [...MOCK_BLOOD_CAMPS].sort(
        (a, b) => haversineKm(origin, a.location) - haversineKm(origin, b.location)
      ),
    [origin]
  );

  const filtered = useMemo(() => {
    return localized.filter((c) => !bloodFilter || c.bloodTypesNeeded.includes(bloodFilter));
  }, [localized, bloodFilter]);

  const distanceFor = (c: BloodCamp) => haversineKm(origin, c.location);

  return (
    <Screen bg={colors.cream}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_PAD }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Eyebrow>Donate · Save lives</Eyebrow>
            <View
              style={{
                width: 38, height: 38, borderRadius: 999,
                backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="sliders" size={17} stroke={colors.ink} />
            </View>
          </View>
          <Hero style={{ marginTop: 12 }}>Blood camps,{'\n'}near you this week.</Hero>
        </View>

        <View style={{ paddingHorizontal: 22, paddingTop: 18, flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              padding: 3,
              backgroundColor: 'rgba(26,26,23,0.06)',
              borderRadius: 999,
            }}
          >
            {(['list', 'map'] as View_[]).map((v) => (
              <Pressable
                key={v}
                onPress={() => setView(v)}
                accessibilityRole="button"
                accessibilityState={{ selected: view === v }}
                hitSlop={4}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: view === v ? colors.paper : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Icon name={v === 'list' ? 'list' : 'map'} size={13} stroke={view === v ? colors.ink : colors.muted} />
                <Text style={{ marginLeft: 6, fontSize: 12.5, color: view === v ? colors.ink : colors.muted, fontFamily: fonts.sansSemi, textTransform: 'capitalize' }}>
                  {v}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <Caption>{filtered.length} drives</Caption>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 14, gap: 6 }}>
          <Chip active={bloodFilter === null} onPress={() => setBloodFilter(null)}>All types</Chip>
          {BLOOD_TYPES.map((b) => (
            <Chip key={b} active={bloodFilter === b} onPress={() => setBloodFilter(bloodFilter === b ? null : b)}>
              {b}
            </Chip>
          ))}
        </ScrollView>

        {view === 'map' ? (
          <MapView camps={filtered} onSelect={setSelected} />
        ) : (
          <View style={{ paddingHorizontal: 18, paddingTop: 16, gap: 10 }}>
            {filtered.length === 0 && (
              <View style={{ padding: 16, backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
                <Body size={14}>No camps match this filter.</Body>
              </View>
            )}
            {filtered.map((c) => (
              <CampCard key={c.id} c={c} onClick={() => setSelected(c)} distanceKm={distanceFor(c)} />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(26,26,23,0.42)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSelected(null)} accessibilityLabel="Dismiss" />
          {selected && <CampDetail c={selected} onClose={() => setSelected(null)} />}
        </View>
      </Modal>
    </Screen>
  );
}
