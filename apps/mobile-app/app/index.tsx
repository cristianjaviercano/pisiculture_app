import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { pullMasterData } from '../src/sync/syncEngine';
import { isSupabaseConfigured } from '../src/sync/supabaseClient';
import { C } from '../src/theme';

export default function Index() {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    db.getFirstAsync<{ value: string }>(
      "SELECT value FROM session_local WHERE key='current_user'"
    )
      .then(row => {
        const logged = !!row;
        setHasSession(logged);
        setReady(true);
        // Background pull: fetch fresh lotes + estanques + events from Supabase
        // without blocking navigation. Errors are silently ignored on startup.
        if (logged && isSupabaseConfigured()) {
          void pullMasterData(db).catch(() => undefined);
        }
      })
      .catch(() => setReady(true));
  }, [db]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return hasSession ? <Redirect href="/(app)" /> : <Redirect href="/login" />;
}
