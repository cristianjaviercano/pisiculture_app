import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../src/hooks/useSession';
import { C, S } from '../src/theme';

const DEMO_USERS = [
  { email: 'operario@aquashell.co',    label: 'Carlos Medina',   rol: 'Operario',     icon: '👷' },
  { email: 'coordinador@aquashell.co', label: 'Laura Ospina',    rol: 'Coordinadora', icon: '📋' },
];

export default function LoginScreen() {
  const { login } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleLogin(email: string) {
    setLoading(true);
    const ok = await login(email);
    setLoading(false);
    if (ok) {
      router.replace('/(app)');
    } else {
      Alert.alert('Error', 'Usuario no encontrado en la base local.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🐟</Text>
          <Text style={styles.title}>Aquashell</Text>
          <Text style={styles.subtitle}>Control piscícola offline-first</Text>
        </View>

        <Text style={styles.sectionLabel}>Selecciona tu usuario (demo)</Text>

        {DEMO_USERS.map(u => (
          <TouchableOpacity
            key={u.email}
            style={[styles.userCard, loading && styles.disabled]}
            onPress={() => void handleLogin(u.email)}
            disabled={loading}
            activeOpacity={0.75}
          >
            <Text style={styles.userIcon}>{u.icon}</Text>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.label}</Text>
              <Text style={styles.userRol}>{u.rol}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.footer}>Modo demo — sin conexión requerida</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.primary },
  container:    { flex: 1, backgroundColor: C.bg, padding: S.lg },
  header:       { alignItems: 'center', paddingVertical: S.xl, marginBottom: S.lg },
  logo:         { fontSize: 56 },
  title:        { fontSize: 28, fontWeight: '700', color: C.primary, marginTop: S.sm },
  subtitle:     { fontSize: 14, color: C.muted, marginTop: 4 },
  sectionLabel: { fontSize: 13, color: C.muted, marginBottom: S.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  userCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                  borderRadius: 12, padding: S.md, marginBottom: S.sm,
                  borderWidth: 1, borderColor: C.border,
                  shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  userIcon:     { fontSize: 32, marginRight: S.md },
  userInfo:     { flex: 1 },
  userName:     { fontSize: 16, fontWeight: '600', color: C.text },
  userRol:      { fontSize: 13, color: C.muted, marginTop: 2 },
  arrow:        { fontSize: 22, color: C.muted },
  disabled:     { opacity: 0.5 },
  footer:       { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: S.xl },
});
