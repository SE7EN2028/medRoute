import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { TabScreenProps } from '@app/navigation/types';
import { Icon, type IconName } from '@app/components/Icon';
import { Card } from '@app/components/Card';
import { Btn } from '@app/components/Btn';
import { Toggle } from '@app/components/Toggle';
import { Hero, Body, Caption, Eyebrow } from '@app/components/Type';
import { Screen, TAB_BAR_BOTTOM_PAD } from '@app/components/Screen';
import { useAppStore } from '@app/store/useAppStore';
import { isNonEmpty, isPhoneish } from '@app/utils/validators';
import { colors } from '@app/theme/colors';
import { fonts } from '@app/theme/fonts';

function MiniIcon({ name, tint, stroke }: { name: IconName; tint: string; stroke: string }) {
  return (
    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={16} stroke={stroke} />
    </View>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
      <View style={{ paddingHorizontal: 6, paddingBottom: 10 }}>
        <Eyebrow>{title}</Eyebrow>
        {sub ? <Caption style={{ marginTop: 6 }}>{sub}</Caption> : null}
      </View>
      <View style={{ backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function Row({
  icon, title, sub, trailing, last, onPress,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  sub?: string;
  trailing?: React.ReactNode;
  last?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      }}
    >
      {icon}
      <View style={{ flex: 1, marginLeft: 12 }}>
        {typeof title === 'string' ? <Body weight="semi" size={14}>{title}</Body> : title}
        {sub ? <Caption numberOfLines={1} style={{ marginTop: 2 }}>{sub}</Caption> : null}
      </View>
      {trailing}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {inner}
    </Pressable>
  );
}

// Editable chip list — each item is a removable chip, plus an "+ Add" pressable that swaps into a text input.
function ChipList({
  items,
  onAdd,
  onRemove,
  placeholder,
  tint,
  inkColor,
}: {
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
  tint: string;
  inkColor: string;
}) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');

  const commit = () => {
    if (value.trim()) onAdd(value.trim());
    setValue('');
    setAdding(false);
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingVertical: 10 }}>
      {items.map((it) => (
        <View
          key={it}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 5,
            paddingLeft: 12,
            paddingRight: 6,
            borderRadius: 999,
            backgroundColor: tint,
          }}
        >
          <Text style={{ fontSize: 12.5, color: inkColor, fontFamily: fonts.sansSemi }}>{it}</Text>
          <Pressable
            onPress={() => onRemove(it)}
            hitSlop={6}
            accessibilityLabel={`Remove ${it}`}
            style={({ pressed }) => ({
              width: 18, height: 18, borderRadius: 999,
              backgroundColor: colors.ink,
              alignItems: 'center', justifyContent: 'center',
              marginLeft: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon name="x" size={9} stroke="#fff" strokeWidth={2.4} />
          </Pressable>
        </View>
      ))}
      {adding ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            paddingLeft: 12,
            paddingRight: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.line2,
            backgroundColor: colors.cream2,
          }}
        >
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.muted2}
            autoFocus
            onSubmitEditing={commit}
            onBlur={commit}
            returnKeyType="done"
            style={{ minWidth: 80, fontSize: 12.5, color: colors.ink, fontFamily: fonts.sansSemi, padding: 0, paddingVertical: 2 }}
          />
          <Pressable
            onPress={() => { setValue(''); setAdding(false); }}
            hitSlop={6}
            accessibilityLabel="Cancel"
            style={({ pressed }) => ({
              width: 22, height: 22, borderRadius: 999,
              backgroundColor: colors.ink,
              alignItems: 'center', justifyContent: 'center',
              marginLeft: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon name="x" size={11} stroke="#fff" strokeWidth={2.4} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          hitSlop={6}
          accessibilityLabel={`Add ${placeholder}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.line2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Icon name="plus" size={11} stroke={colors.muted} />
          <Text style={{ marginLeft: 4, fontSize: 12, color: colors.muted, fontFamily: fonts.sansMedium }}>Add</Text>
        </Pressable>
      )}
    </View>
  );
}

async function pickPhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Photo permission needed', 'Enable Photos access in Settings.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

export function ProfileScreen(_: TabScreenProps<'Profile'>) {
  const contacts = useAppStore((s) => s.contacts);
  const addContact = useAppStore((s) => s.addContact);
  const removeContact = useAppStore((s) => s.removeContact);
  const user = useAppStore((s) => s.user);
  const setUserName = useAppStore((s) => s.setUserName);
  const setUserPhoto = useAppStore((s) => s.setUserPhoto);
  const medical = useAppStore((s) => s.medicalInfo);
  const setBloodType = useAppStore((s) => s.setBloodType);
  const addAllergy = useAppStore((s) => s.addAllergy);
  const removeAllergy = useAppStore((s) => s.removeAllergy);
  const addCondition = useAppStore((s) => s.addCondition);
  const removeCondition = useAppStore((s) => s.removeCondition);
  const addMedication = useAppStore((s) => s.addMedication);
  const removeMedication = useAppStore((s) => s.removeMedication);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);

  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingBlood, setEditingBlood] = useState(false);
  const [bloodDraft, setBloodDraft] = useState('');

  // Local-only preferences (demo)
  const [prefLocation, setPrefLocation] = useState(true);
  const [prefNotifications, setPrefNotifications] = useState(true);
  const [prefVoice, setPrefVoice] = useState(false);
  const [prefCalm, setPrefCalm] = useState(true);

  const displayName = user.name || contacts[0]?.name || 'You';
  const initial = displayName[0]?.toUpperCase() ?? 'M';

  const onAddContact = () => {
    if (!isNonEmpty(cName) || !isPhoneish(cPhone)) {
      Alert.alert('Check the fields', 'Name and a valid phone (with country code) are required.');
      return;
    }
    addContact({ name: cName.trim(), phone: cPhone.trim() });
    setCName('');
    setCPhone('');
    setShowAddForm(false);
  };

  const cancelAddContact = () => {
    setCName('');
    setCPhone('');
    setShowAddForm(false);
  };

  const onEditPhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setUserPhoto(uri);
  };

  const onStartEditName = () => {
    setNameDraft(displayName === 'You' ? '' : displayName);
    setEditingName(true);
  };
  const onSaveName = () => {
    setUserName(nameDraft.trim());
    setEditingName(false);
  };

  const onStartEditBlood = () => {
    setBloodDraft(medical.bloodType ?? '');
    setEditingBlood(true);
  };
  const onSaveBlood = () => {
    setBloodType(bloodDraft);
    setEditingBlood(false);
  };

  const onResetOnboarding = () => {
    Alert.alert(
      'Restart onboarding?',
      'You will see the welcome flow again. Your contacts and profile remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', style: 'destructive', onPress: () => resetOnboarding() },
      ]
    );
  };

  return (
    <Screen bg={colors.cream}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_PAD }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <Eyebrow>You</Eyebrow>
          <Hero style={{ marginTop: 12 }}>Your care profile</Hero>
        </View>

        {/* Identity card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
          <Card padding={18}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar — tap to pick photo */}
              <Pressable
                onPress={onEditPhoto}
                accessibilityLabel="Change profile photo"
                hitSlop={6}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <View
                  style={{
                    width: 64, height: 64, borderRadius: 999,
                    backgroundColor: colors.sage,
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {user.photoUri ? (
                    <Image source={{ uri: user.photoUri }} style={{ width: 64, height: 64 }} />
                  ) : (
                    <Text style={{ color: '#fff', fontFamily: fonts.serif, fontSize: 28, paddingTop: 3 }}>{initial}</Text>
                  )}
                </View>
                {/* tiny camera badge */}
                <View
                  style={{
                    position: 'absolute', right: -2, bottom: -2,
                    width: 22, height: 22, borderRadius: 999,
                    backgroundColor: colors.ink,
                    borderWidth: 2, borderColor: colors.paper,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon name="edit" size={10} stroke="#fff" strokeWidth={2} />
                </View>
              </Pressable>

              <View style={{ flex: 1, marginLeft: 14 }}>
                {editingName ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      value={nameDraft}
                      onChangeText={setNameDraft}
                      placeholder="Your name"
                      placeholderTextColor={colors.muted2}
                      autoFocus
                      onSubmitEditing={onSaveName}
                      style={{ flex: 1, fontSize: 18, color: colors.ink, fontFamily: fonts.sansSemi, padding: 0 }}
                    />
                    <Pressable
                      onPress={onSaveName}
                      accessibilityLabel="Save name"
                      hitSlop={6}
                      style={({ pressed }) => ({ paddingHorizontal: 8, opacity: pressed ? 0.7 : 1 })}
                    >
                      <Icon name="check" size={16} stroke={colors.sage} strokeWidth={2.2} />
                    </Pressable>
                    <Pressable
                      onPress={() => setEditingName(false)}
                      accessibilityLabel="Cancel"
                      hitSlop={6}
                      style={({ pressed }) => ({
                        width: 24, height: 24, borderRadius: 999,
                        backgroundColor: colors.ink,
                        alignItems: 'center', justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Icon name="x" size={12} stroke="#fff" strokeWidth={2.4} />
                    </Pressable>
                  </View>
                ) : (
                  <Body weight="semi" size={18} color={colors.ink}>{displayName}</Body>
                )}
                <Caption style={{ marginTop: 2 }}>
                  {medical.bloodType ? `${medical.bloodType} blood type` : 'Tap edit to add details'}
                </Caption>
                {medical.allergies.length > 0 ? (
                  <Caption numberOfLines={1} style={{ marginTop: 2 }}>
                    Allergies: {medical.allergies.join(', ')}
                  </Caption>
                ) : null}
              </View>

              {!editingName && (
                <Pressable
                  onPress={onStartEditName}
                  accessibilityRole="button"
                  accessibilityLabel="Edit name"
                  hitSlop={6}
                  style={({ pressed }) => ({
                    width: 32, height: 32, borderRadius: 999,
                    backgroundColor: colors.cream,
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name="edit" size={14} stroke={colors.ink2} />
                </Pressable>
              )}
            </View>
          </Card>
        </View>

        {/* Emergency contacts */}
        <Section title="Emergency contacts" sub="Used by 'Bring someone with you'">
          {contacts.map((c, i) => (
            <Row
              key={c.id}
              icon={
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: i % 2 === 0 ? colors.sageTint : colors.terraTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: i % 2 === 0 ? colors.sage : '#8B4E32', fontFamily: fonts.serif, fontSize: 16, paddingTop: 2 }}>
                    {c.name[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              }
              title={c.name}
              sub={`${c.relation ?? 'Contact'} · ${c.phone}`}
              trailing={
                <Pressable
                  onPress={() => removeContact(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${c.name}`}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    width: 28, height: 28, borderRadius: 999,
                    backgroundColor: colors.ink,
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name="x" size={12} stroke="#fff" strokeWidth={2.4} />
                </Pressable>
              }
            />
          ))}
          <Row
            icon={
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.sageTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={16} stroke={colors.sage} />
              </View>
            }
            title={<Text style={{ fontSize: 14, color: colors.sage, fontFamily: fonts.sansSemi }}>Add another contact</Text>}
            last
            onPress={() => setShowAddForm((v) => !v)}
          />
        </Section>

        {/* Add contact form — collapses unless tapped */}
        {showAddForm && (
          <View style={{ paddingHorizontal: 18, paddingTop: 10 }}>
            <View style={{ backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14 }}>
              {/* Top bar: title + cancel X */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Body weight="semi" size={13} color={colors.ink}>New contact</Body>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={cancelAddContact}
                  accessibilityLabel="Cancel adding contact"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 30, height: 30, borderRadius: 999,
                    backgroundColor: colors.ink,
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name="x" size={14} stroke="#fff" strokeWidth={2.4} />
                </Pressable>
              </View>
              <TextInput
                placeholder="Name"
                placeholderTextColor={colors.muted2}
                value={cName}
                onChangeText={setCName}
                style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line, fontSize: 14, color: colors.ink, fontFamily: fonts.sans }}
              />
              <TextInput
                placeholder="Phone (+91 …)"
                placeholderTextColor={colors.muted2}
                value={cPhone}
                onChangeText={setCPhone}
                keyboardType="phone-pad"
                style={{ paddingVertical: 8, fontSize: 14, color: colors.ink, fontFamily: fonts.sans }}
              />
              <View style={{ marginTop: 10 }}>
                <Btn variant="primary" size="md" full onPress={onAddContact} icon={<Icon name="plus" size={14} stroke={colors.cream2} />}>
                  Save contact
                </Btn>
              </View>
            </View>
          </View>
        )}

        {/* Medical info */}
        <Section title="Medical information" sub="Shared automatically if you call 108 via MedRoute">
          {/* Blood type row — tap to edit */}
          <Row
            icon={<MiniIcon name="droplet" tint={colors.brickTint} stroke={colors.brick2} />}
            title="Blood type"
            onPress={editingBlood ? undefined : onStartEditBlood}
            trailing={
              editingBlood ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    value={bloodDraft}
                    onChangeText={setBloodDraft}
                    placeholder="O+"
                    placeholderTextColor={colors.muted2}
                    autoFocus
                    onSubmitEditing={onSaveBlood}
                    autoCapitalize="characters"
                    maxLength={4}
                    style={{ minWidth: 60, textAlign: 'right', fontSize: 14, color: colors.ink2, fontFamily: fonts.sansSemi, padding: 0 }}
                  />
                  <Pressable
                    onPress={onSaveBlood}
                    accessibilityLabel="Save blood type"
                    hitSlop={6}
                    style={({ pressed }) => ({ paddingHorizontal: 8, opacity: pressed ? 0.7 : 1 })}
                  >
                    <Icon name="check" size={14} stroke={colors.sage} strokeWidth={2.2} />
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingBlood(false)}
                    accessibilityLabel="Cancel"
                    hitSlop={6}
                    style={({ pressed }) => ({
                      width: 22, height: 22, borderRadius: 999,
                      backgroundColor: colors.ink,
                      alignItems: 'center', justifyContent: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Icon name="x" size={10} stroke="#fff" strokeWidth={2.4} />
                  </Pressable>
                </View>
              ) : (
                <Text style={{ fontSize: 14, color: medical.bloodType ? colors.ink2 : colors.muted2, fontFamily: fonts.sansSemi }}>
                  {medical.bloodType || 'Not set'}
                </Text>
              )
            }
          />

          {/* Medications */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
              <MiniIcon name="pill" tint={colors.amberTint} stroke={colors.amberInk} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Body weight="semi" size={14}>Active medications</Body>
              </View>
              <Text style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemi }}>{medical.medications.length}</Text>
            </View>
            <ChipList
              items={medical.medications}
              onAdd={addMedication}
              onRemove={removeMedication}
              placeholder="e.g. Metformin"
              tint={colors.amberTint}
              inkColor={colors.amberInk}
            />
          </View>

          {/* Allergies */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
              <MiniIcon name="alert" tint={colors.terraTint} stroke="#8B4E32" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Body weight="semi" size={14}>Allergies</Body>
              </View>
              <Text style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemi }}>{medical.allergies.length}</Text>
            </View>
            <ChipList
              items={medical.allergies}
              onAdd={addAllergy}
              onRemove={removeAllergy}
              placeholder="e.g. Penicillin"
              tint={colors.terraTint}
              inkColor="#8B4E32"
            />
          </View>

          {/* Conditions */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
              <MiniIcon name="heart-pulse" tint={colors.sageTint} stroke={colors.sage} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Body weight="semi" size={14}>Conditions</Body>
              </View>
              <Text style={{ fontSize: 13, color: medical.conditions.length === 0 ? colors.muted2 : colors.muted, fontFamily: fonts.sansSemi }}>
                {medical.conditions.length === 0 ? 'None' : medical.conditions.length}
              </Text>
            </View>
            <ChipList
              items={medical.conditions}
              onAdd={addCondition}
              onRemove={removeCondition}
              placeholder="e.g. Asthma"
              tint={colors.sageTint}
              inkColor={colors.sage}
            />
          </View>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <PrefRow
            icon={<MiniIcon name="pin" tint={colors.sageTint} stroke={colors.sage} />}
            title="Location access"
            value={prefLocation}
            onChange={setPrefLocation}
          />
          <PrefRow
            icon={<MiniIcon name="bell" tint={colors.amberTint} stroke={colors.amberInk} />}
            title="Notifications"
            value={prefNotifications}
            onChange={setPrefNotifications}
          />
          <PrefRow
            icon={<MiniIcon name="volume" tint={colors.terraTint} stroke="#8B4E32" />}
            title="Voice input"
            value={prefVoice}
            onChange={setPrefVoice}
          />
          <PrefRow
            icon={<MiniIcon name="leaf" tint={colors.sageTint} stroke={colors.sage} />}
            title="Calmer color mode"
            value={prefCalm}
            onChange={setPrefCalm}
            last
          />
        </Section>

        {/* Footer */}
        <View style={{ paddingHorizontal: 22, paddingTop: 24, alignItems: 'center' }}>
          <Pressable
            onPress={onResetOnboarding}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => ({ paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <Caption color={colors.muted}>Restart onboarding</Caption>
          </Pressable>
          <Caption color={colors.muted2} style={{ marginTop: 8 }}>
            MedRoute v0.1 · made with care
          </Caption>
        </View>
      </ScrollView>
    </Screen>
  );
}

// Preferences row — leaves room on the right (paddingRight 6) so the toggle stays inside the card.
function PrefRow({
  icon, title, value, onChange, last,
}: {
  icon: React.ReactNode;
  title: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      }}
    >
      {icon}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Body weight="semi" size={14}>{title}</Body>
      </View>
      <Toggle value={value} onChange={onChange} accessibilityLabel={title} />
    </View>
  );
}
