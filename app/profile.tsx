import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import TabScreen from '../components/TabScreen';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { useHabitHistory } from '../hooks/useHabitHistory';
import colors from '../constants/colors';
import { getDisplayNameFromEmail, getInitial } from '../utils/user';

function StatCell({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) {
  const content = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.statCell}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.statCell}>
      {content}
    </View>
  );
}

function InfoCircleIcon() {
  return (
    <View style={styles.infoIcon}>
      <Text style={styles.infoIconText}>i</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const { data: habits = [], refetch: refetchHabits } = useHabits();
  const { data: history = [], refetch: refetchHistory } = useHabitHistory();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const displayName = (user?.user_metadata?.name as string | undefined) || getDisplayNameFromEmail(user?.email, 'there');
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const completedCount = history.filter((entry) => entry.completed).length;
  const completionRate = history.length > 0 ? Math.round((completedCount / history.length) * 100) : 0;

  useEffect(() => {
    if (editOpen) {
      setName(displayName);
      setPhotoUri(null);
      setError('');
    }
  }, [displayName, editOpen]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoMimeType(result.assets[0].mimeType ?? 'image/jpeg');
      setError('');
    }
  };

  const saveChanges = async () => {
    const trimmed = name.trim();
    if (!trimmed || !user || saving) return;

    setSaving(true);
    setError('');
    try {
      let nextAvatarUrl = avatarUrl;
      if (photoUri) {
        const ext = photoMimeType?.split('/')[1] ?? photoUri.split('.').pop() ?? 'jpg';
        const fileName = `${user.id}/avatar.${ext}`;
        const response = await fetch(photoUri);
        const fileBody = await response.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileBody, { upsert: true, contentType: photoMimeType ?? `image/${ext}` });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        nextAvatarUrl = data.publicUrl;
      }

      await updateProfile(trimmed, nextAvatarUrl);
      await Promise.all([refetchHabits(), refetchHistory()]);
      setEditOpen(false);
    } catch (e) {
      setError((e as Error).message ?? 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = () => {
    Alert.alert('This will permanently delete your account and all your habit data. This cannot be undone.', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: () => {
          Alert.alert('Are you absolutely sure?', '', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete my account',
              style: 'destructive',
              onPress: async () => {
                try {
                  if (!user) throw new Error('No active user.');
                  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                  if (deleteError) throw deleteError;
                  await AsyncStorage.clear();
                  router.replace('/(auth)/login');
                } catch (e) {
                  setError((e as Error).message ?? 'Could not delete account.');
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <TabScreen>
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View />
          <Pressable onPress={() => setEditOpen(true)} style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.identity}>
          <View style={styles.avatarLarge}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarLargeImage} /> : <Text style={styles.avatarLargeText}>{getInitial(displayName)}</Text>}
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.statsCard}>
          <StatCell value={`${completionRate}%`} label="Completion rate" />
          <View style={styles.statDivider} />
          <StatCell value={String(completedCount)} label="Habits done" />
          <View style={styles.statDivider} />
          <StatCell value={String(habits.length)} label="Total tracked" onPress={() => router.push('/profile-habits')} />
        </View>

        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>🔔</Text>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSub}>Daily habit reminders</Text>
            </View>
            <Switch value trackColor={{ true: colors.primaryLight, false: colors.border }} thumbColor={colors.primary} />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <InfoCircleIcon />
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>About</Text>
              <Text style={styles.settingSub}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
        <Pressable onPress={deleteAccount} style={styles.deleteAccountLink}>
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </Pressable>
      </ScrollView>

      <Modal transparent visible={editOpen} animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit profile</Text>
              <Pressable onPress={() => setEditOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <Pressable onPress={pickPhoto} style={styles.avatarEdit}>
              {photoUri || avatarUrl ? (
                <Image source={{ uri: photoUri ?? avatarUrl }} style={styles.avatarEditImage} />
              ) : (
                <Text style={styles.avatarEditText}>{getInitial(displayName)}</Text>
              )}
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraText}>⌁</Text>
              </View>
            </Pressable>

            <View style={styles.field}>
              <Text style={styles.inputLabel}>Display name</Text>
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError('');
                }}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={saveChanges}
              disabled={saving || !name.trim()}
              style={[styles.saveButton, (saving || !name.trim()) && styles.saveButtonDisabled]}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 22,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  editText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  identity: {
    alignItems: 'center',
    gap: 8,
  },
  avatarLarge: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLargeImage: {
    width: 126,
    height: 126,
    borderRadius: 63,
  },
  avatarLargeText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.muted,
  },
  statsCard: {
    height: 104,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: colors.divider,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  settingsCard: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  settingRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIcon: {
    fontSize: 28,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.muted,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  settingSub: {
    marginTop: 3,
    fontSize: 13,
    color: colors.muted,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 44,
  },
  signOutButton: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#F4B4B4',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#C92A2A',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteAccountLink: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 28,
    gap: 18,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  closeText: {
    fontSize: 26,
    color: colors.text,
  },
  avatarEdit: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEditText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: {
    color: colors.text,
    fontSize: 16,
  },
  field: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
