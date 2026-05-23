import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, Pressable } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import type { TabScreenProps } from '@app/navigation/types';
import { useAppStore } from '@app/store/useAppStore';
import { transcribeAudio } from '@app/services/groqService';
import { requestLocationPermission } from '@app/services/locationService';
import { Icon } from '@app/components/Icon';
import { Btn } from '@app/components/Btn';
import { Card } from '@app/components/Card';
import { Badge } from '@app/components/Badge';
import { Hero, Body, Caption, Eyebrow } from '@app/components/Type';
import { Screen, TAB_BAR_BOTTOM_PAD } from '@app/components/Screen';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

const SAMPLE_PROMPTS = [
  "My chest feels tight when I climb stairs and I'm short of breath",
  "Twisted my ankle playing football, can't put weight on it",
  "My toddler has a fever of 101°F and won't eat",
  'Bad headache for 3 days, light hurts my eyes',
];

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const apiKeys = useAppStore((s) => s.apiKeys);
  const contacts = useAppStore((s) => s.contacts);
  const lastTriage = useAppStore((s) => s.lastTriage);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = useMemo(() => contacts[0]?.name?.split(' ')[0] ?? 'there', [contacts]);

  // Ask for location once when Home mounts so the OSM hospital lookup has real
  // coords by the time the user triggers triage. Silent if already granted/denied.
  useEffect(() => {
    requestLocationPermission().catch(() => {});
  }, []);

  const onSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    navigation.navigate('TriageLoading', { symptom: trimmed });
  };

  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone permission needed', 'Enable mic access in Settings.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setListening(true);
    } catch (e) {
      Alert.alert('Could not start recording', String(e));
    }
  };

  const stopRecording = async () => {
    try {
      setListening(false);
      setTranscribing(true);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) throw new Error('No audio file');
      if (!apiKeys.groq) {
        Alert.alert('Voice unavailable', 'Add a Groq API key in Profile.');
        return;
      }
      const transcript = await transcribeAudio({ apiKey: apiKeys.groq, audioUri: uri });
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    } catch (e) {
      Alert.alert('Transcription failed', String(e));
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <Screen bg={colors.cream}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_PAD }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={{ paddingHorizontal: 22, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Icon name="logo" size={20} stroke={colors.cream2} />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.sans, lineHeight: 13 }}>{greeting},</Text>
              <Text style={{ fontSize: 15, marginTop: 3, color: colors.ink, fontFamily: fonts.sansMedium, lineHeight: 18 }}>{userName}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 999,
              backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon name="bell" size={18} stroke={colors.ink2} />
          </Pressable>
        </View>

        {/* Hero */}
        <View style={{ paddingHorizontal: 22, paddingTop: 28 }}>
          <Eyebrow style={{ marginBottom: 14 }}>Tell us how you feel</Eyebrow>
          <Hero>What’s going on,{'\n'}in your own words?</Hero>
        </View>

        {/* Input card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
          <View
            style={{
              backgroundColor: colors.paper,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: colors.line,
              padding: 18,
              shadowColor: '#1A1A17',
              shadowOpacity: 0.05,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            <TextInput
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Try: My chest feels tight and I'm a little short of breath when I climb stairs..."
              placeholderTextColor={colors.muted2}
              style={{
                minHeight: 160,
                fontFamily: fonts.sans,
                fontSize: 16,
                lineHeight: 24,
                color: colors.ink,
                textAlignVertical: 'top',
                letterSpacing: -0.1,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={listening ? 'Stop listening' : 'Speak'}
                onPress={listening ? stopRecording : startRecording}
                disabled={transcribing}
                hitSlop={6}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingLeft: 8,
                  paddingRight: 12,
                  borderRadius: 999,
                  backgroundColor: listening ? colors.brickTint : colors.cream,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 28, height: 28, borderRadius: 999,
                    backgroundColor: listening ? colors.brick : colors.ink,
                    alignItems: 'center', justifyContent: 'center', marginRight: 8,
                  }}
                >
                  <Icon name="mic" size={14} stroke="#fff" strokeWidth={2} />
                </View>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: listening ? colors.brick2 : colors.ink2 }}>
                  {transcribing ? 'Transcribing…' : listening ? 'Listening…' : 'Speak'}
                </Text>
              </Pressable>
              <Btn
                variant={text.trim() ? 'primary' : 'paper'}
                size="md"
                disabled={!text.trim()}
                onPress={onSubmit}
                icon={<Icon name="sparkles" size={15} stroke={text.trim() ? colors.cream2 : colors.muted} />}
              >
                Analyze symptoms
              </Btn>
            </View>
          </View>
        </View>

        {/* Sample prompts */}
        <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
          <Caption style={{ marginBottom: 10 }}>Or try one of these</Caption>
          <View style={{ gap: 8 }}>
            {SAMPLE_PROMPTS.map((p, i) => (
              <Pressable
                key={i}
                onPress={() => setText(p)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Icon name="sparkle" size={13} stroke={colors.terra} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    marginRight: 10,
                    fontSize: 13.5,
                    color: colors.ink2,
                    fontFamily: fonts.sans,
                    lineHeight: 19,
                  }}
                >
                  "{p}"
                </Text>
                <Icon name="arrow-up" size={13} stroke={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Emergency shortcut */}
        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call 108 emergency"
            style={({ pressed }) => ({
              width: '100%',
              padding: 14,
              paddingRight: 16,
              borderRadius: 18,
              backgroundColor: colors.brickDeep,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: 999,
                backgroundColor: colors.brick,
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}
            >
              <Icon name="phone-fill" size={18} stroke="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: '#fff', fontFamily: fonts.sansMedium }}>
                In immediate danger? Call 108.
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontFamily: fonts.sans }}>
                One-tap emergency services
              </Text>
            </View>
            <Icon name="chevron-r" size={16} stroke="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {/* Recent triage */}
        {lastTriage && (
          <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
            <Caption style={{ marginBottom: 10 }}>Recent check-in</Caption>
            <Card padding={14}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Caption>{new Date(lastTriage.createdAt).toLocaleString()}</Caption>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 14, color: colors.ink, marginTop: 4, fontFamily: fonts.sansSemi }}
                  >
                    {lastTriage.rawSymptom}
                  </Text>
                </View>
                <Badge
                  tone={lastTriage.severity === 'emergency' ? 'brick' : lastTriage.severity === 'urgent' ? 'amber' : 'sage'}
                  size="sm"
                >
                  {lastTriage.severity.charAt(0).toUpperCase() + lastTriage.severity.slice(1)}
                </Badge>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
