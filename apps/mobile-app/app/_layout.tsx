import { Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { initDB } from '../src/db/schema';
import { seedIfEmpty } from '../src/db/seed';
import { C } from '../src/theme';

async function setupDB(db: Parameters<typeof initDB>[0]) {
  await initDB(db);
  await seedIfEmpty(db);
}

function Loader() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<Loader />}>
      <SQLiteProvider databaseName="aquashell.db" onInit={setupDB} useSuspense>
        <Slot />
      </SQLiteProvider>
    </Suspense>
  );
}
