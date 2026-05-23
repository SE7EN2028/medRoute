import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Platform, ActivityIndicator } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { Icon } from './Icon';
import { Btn } from './Btn';
import { Body, Caption, Title } from './Type';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';
import { getLastKnownLocation, DEFAULT_LOCATION } from '@app/services/locationService';
import { reverseGeocode } from '@app/services/geocodeService';
import type { LatLng, ManualLocation } from '@app/types';

interface Props {
  visible: boolean;
  initial?: ManualLocation | null;
  onClose: () => void;
  onConfirm: (m: ManualLocation) => void;
}

export function LocationPicker({ visible, initial, onClose, onConfirm }: Props) {
  const [region, setRegion] = useState<Region | null>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [resolvingLabel, setResolvingLabel] = useState(false);
  const [label, setLabel] = useState<string>('');
  const mapRef = useRef<MapView | null>(null);
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      // Seed region: previous manual → device GPS → default city
      let seed: LatLng = DEFAULT_LOCATION;
      if (initial) seed = { lat: initial.lat, lng: initial.lng };
      else {
        const gps = await getLastKnownLocation();
        if (gps) seed = gps;
      }
      const r: Region = {
        latitude: seed.lat,
        longitude: seed.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      setRegion(r);
      setCenter(seed);
      setLabel(initial?.label ?? '');
    })();
  }, [visible, initial]);

  const onRegionChange = (r: Region) => {
    const c = { lat: r.latitude, lng: r.longitude };
    setCenter(c);
    // Debounce reverse-geocode so we don't spam Nominatim during pan.
    if (labelTimer.current) clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(async () => {
      setResolvingLabel(true);
      try {
        const text = await reverseGeocode(c.lat, c.lng);
        setLabel(text);
      } finally {
        setResolvingLabel(false);
      }
    }, 500);
  };

  const onUseHere = async () => {
    if (!center) return;
    let finalLabel = label;
    if (!finalLabel) {
      finalLabel = await reverseGeocode(center.lat, center.lng);
    }
    onConfirm({ label: finalLabel, lat: center.lat, lng: center.lng });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 12,
            backgroundColor: colors.cream,
          }}
        >
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
          <Title>Pin location</Title>
          <View style={{ width: 32 }} />
        </View>

        {/* Map */}
        <View style={{ flex: 1, position: 'relative' }}>
          {region ? (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={region}
              onRegionChangeComplete={onRegionChange}
              provider={Platform.OS === 'android' ? 'google' : undefined}
              showsUserLocation
              showsMyLocationButton={false}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.sage} />
            </View>
          )}

          {/* Center crosshair / pin — sits in middle of map, doesn't intercept gestures */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0, right: 0, top: 0, bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 36, height: 36, borderRadius: 999,
                backgroundColor: 'rgba(46,104,89,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 14, height: 14, borderRadius: 999,
                  backgroundColor: colors.sage,
                  borderWidth: 3, borderColor: '#fff',
                }}
              />
            </View>
            {/* Pin stem */}
            <View
              style={{
                width: 2, height: 22,
                backgroundColor: colors.sage,
                marginTop: -2,
              }}
            />
          </View>

          {/* Center coords readout — top-left chip */}
          {center && (
            <View
              style={{
                position: 'absolute',
                top: 12, left: 12,
                paddingVertical: 6, paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.92)',
                flexDirection: 'row', alignItems: 'center',
              }}
            >
              <Icon name="pin" size={12} stroke={colors.sage} />
              <Text style={{ marginLeft: 6, fontSize: 11.5, color: colors.ink2, fontFamily: fonts.mono }}>
                {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom card with resolved label + confirm */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: 28,
            backgroundColor: colors.cream2,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
            <View
              style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: colors.sageTint,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Icon name="pin" size={16} stroke={colors.sage} />
            </View>
            <View style={{ flex: 1 }}>
              <Body weight="semi" size={13} color={colors.ink}>This spot</Body>
              {resolvingLabel ? (
                <Caption color={colors.muted2} style={{ marginTop: 2 }}>Looking up address…</Caption>
              ) : (
                <Caption numberOfLines={2} style={{ marginTop: 2 }}>
                  {label || 'Drag the map, then tap "Use this location"'}
                </Caption>
              )}
            </View>
          </View>
          <Btn variant="primary" size="lg" full onPress={onUseHere} disabled={!center}>
            Use this location
          </Btn>
        </View>
      </View>
    </Modal>
  );
}
