import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import colors from '../../constants/colors';
import { getInitial } from '../../utils/user';

// Supabase Storage setup note:
// create bucket if not exists avatars public;
// add policies on storage.objects for bucket_id = 'avatars' so authenticated users can insert/update/select files where name starts with auth.uid() || '/'.
export default function SetupPhotoScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const name = (user?.user_metadata?.name as string) ?? '';
  const initial = getInitial(name);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadError('');
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadAndContinue = async () => {
    setUploadError('');
    setUploading(true);
    try {
      if (photoUri && user) {
        const ext = photoUri.split('.').pop() ?? 'jpg';
        const fileName = `${user.id}/avatar.${ext}`;

        const response = await fetch(photoUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        await updateProfile(name, data.publicUrl);
      }
      router.replace('/setup/done');
    } catch (error: any) {
      setUploadError(error?.message ?? 'Could not upload your photo. Try again or skip it for now.');
    } finally {
      setUploading(false);
    }
  };

  const skipPhoto = () => {
    router.replace('/setup/done');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.inner}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/setup/name')}>
          <Text style={styles.backIcon}>{'<'}</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Animated.Text entering={FadeInDown.duration(400).delay(0)} style={styles.wordmark}>
          atomy
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(440).delay(80)} style={styles.headingBlock}>
          <Text style={styles.heading}>Add a photo</Text>
          <Text style={styles.sub}>Help us put a face to your habits.</Text>
        </Animated.View>

        {/* Avatar */}
        <Animated.View entering={FadeInDown.duration(440).delay(160)} style={styles.avatarSection}>
          <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraTag}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </Pressable>
          <Text style={styles.tapHint}>Tap to choose a photo</Text>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.duration(440).delay(240)} style={styles.footer}>
          {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}

          <Pressable
            style={[styles.button, uploading && styles.buttonDisabled]}
            onPress={photoUri ? uploadAndContinue : pickPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {uploadError && photoUri ? 'Retry upload' : photoUri ? 'Continue →' : 'Choose Photo'}
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.skipButton} onPress={skipPhoto}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>

        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
    minHeight: 32,
  },
  backIcon: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.text,
  },
  backText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  wordmark: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 5,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 48,
  },
  headingBlock: {
    marginBottom: 40,
    gap: 10,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  sub: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 20,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitial: {
    fontSize: 46,
    fontWeight: '700',
    color: colors.primary,
  },
  cameraTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cameraIcon: {
    fontSize: 16,
  },
  tapHint: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '400',
  },
  footer: {
    marginTop: 'auto',
    gap: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
