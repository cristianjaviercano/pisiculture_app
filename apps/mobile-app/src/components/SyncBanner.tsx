import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { syncPendingEvents, pullMasterData, type SyncStatus } from '../sync/syncEngine';
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
          📡 {pendingTotal} evento{pendingTotal > 1 ? 's' : ''} pendiente{pendingTotal > 1 ? 's' : ''}
          {' '}· Supabase no configurado
        </Text>
      </View>
    );
  }

  async function handleSync() {
    setStatus('syncing');

    // Push pending events + pull remote events in parallel
    const [pushResult, pullResult] = await Promise.all([
      syncPendingEvents(db),
      pullMasterData(db),
    ]);

    if (pushResult.error) {
      setStatus('error');
      setLastMsg(pushResult.error);
    } else {
      setStatus('success');
      const parts: string[] = [];
      if (pushResult.pushed > 0) {
        parts.push(`↑ ${pushResult.pushed} enviado${pushResult.pushed !== 1 ? 's' : ''}`);
      }
      if (pushResult.pulled > 0) {
        parts.push(`↓ ${pushResult.pulled} descargado${pushResult.pulled !== 1 ? 's' : ''}`);
      }
      if (pullResult.lotes > 0 || pullResult.estanques > 0) {
        parts.push(`+${pullResult.lotes} lote${pullResult.lotes !== 1 ? 's' : ''}`);
      }
      if (pushResult.failed > 0) {
        parts.push(`${pushResult.failed} error${pushResult.failed !== 1 ? 'es' : ''}`);
      }
      setLastMsg(parts.length ? parts.join(' · ') : 'Sincronizado');
      onSynced();
    }
    setTimeout(() => setStatus('idle'), 5000);
  }

  if (pendingTotal === 0 && status === 'idle') return null;

  const bg    = status === 'error' ? C.dangerLight : status === 'success' ? C.okLight : C.warnLight;
  const color = status === 'error' ? C.danger      : status === 'success' ? C.ok      : C.warn;

  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      {status === 'syncing' ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={[styles.msg, { color: C.primary, marginLeft: S.xs }]}>Sincronizando…</Text>
        </View>
      ) : status === 'success' || status === 'error' ? (
        <Text style={[styles.msg, { color }]}>{lastMsg}</Text>
      ) : (
        <View style={styles.row}>
          <Text style={[styles.msg, { color, flex: 1 }]}>
            📡 {pendingTotal} evento{pendingTotal > 1 ? 's' : ''} pendiente{pendingTotal > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.syncBtn} onPress={() => void handleSync()}>
            <Text style={styles.syncBtnText}>↑↓ Sync</Text>
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
