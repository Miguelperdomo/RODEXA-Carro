import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Ruta antigua de "Registrar tanqueo". Se conserva porque puede haber recordatorios
 * ya programados en el teléfono que la abren; ahora redirige al registro de energía.
 */
export default function LegacyFuelRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={{ pathname: '/registrar/energia', params: id ? { tipo: 'fuel', id } : { tipo: 'fuel' } }} />;
}
