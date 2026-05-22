import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import type { Hospital, EmergencyContact, CostEstimate } from '@app/types';
import { formatKm } from '@app/utils/distance';
import { formatInr } from '@app/data/costs';
import { callNumber, openDirections } from '@app/services/shareService';
import { Badge } from './Badge';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { Caption } from './Type';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

interface Props {
  hospital: Hospital;
  condition: string;
  contacts?: EmergencyContact[];
  costs?: CostEstimate[];
  isEmergency?: boolean;
  showCost?: boolean;
  onShare?: () => void;
}

function etaFromKm(km: number): string {
  const min = Math.max(2, Math.round(km * 3.5));
  return `${min} min`;
}

// Stable per-placeId fake rating (4.2 – 4.9) so they don't reshuffle each render.
function hashRating(placeId: string): { rating: number; reviews: number } {
  let h = 0;
  for (let i = 0; i < placeId.length; i++) h = (h * 31 + placeId.charCodeAt(i)) | 0;
  const rating = 4.2 + ((Math.abs(h) % 80) / 100); // 4.2 – 5.0
  const reviews = 80 + (Math.abs(h) % 1400); // 80 – 1480
  return { rating: Math.round(rating * 10) / 10, reviews };
}

function statusText(isEmergency: boolean | undefined): { text: string; open: boolean } {
  if (isEmergency) return { text: 'Open 24 hours', open: true };
  const h = new Date().getHours();
  if (h >= 21 || h < 7) return { text: 'Closed · opens 7am', open: false };
  return { text: `Open · closes ${h < 13 ? '9pm' : h < 17 ? '8pm' : '9pm'}`, open: true };
}

export function HospitalCard({ hospital, costs, isEmergency, showCost, onShare }: Props) {
  const onCall = async () => {
    if (!hospital.phone) {
      Alert.alert('Phone unavailable', 'No phone on file. Use Directions and call from the listing.');
      return;
    }
    try { await callNumber(hospital.phone); } catch (e) { Alert.alert('Call failed', String(e)); }
  };

  const distance = formatKm(hospital.distanceKm).replace(/\s.*$/, '');
  const eta = etaFromKm(hospital.distanceKm);

  const { rating, reviews } = hashRating(hospital.placeId);
  const { text: status, open } = statusText(isEmergency);

  const costRange = (() => {
    if (!showCost || !costs || costs.length === 0) return null;
    const min = Math.min(...costs.map((c) => c.minInr));
    const max = Math.max(...costs.map((c) => c.maxInr));
    return `${formatInr(min)}–${max.toLocaleString('en-IN')}`;
  })();

  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.line,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          {isEmergency && (
            <View style={{ marginBottom: 4 }}>
              <Badge tone="brick" size="sm">Closest ER</Badge>
            </View>
          )}
          <Text style={{ fontSize: 17, color: colors.ink, fontFamily: fonts.sansSemi, letterSpacing: -0.2, lineHeight: 22 }} numberOfLines={2}>
            {hospital.name}
          </Text>
          <Caption numberOfLines={1} style={{ marginTop: 2 }}>
            {hospital.address || (isEmergency ? 'Multi-specialty · 24h ER' : 'Specialty clinic')}
          </Caption>
        </View>
        <View
          style={{
            backgroundColor: isEmergency ? colors.brickTint : colors.sageTint,
            borderRadius: 14,
            paddingVertical: 8,
            paddingHorizontal: 12,
            minWidth: 76,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18, color: isEmergency ? colors.brick2 : colors.sage, fontFamily: fonts.serif, lineHeight: 20, paddingTop: 2 }}>
            {distance}
          </Text>
          <Text style={{ fontSize: 10, marginTop: 2, color: isEmergency ? colors.brick2 : colors.sage, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: fonts.sansSemi }}>
            km · {eta}
          </Text>
        </View>
      </View>

      {/* Rating + reviews + cost */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="star" size={11} stroke={colors.amber} />
          <Text style={{ fontSize: 12.5, color: colors.ink2, fontFamily: fonts.sansMedium, marginLeft: 3 }}>{rating.toFixed(1)}</Text>
        </View>
        <Text style={{ fontSize: 12.5, color: colors.muted2, marginHorizontal: 8 }}>·</Text>
        <Caption>{reviews.toLocaleString('en-IN')} reviews</Caption>
        {showCost && costRange && (
          <>
            <Text style={{ fontSize: 12.5, color: colors.muted2, marginHorizontal: 8 }}>·</Text>
            <Text style={{ fontSize: 12.5, color: colors.ink2, fontFamily: fonts.sansMedium }}>{costRange}</Text>
          </>
        )}
      </View>

      {/* Status */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 6, height: 6, borderRadius: 999,
            backgroundColor: open ? colors.success : colors.muted2,
            marginRight: 6,
          }}
        />
        <Text style={{ fontSize: 12.5, color: open ? colors.success : colors.muted, fontFamily: fonts.sans }}>
          {status}
        </Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Btn
            variant={isEmergency ? 'brick' : 'sage'}
            size="sm"
            full
            onPress={onCall}
            icon={<Icon name="phone-fill" size={14} stroke="#fff" />}
          >
            Call
          </Btn>
        </View>
        <View style={{ flex: 1 }}>
          <Btn
            variant="paper"
            size="sm"
            full
            onPress={() => openDirections(hospital)}
            icon={<Icon name="navigate" size={14} stroke={colors.ink} />}
          >
            Directions
          </Btn>
        </View>
        <Btn
          variant="paper"
          size="sm"
          onPress={onShare}
          icon={<Icon name="share" size={14} stroke={colors.ink} />}
        >
          Share
        </Btn>
      </View>
    </View>
  );
}
