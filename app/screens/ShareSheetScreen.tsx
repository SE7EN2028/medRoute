import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import type { RootStackScreenProps } from '@app/navigation/types';
import { useAppStore } from '@app/store/useAppStore';
import { buildShareMessage, shareViaWhatsApp } from '@app/services/shareService';
import { Icon, type IconName } from '@app/components/Icon';
import { Btn } from '@app/components/Btn';
import { Title, Body, Eyebrow } from '@app/components/Type';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

type Channel = 'whatsapp' | 'sms' | 'share';

const CHANNELS: { id: Channel; label: string; icon: IconName; color: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
  { id: 'sms', label: 'SMS', icon: 'message', color: colors.sage },
  { id: 'share', label: 'Share sheet', icon: 'share', color: colors.ink },
];

export function ShareSheetScreen({ route, navigation }: RootStackScreenProps<'ShareSheet'>) {
  const { hospital, condition } = route.params;
  const contacts = useAppStore((s) => s.contacts);

  const [selected, setSelected] = useState<number[]>(contacts.length > 0 ? [0] : []);
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [sent, setSent] = useState(false);

  const message = useMemo(() => buildShareMessage({ hospital, condition }), [hospital, condition]);

  const toggle = (i: number) => {
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };

  const onSend = async () => {
    if (selected.length === 0) return;
    try {
      const phone = contacts[selected[0]]?.phone;
      await shareViaWhatsApp({ hospital, condition }, phone);
      setSent(true);
    } catch (e) {
      Alert.alert('Could not share', String(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(26,26,23,0.42)', justifyContent: 'flex-end' }}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Dismiss"
      />
      <View
        style={{
          backgroundColor: colors.cream2,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 38,
          maxHeight: '85%',
        }}
      >
        <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(26,26,23,0.18)', alignSelf: 'center', marginTop: 10 }} />

        {sent ? (
          <View style={{ paddingHorizontal: 28, paddingTop: 24, paddingBottom: 8, alignItems: 'center' }}>
            <View
              style={{
                width: 72, height: 72, borderRadius: 999,
                backgroundColor: colors.sageTint,
                marginVertical: 18,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="check-c" size={36} stroke={colors.sage} strokeWidth={1.6} />
            </View>
            <Title align="center">Help is on the way.</Title>
            <Body align="center" size={14} style={{ marginTop: 10 }}>
              Message sent to{' '}
              <Text style={{ color: colors.ink2, fontFamily: fonts.sansSemi }}>
                {selected.map((i) => contacts[i]?.name).filter(Boolean).join(' and ') || 'your contact'}
              </Text>
              . You’re not alone.
            </Body>
            <View style={{ marginTop: 24, width: '100%' }}>
              <Btn variant="primary" size="lg" full onPress={() => navigation.goBack()}>Done</Btn>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
              <View>
                <Eyebrow>Don't go alone</Eyebrow>
                <Title style={{ marginTop: 6 }}>Bring someone{'\n'}with you.</Title>
              </View>
              <Pressable
                onPress={() => navigation.goBack()}
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

            <View style={{ marginTop: 18 }}>
              <Text style={{ fontSize: 11.5, color: colors.muted, marginBottom: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: fonts.sansSemi }}>
                Send to
              </Text>
              {contacts.length === 0 ? (
                <View style={{ padding: 14, backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
                  <Body size={13}>No emergency contacts saved. Add one in Profile to use this feature.</Body>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {contacts.map((c, i) => {
                    const on = selected.includes(i);
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => toggle(i)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        hitSlop={4}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 12,
                          borderRadius: 16,
                          backgroundColor: on ? colors.sageTint : colors.paper,
                          borderWidth: 1,
                          borderColor: on ? colors.sageTint2 : colors.line,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <View
                          style={{
                            width: 42, height: 42, borderRadius: 14,
                            backgroundColor: i % 2 === 0 ? colors.sageTint2 : colors.terraTint,
                            alignItems: 'center', justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          <Text style={{ color: i % 2 === 0 ? colors.sage : '#8B4E32', fontFamily: fonts.serif, fontSize: 18, paddingTop: 2 }}>
                            {c.name[0]?.toUpperCase() ?? '?'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Body weight="semi" size={14} color={colors.ink}>{c.name}</Body>
                          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1, fontFamily: fonts.sans }}>
                            {c.relation ?? 'Contact'} · {c.phone}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 22, height: 22, borderRadius: 999,
                            borderWidth: 1.5, borderColor: on ? colors.sage : colors.line2,
                            backgroundColor: on ? colors.sage : 'transparent',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {on ? <Icon name="check" size={11} stroke="#fff" strokeWidth={2.5} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={{ marginTop: 18 }}>
              <Text style={{ fontSize: 11.5, color: colors.muted, marginBottom: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: fonts.sansSemi }}>
                How
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CHANNELS.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setChannel(c.id)}
                    hitSlop={4}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderRadius: 14,
                      backgroundColor: channel === c.id ? colors.paper : 'transparent',
                      borderWidth: 1,
                      borderColor: channel === c.id ? colors.ink : colors.line,
                      alignItems: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Icon name={c.icon} size={20} stroke={c.color} strokeWidth={1.5} />
                    <Text style={{ marginTop: 6, fontSize: 12, color: colors.ink2, fontFamily: fonts.sansSemi }}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginTop: 18 }}>
              <Text style={{ fontSize: 11.5, color: colors.muted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: fonts.sansSemi }}>
                Message preview
              </Text>
              <View
                style={{
                  padding: 14,
                  borderRadius: 18,
                  borderTopRightRadius: 4,
                  backgroundColor: '#DCF8C6',
                  marginLeft: 32,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20, fontFamily: fonts.sans }}>
                  {message}
                </Text>
                <Text style={{ marginTop: 6, fontSize: 10, color: 'rgba(26,26,23,0.5)', textAlign: 'right', fontFamily: fonts.sans }}>
                  now · ✓✓
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 22, marginBottom: 14 }}>
              <Btn
                variant={selected.length > 0 ? 'sage' : 'primary'}
                size="lg"
                full
                disabled={selected.length === 0}
                onPress={onSend}
                icon={<Icon name="paper-plane" size={16} stroke="#fff" />}
              >
                Send to {selected.length} {selected.length === 1 ? 'person' : 'people'}
              </Btn>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
