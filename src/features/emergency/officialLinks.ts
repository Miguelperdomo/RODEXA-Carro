import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import type { CarProfile, DocumentSummary } from '@/features/cars/types';
import { formatDate, parseISODate } from '@/shared/utils/date';

/**
 * Consultas oficiales (Colombia). RODEXA solo ABRE la página oficial: no consulta nada por su
 * cuenta ni guarda lo que allá aparezca. Antes de abrir se copia la placa para pegarla.
 * - SIMIT (Federación Colombiana de Municipios, fcm.org.co): multas y fotomultas.
 * - RUNT (runt.gov.co): la consulta ciudadana del vehículo, con el SOAT y la tecnomecánica.
 */
export const OFFICIAL_SITES = {
  simit: { name: 'SIMIT', url: 'https://fcm.org.co/simit/#/home-public', what: 'multas y fotomultas' },
  runt: {
    name: 'RUNT',
    url: 'https://portalpublico.runt.gov.co/#/consulta-vehiculo/consulta/consulta-ciudadana',
    what: 'el SOAT y la tecnomecánica',
  },
} as const;

export type OfficialSite = keyof typeof OFFICIAL_SITES;

/** Número único de emergencias de Colombia (policía, ambulancia, bomberos). */
export const EMERGENCY_NUMBER = '123';

/** Placa lista para pegar en un formulario: "abc-123" → "ABC123". */
export const cleanPlate = (plate: string) => plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Abre la página oficial. Devuelve el texto del aviso ("Tu placa quedó copiada…") o
 * `undefined` si no se pudo abrir.
 */
export async function openOfficialSite(site: OfficialSite, plate?: string): Promise<string | undefined> {
  const { name, url } = OFFICIAL_SITES[site];
  let copied = false;
  if (plate) {
    try {
      await Clipboard.setStringAsync(cleanPlate(plate));
      copied = true;
    } catch {
      // Sin portapapeles: se abre igual.
    }
  }
  try {
    await Linking.openURL(url);
    return copied ? `Abrimos el ${name}. Tu placa quedó copiada: pégala en la consulta.` : `Abrimos el ${name}.`;
  } catch {
    return undefined;
  }
}

/** Abre el marcador con el 123 (RODEXA no llama sola). */
export async function callEmergency(): Promise<boolean> {
  try {
    await Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
    return true;
  } catch {
    return false;
  }
}

/** Pasos generales en un accidente (no reemplazan a las autoridades ni a los servicios de emergencia). */
export const ACCIDENT_STEPS = [
  'Ponte a salvo y, si puedes, señaliza el lugar.',
  `Si hay heridos, llama al ${EMERGENCY_NUMBER} y no los muevas.`,
  'Toma fotos del lugar, de los vehículos y de las placas.',
  'Ten a mano tu SOAT, tu licencia de conducción y la licencia de tránsito.',
];

/** Los datos que se piden en un accidente (al otro conductor o a las autoridades), solo lo registrado. */
export function accidentDataText(
  userName: string | undefined,
  profile: Pick<CarProfile, 'brandName' | 'model' | 'plate'>,
  soat: Pick<DocumentSummary, 'issuer' | 'number' | 'expiresAt'> | undefined,
): string {
  return [
    userName?.trim() ? `Conductor: ${userName.trim()}` : undefined,
    `Carro: ${`${profile.brandName ?? ''} ${profile.model ?? ''}`.trim()}`,
    profile.plate ? `Placa: ${profile.plate.toUpperCase()}` : undefined,
    soat?.issuer ? `SOAT: ${soat.issuer}` : undefined,
    soat?.number ? `Póliza SOAT: ${soat.number}` : undefined,
    soat?.expiresAt ? `SOAT vigente hasta: ${formatDate(parseISODate(soat.expiresAt))}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}
