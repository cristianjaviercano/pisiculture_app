import { View, Text, StyleSheet } from 'react-native';
import { C, S } from '../theme';

interface Props {
  status: 'ok' | 'warn' | 'critical';
  message: string;
  blocking?: boolean;
}

export function CTQAlert({ status, message, blocking }: Props) {
  const bg   = status === 'critical' ? C.dangerLight : status === 'warn' ? C.warnLight : C.okLight;
  const color = status === 'critical' ? C.danger : status === 'warn' ? C.warn : C.ok;
  const label = status === 'critical' ? (blocking ? '🚨 BLOQUEANTE' : '⚠️ CRÍTICO') : '⚠️ ALERTA';

  if (status === 'ok') return null;

  return (
    <View style={[styles.box, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Text style={[styles.msg, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8, borderWidth: 1,
    padding: S.sm, marginBottom: S.sm,
  },
  label: { fontWeight: '700', fontSize: 12, marginBottom: 2 },
  msg:   { fontSize: 13 },
});
