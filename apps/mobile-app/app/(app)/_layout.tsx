import { Stack } from 'expo-router';
import { C } from '../../src/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.primary },
        headerTintColor: C.white,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mis Lotes' }} />
      <Stack.Screen name="lote/nuevo" options={{ title: 'Nuevo Ciclo de Producción' }} />
      <Stack.Screen name="lote/[id]/index" options={{ title: 'Detalle del Lote' }} />
      <Stack.Screen name="lote/[id]/agua" options={{ title: 'Calidad del Agua' }} />
      <Stack.Screen name="lote/[id]/alimento" options={{ title: 'Suministro de Alimento' }} />
      <Stack.Screen name="lote/[id]/mortalidad" options={{ title: 'Registro de Mortalidad' }} />
      <Stack.Screen name="lote/[id]/biometria" options={{ title: 'Muestreo Biométrico' }} />
      <Stack.Screen name="lote/[id]/insumo"    options={{ title: 'Insumo Aplicado' }} />
      <Stack.Screen name="lote/[id]/historial" options={{ title: 'Historial de Eventos' }} />
      <Stack.Screen name="lote/[id]/cosecha"   options={{ title: 'Registrar Cosecha' }} />
    </Stack>
  );
}
