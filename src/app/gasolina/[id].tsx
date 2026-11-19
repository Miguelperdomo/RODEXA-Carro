import { Redirect, useLocalSearchParams } from 'expo-router';

/** Ruta antigua del detalle de un tanqueo: redirige al detalle de energía. */
export default function LegacyFuelDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/energia/[id]', params: { id } }} />;
}
