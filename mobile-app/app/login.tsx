import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Identifiant et mot de passe requis');
      return;
    }

    try {
      setSubmitting(true);
      await login(identifier.trim(), password);
      router.replace('/reparations');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      Alert.alert('Connexion impossible', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RepairInfo Mobile</Text>
      <Text style={styles.subtitle}>Connecte-toi a ton serveur atelier</Text>

      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        placeholder="Identifiant"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        secureTextEntry
        style={styles.input}
      />

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#4b5563',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#111827',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
