import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../config/supabase';
import colors from '../../constants/colors';

export default function SetupNameScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const allowNextRoute = useRef(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && !loading;

  const signOutToLogin = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      allowNextRoute.current = true;
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      signOutToLogin();
      return true;
    });

    return () => backSubscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowNextRoute.current) return;
      event.preventDefault();
      signOutToLogin();
    });

    return unsubscribe;
  }, [navigation]);

  const saveName = async () => {
    if (!canSave) return;
    setError('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name: trimmed },
      });
      if (updateError) throw updateError;
      allowNextRoute.current = true;
      router.push('/setup/photo');
    } catch (err: any) {
      setError(err?.message ?? 'Could not save your name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <Pressable style={styles.backButton} onPress={signOutToLogin}>
          <Text style={styles.backIcon}>{'<'}</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.wordmark}>atomy</Text>

        <View style={styles.headingBlock}>
          <Text style={styles.heading}>What should{'\n'}we call you?</Text>
          <Text style={styles.sub}>You can always change this later.</Text>
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError('');
            }}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveName}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, !canSave && styles.buttonDisabled]}
            onPress={saveName}
            disabled={!canSave}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  inputBlock: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    paddingHorizontal: 4,
  },
  footer: {
    marginTop: 'auto',
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
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
