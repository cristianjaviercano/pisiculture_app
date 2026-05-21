import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { syncPendingEvents, type SyncStatus } from '../sync/syncEngine';
import { isSupabaseConfigured } from '../sync/supabaseClient';
import { C, S } from '../theme';

interface Props {
  pendingTotal: number;
  onSynced: () => void;
}

export function SyncBanner({ pendingTotal, onSynced }: Props) {
  const db = useSQLiteContext();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastMsg, setLastMsg] = useState('');

  if (!isSupabaseConfigured()) {
    if (pendingTotal === 0) return null;
    return (
      <View style={[styles.banner, styles.warnBg]}>
        <Text style={styles.warnText}>
          📡 {pendingTotal} evento{pendingTotal > 1 ? 's' : ''} pendiente{pendingTotal > 1 ? 's' : ''} de sync
          · Supabase no configurado
        </Text>
      </View>
    );
  }

  async function handleSync() {
    setStatus('syncing');
    const result = await syncPendingEvents(db);
    if (result.error) {
      setStatus('error');
      setLastMsg(result.error);
    } else {
      setStatus('success');
      setLastMsg(`↑ ${result.pushed} enviado${result.pushed !== 1 ? 's' : ''}${result.failed > 0 ? ` · ${result.failed} fallido(s)` : ''}`);
      onSynced();
    }
    setTimeout(() => setStatus('idle'), 4000);
  }

  if (pendingTotal === 0 && status === 'idle') return null;

  const bg   = status === 'error' ? C.dangerLight : status === 'success' ? C.okLight : C.warnLight;
  const text = status === 'error' ? C.danger : status === 'success' ? C.ok : C.warn;

  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      {status === 'syncing' ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={[styles.msg, { color: C.primary, marginLeft: S.xs }]}>Sincronizando…</Text>
        </View>
      ) : status === 'success' || status === 'error' ? (
        <Text style={[styles.msg, { color: text }]}>{lastMsg}</Text>
      ) : (
        <View style={styles.row}>
          <Text style={[styles.msg, { color: text, flex: 1 }]}>
            📡 {pendingTotal} evento{pendingTotal > 1 ? 's' : ''} pendiente{pendingTotal > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.syncBtn} onPress={() => void handleSync()}>
            <Text style={styles.syncBtnText}>Sincronizar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner:      { paddingHorizontal: S.md, paddingVertical: S.sm },
  row:         { flexDirection: 'row', alignItems: 'center' },
  msg:         { fontSize: 13, fontWeight: '600' },
  warnBg:      { backgroundColor: C.warnLight },
  warnText:    { color: C.warn, fontSize: 13 },
  syncBtn:     { backgroundColor: C.primary, borderRadius: 6, paddingHorizontal: S.sm, paddingVertical: 4 },
  syncBtnText: { color: C.white, fontSize: 12, fontWeight: '700' },
});
