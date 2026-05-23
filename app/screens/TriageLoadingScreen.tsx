import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '@app/navigation/types';
import { Icon } from '@app/components/Icon';
import { Title, Body, Eyebrow } from '@app/components/Type';
import { colors } from '@app/theme/colors';
import { useAppStore } from '@app/store/useAppStore';
import { triageSymptom, GroqError } from '@app/services/groqService';
import { getCurrentLocation } from '@app/services/locationService';

const STEPS = [
  'Reading your description',
  'Checking for emergency signs',
  'Matching to a specialty',
  'Finding nearby care',
];

function PulseRing({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const animate = () => {
      scale.setValue(1);
      opacity.setValue(0.5);
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.9, duration: 2400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) animate();
      });
    };
    const t = setTimeout(animate, delay);
    return () => clearTimeout(t);
  }, [scale, opacity, delay]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 92,
        height: 92,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.sage,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

function BreathingRing() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => <PulseRing key={i} delay={i * 600} />)}
      <Animated.View
        style={{
          width: 92,
          height: 92,
          borderRadius: 999,
          backgroundColor: colors.sage,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
          shadowColor: colors.sage,
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Icon name="sparkles" size={36} stroke="#fff" strokeWidth={1.4} />
      </Animated.View>
    </View>
  );
}

export function TriageLoadingScreen({ route, navigation }: RootStackScreenProps<'TriageLoading'>) {
  const { symptom } = route.params;
  const [step, setStep] = useState(0);
  const apiKeys = useAppStore((s) => s.apiKeys);
  const setTriageResult = useAppStore((s) => s.setTriageResult);
  const setLastLocation = useAppStore((s) => s.setLastLocation);

  useEffect(() => {
    const t = setInterval(() => setStep((a) => Math.min(a + 1, STEPS.length - 1)), 700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        getCurrentLocation().then((loc) => setLastLocation(loc)).catch(() => {});
        const result = await triageSymptom({ apiKey: apiKeys.groq, symptom });
        if (cancelled) return;
        setTriageResult(result);
        await new Promise((r) => setTimeout(r, 1500));
        if (cancelled) return;
        if (result.severity === 'emergency') navigation.replace('Emergency', { triage: result });
        else navigation.replace('Results', { triage: result });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof GroqError ? e.message : String(e);
        Alert.alert('Triage failed', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    })();
    return () => { cancelled = true; };
  }, [apiKeys.groq, symptom, navigation, setTriageResult, setLastLocation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream2 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 28, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <BreathingRing />
          </View>
          <Title align="center">Take a slow breath.{'\n'}We’re reading carefully.</Title>
          <Body size={14} align="center" style={{ marginTop: 12 }}>
            This usually takes a few seconds.
          </Body>

          <View style={{ marginTop: 36, alignSelf: 'center', maxWidth: 280, width: '100%', gap: 10 }}>
            {STEPS.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: i <= step ? 1 : 0.32,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      borderWidth: isDone ? 0 : 1.5,
                      borderColor: isActive ? colors.sage : colors.line2,
                      backgroundColor: isDone ? colors.sage : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {isDone && <Icon name="check" size={11} stroke="#fff" strokeWidth={2.6} />}
                    {isActive && <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: colors.sage }} />}
                  </View>
                  <Body size={14} color={colors.ink2}>{s}</Body>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={{
            padding: 14,
            backgroundColor: colors.paper,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Eyebrow>Your description</Eyebrow>
          <Body size={13} numberOfLines={3} style={{ marginTop: 4 }}>
            "{symptom}"
          </Body>
        </View>
      </SafeAreaView>
    </View>
  );
}
