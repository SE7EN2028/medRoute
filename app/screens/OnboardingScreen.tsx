import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Circle, Path, Rect, Defs, RadialGradient, Stop, LinearGradient as SvgLinearGradient, G } from 'react-native-svg';
import type { RootStackScreenProps } from '@app/navigation/types';
import { Btn } from '@app/components/Btn';
import { Icon } from '@app/components/Icon';
import { Display, Hero, Body, Caption, Eyebrow } from '@app/components/Type';
import { Screen } from '@app/components/Screen';
import { BottomBar } from '@app/components/BottomBar';
import { useAppStore } from '@app/store/useAppStore';
import { requestLocationPermission } from '@app/services/locationService';
import { isNonEmpty, isPhoneish } from '@app/utils/validators';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

// =================== Onboarding art ===================
function Art1() {
  return (
    <Svg viewBox="0 0 300 260" width="100%" height={220}>
      <Defs>
        <RadialGradient id="g1" cx="0.5" cy="0.5" r="0.6">
          <Stop offset="0%" stopColor="#E4ECE6" stopOpacity={1} />
          <Stop offset="100%" stopColor="#F6F1E8" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={150} cy={130} r={120} fill="url(#g1)" />
      {[40, 62, 84, 106].map((r, i) => (
        <Circle key={i} cx={150} cy={130} r={r} fill="none" stroke="#2E6859" strokeOpacity={0.16 - i * 0.025} strokeWidth={1} />
      ))}
      <G transform="translate(150 130)">
        <Rect x={-9} y={-26} width={18} height={52} rx={5} fill="#2E6859" />
        <Rect x={-26} y={-9} width={52} height={18} rx={5} fill="#2E6859" />
      </G>
      <Circle cx={150} cy={130} r={3} fill="#F6F1E8" />
    </Svg>
  );
}

function Art2() {
  return (
    <Svg viewBox="0 0 300 260" width="100%" height={220}>
      <Defs>
        <SvgLinearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#F4E4D9" stopOpacity={1} />
          <Stop offset="100%" stopColor="#F6F1E8" stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={50} width={300} height={200} fill="url(#g2)" />
      <Path d="M40 200 Q 100 60, 150 130 T 260 90" fill="none" stroke="#C97B5C" strokeWidth={1.5} strokeDasharray="3 5" opacity={0.7} />
      <Circle cx={40} cy={200} r={14} fill="#fff" stroke="#1A1A17" strokeWidth={1.5} />
      <Circle cx={150} cy={130} r={14} fill="#fff" stroke="#1A1A17" strokeWidth={1.5} />
      <Circle cx={260} cy={90} r={18} fill="#2E6859" />
      <Path d="m253 90 5 5 9-9" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Art3() {
  return (
    <Svg viewBox="0 0 300 260" width="100%" height={220}>
      <Defs>
        <RadialGradient id="g3" cx="0.5" cy="0.5" r="0.55">
          <Stop offset="0%" stopColor="#F4DDD8" stopOpacity={1} />
          <Stop offset="100%" stopColor="#F6F1E8" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={150} cy={130} r={120} fill="url(#g3)" />
      <G transform="translate(110 110)">
        <Circle cx={0} cy={0} r={22} fill="#1A1A17" />
        <Path d="M-30 60 Q 0 30, 30 60 Z" fill="#1A1A17" />
      </G>
      <G transform="translate(190 110)">
        <Circle cx={0} cy={0} r={22} fill="#C97B5C" />
        <Path d="M-30 60 Q 0 30, 30 60 Z" fill="#C97B5C" />
      </G>
      <G transform="translate(150 100)">
        <Path d="M0 18 C -14 6, -14 -8, -6 -8 C -2 -8, 0 -4, 0 0 C 0 -4, 2 -8, 6 -8 C 14 -8, 14 6, 0 18 Z" fill="#B8463A" />
      </G>
    </Svg>
  );
}

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  art: React.ReactNode;
}

const SLIDES: Slide[] = [
  { eyebrow: 'Welcome',     title: 'Care, when\nyou’re unsure.',     body: "Describe how you feel — in your own words. We'll help you understand whether it's urgent, and where to go.", art: <Art1 /> },
  { eyebrow: 'How it works',title: 'No diagnosis.\nDirection.',      body: "MedRoute listens, then points you toward the right kind of help — emergency, specialist, or routine. It doesn't replace doctors. It helps you reach one.", art: <Art2 /> },
  { eyebrow: 'Not alone',   title: 'Bring someone\nwith you.',       body: 'One tap shares the hospital and your condition with a trusted contact. Because going alone is hard.', art: <Art3 /> },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [aboutName, setAboutName] = useState('');
  const [aboutBlood, setAboutBlood] = useState<string>('');
  const [contacts, setContacts] = useState([
    { name: '', phone: '', relation: '' },
    { name: '', phone: '', relation: '' },
  ]);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const acceptDisclaimer = useAppStore((s) => s.acceptDisclaimer);
  const addContact = useAppStore((s) => s.addContact);
  const setUserName = useAppStore((s) => s.setUserName);
  const setBloodType = useAppStore((s) => s.setBloodType);

  const finish = () => {
    if (aboutName.trim()) setUserName(aboutName.trim());
    if (aboutBlood.trim()) setBloodType(aboutBlood.trim());
    contacts.forEach((c) => {
      if (isNonEmpty(c.name) && isPhoneish(c.phone)) {
        addContact({ name: c.name.trim(), phone: c.phone.trim(), relation: c.relation.trim() || undefined });
      }
    });
    completeOnboarding();
    acceptDisclaimer();
    navigation.replace('Tabs');
  };

  const RELATIONS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'];

  // ===================== SLIDES 0–2 =====================
  if (step < 3) {
    const s = SLIDES[step];
    const continueAction = async () => {
      if (step === 1) await requestLocationPermission();
      setStep(step + 1);
    };
    return (
      <Screen bg={colors.cream}>
        <View style={{ paddingHorizontal: 28, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 22 : 8,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i <= step ? colors.ink : 'rgba(26,26,23,0.18)',
                }}
              />
            ))}
          </View>
          <Pressable onPress={() => setStep(3)} accessibilityRole="button" hitSlop={10}>
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: fonts.sansMedium }}>Skip</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{s.art}</View>
          <View style={{ paddingBottom: 12 }}>
            <Eyebrow style={{ marginBottom: 14 }}>{s.eyebrow}</Eyebrow>
            <Display>{s.title}</Display>
            <Body size={16} style={{ marginTop: 16, maxWidth: 320 }}>
              {s.body}
            </Body>
          </View>
        </View>

        <BottomBar bg={colors.cream}>
          <Btn
            variant="primary"
            size="xl"
            full
            onPress={continueAction}
            iconRight={<Icon name="arrow-right" size={18} stroke={colors.cream2} />}
          >
            {step < 2 ? 'Continue' : 'I understand'}
          </Btn>
        </BottomBar>
      </Screen>
    );
  }

  // ===================== STEP 3: DISCLAIMER =====================
  if (step === 3) {
    return (
      <Screen bg={colors.cream2}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              width: 56, height: 56, borderRadius: 18,
              backgroundColor: colors.amberTint,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Icon name="shield-plus" size={28} stroke={colors.amberInk} />
          </View>
          <Hero>Before we begin,{'\n'}please read this.</Hero>

          <View
            style={{
              marginTop: 28,
              padding: 20,
              backgroundColor: colors.paper,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text style={{ fontSize: 15, lineHeight: 23, color: colors.ink2, fontFamily: fonts.sans }}>
              MedRoute is an{' '}
              <Text style={{ color: colors.ink, fontFamily: fonts.sansSemi }}>informational tool</Text>
              , not a substitute for professional medical advice, diagnosis, or treatment.{'\n\n'}
              In emergencies — chest pain, severe bleeding, stroke symptoms, breathing trouble —{' '}
              <Text style={{ color: colors.brick2, fontFamily: fonts.sansSemi }}>call 108 immediately</Text>
              .{'\n\n'}
              We use your location to find nearby care, and never store the symptoms you describe.
            </Text>
          </View>

          <Pressable
            onPress={() => setAccepted(!accepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            hitSlop={8}
            style={({ pressed }) => ({
              marginTop: 28,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: accepted ? colors.terra : colors.line,
              backgroundColor: accepted ? colors.terraTint : 'transparent',
              flexDirection: 'row',
              alignItems: 'flex-start',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 26, height: 26, borderRadius: 8,
                backgroundColor: accepted ? colors.terra : 'transparent',
                borderWidth: 1.5, borderColor: accepted ? colors.terra : colors.line2,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}
            >
              {accepted && <Icon name="check" size={15} stroke="#fff" strokeWidth={2.4} />}
            </View>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: accepted ? '#5C3621' : colors.ink2, fontFamily: fonts.sans }}>
              I understand MedRoute provides guidance, not diagnosis, and I’ll call{' '}
              <Text style={{ fontFamily: fonts.sansSemi }}>108</Text> in life-threatening situations.
            </Text>
          </Pressable>
        </ScrollView>

        <BottomBar bg={colors.cream2}>
          <Btn
            variant="primary"
            size="xl"
            full
            disabled={!accepted}
            onPress={() => setStep(4)}  // → About You
            iconRight={accepted ? <Icon name="arrow-right" size={18} stroke={colors.cream2} /> : undefined}
          >
            Continue
          </Btn>
        </BottomBar>
      </Screen>
    );
  }

  // ===================== STEP 4: ABOUT YOU =====================
  if (step === 4) {
    const nameOk = aboutName.trim().length >= 1;
    return (
      <Screen bg={colors.cream}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingTop: 20,
            }}
          >
            <Eyebrow>Step 4 of 5</Eyebrow>
            <Pressable
              onPress={() => setStep(5)}
              accessibilityRole="button"
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ fontSize: 14, color: colors.muted, fontFamily: fonts.sansMedium }}>Skip</Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Hero>A little{'\n'}about you.</Hero>
            <Body size={15} style={{ marginTop: 12 }}>
              We use this to personalise your profile and share with care providers in emergencies.
            </Body>

            {/* Name input */}
            <View style={{ marginTop: 28 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontFamily: fonts.sansMedium,
                  marginBottom: 8,
                }}
              >
                Your name
              </Text>
              <View
                style={{
                  backgroundColor: colors.paper,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 18,
                  padding: 14,
                }}
              >
                <TextInput
                  placeholder="e.g. Aanya Krishnan"
                  placeholderTextColor={colors.muted2}
                  value={aboutName}
                  onChangeText={setAboutName}
                  autoCapitalize="words"
                  style={{ fontSize: 16, color: colors.ink, fontFamily: fonts.sansSemi, padding: 0 }}
                />
              </View>
            </View>

            {/* Blood type pill grid */}
            <View style={{ marginTop: 22 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontFamily: fonts.sansMedium,
                  marginBottom: 8,
                }}
              >
                Blood type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BLOOD_TYPES.map((b) => {
                  const active = aboutBlood === b;
                  return (
                    <Pressable
                      key={b}
                      onPress={() => setAboutBlood(active ? '' : b)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      hitSlop={4}
                      style={({ pressed }) => ({
                        width: 64,
                        height: 44,
                        borderRadius: 999,
                        backgroundColor: active ? colors.ink : colors.paper,
                        borderWidth: 1,
                        borderColor: active ? colors.ink : colors.line2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: active ? colors.cream2 : colors.ink2,
                          fontFamily: fonts.mono,
                          letterSpacing: 0.3,
                        }}
                      >
                        {b}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Caption color={colors.muted2} style={{ marginTop: 10 }}>
                Optional — you can set this later in Profile too.
              </Caption>
            </View>
          </ScrollView>

          <BottomBar bg={colors.cream}>
            <Btn
              variant="primary"
              size="xl"
              full
              disabled={!nameOk}
              onPress={() => setStep(5)}
              iconRight={nameOk ? <Icon name="arrow-right" size={18} stroke={colors.cream2} /> : undefined}
            >
              Continue
            </Btn>
          </BottomBar>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  // ===================== STEP 5: CONTACTS =====================
  const valid = contacts.some((c) => isNonEmpty(c.name) && isPhoneish(c.phone));
  return (
    <Screen bg={colors.cream}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top bar with eyebrow + Skip on the right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 20,
          }}
        >
          <Eyebrow>Step 5 of 5</Eyebrow>
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: fonts.sansMedium }}>Skip for now</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Hero>Who should we{'\n'}reach for you?</Hero>
          <Body size={15} style={{ marginTop: 12 }}>
            Two people you’d want notified if you’re heading to a hospital. Stored only on your device.
          </Body>

          <View style={{ marginTop: 28, gap: 12 }}>
            {contacts.map((c, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: colors.paper,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: i === 0 ? colors.sageTint : colors.terraTint,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 18, color: i === 0 ? colors.sage : '#8B4E32', fontFamily: fonts.serif, paddingTop: 2 }}>
                    {c.name ? c.name[0].toUpperCase() : `${i + 1}`}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Name"
                    placeholderTextColor={colors.muted2}
                    value={c.name}
                    onChangeText={(v) => setContacts((arr) => arr.map((x, j) => (j === i ? { ...x, name: v } : x)))}
                    style={{ fontSize: 15, color: colors.ink, fontFamily: fonts.sansSemi, padding: 0 }}
                  />
                  <TextInput
                    placeholder="+91 phone number"
                    placeholderTextColor={colors.muted2}
                    keyboardType="phone-pad"
                    value={c.phone}
                    onChangeText={(v) => setContacts((arr) => arr.map((x, j) => (j === i ? { ...x, phone: v } : x)))}
                    style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.sans, padding: 0, marginTop: 2 }}
                  />
                </View>
                {/* Relation dropdown chip — cycles through options on tap */}
                <Pressable
                  onPress={() => {
                    const idx = RELATIONS.indexOf(c.relation);
                    const next = RELATIONS[(idx + 1) % (RELATIONS.length + 1)] ?? '';
                    setContacts((arr) => arr.map((x, j) => (j === i ? { ...x, relation: next } : x)));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Relation: ${c.relation || 'unset'}, tap to change`}
                  hitSlop={4}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.line2,
                    backgroundColor: colors.cream2,
                    marginLeft: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 12, color: colors.ink2, fontFamily: fonts.sansMedium }}>
                    {c.relation || 'Relation'}
                  </Text>
                  <Text style={{ marginLeft: 4, fontSize: 10, color: colors.muted }}>▾</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Add another contact link */}
          <Pressable
            onPress={() => setContacts((arr) => [...arr, { name: '', phone: '', relation: '' }])}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginTop: 12,
              alignSelf: 'flex-start',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icon name="plus" size={14} stroke={colors.muted} />
            <Text style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.sansMedium, marginLeft: 6 }}>
              Add another contact
            </Text>
          </Pressable>
        </ScrollView>

        <BottomBar bg={colors.cream}>
          <Btn
            variant="primary"
            size="xl"
            full
            disabled={!valid}
            onPress={finish}
            iconRight={valid ? <Icon name="arrow-right" size={18} stroke="#fff" /> : undefined}
          >
            Finish setup
          </Btn>
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
