/**
 * De dónde sale un dato técnico, legal o de precio. Todo dato que no venga del
 * usuario debe traer su fuente; sin fuente verificable, el dato no se muestra.
 */
export type InfoSource = {
  type: 'manufacturer' | 'official_manual' | 'official' | 'distributor' | 'store' | 'demo' | 'other';
  /** Nombre de la fuente ("Manual del propietario Modelo X 2024", "Ministerio de Transporte"…). */
  name: string;
  url?: string;
  /** Página, sección, número de documento… lo que permita encontrar el dato. */
  reference?: string;
  /** Fecha ISO (AAAA-MM-DD) en que se verificó. */
  verifiedAt?: string;
};

/** Una fuente sirve si dice qué es y cómo encontrarla (URL o referencia). Las demo nunca. */
export function isVerifiableSource(source: InfoSource | undefined): source is InfoSource {
  return (
    source !== undefined &&
    source.type !== 'demo' &&
    source.name.trim() !== '' &&
    Boolean(source.url?.trim() || source.reference?.trim())
  );
}
