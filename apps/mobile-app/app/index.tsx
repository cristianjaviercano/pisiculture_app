import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { C } from '../src/theme';

export default function Index() {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    db.getFirstAsync<{ value: string }>(
      "SELECT value FROM session_local WHERE key='current_user'"
    )
      .then(row => { setHasSession(!!row); setReady(true); })
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
