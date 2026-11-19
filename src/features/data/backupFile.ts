/**
 * Archivo de copia de RODEXA Carro (.rodexa). Por dentro es la misma copia (JSON),
 * pero empaquetada para que NO se vea como código: una línea de encabezado y el
 * contenido en base64. No es una contraseña ni un cifrado: solo evita que la gente vea
 * un texto raro y piense que es un virus. Funciones puras, sin archivos.
 *
 * Al final lleva un SELLO ("FIN <sello>") calculado sobre el contenido: si el archivo
 * se daña al copiarlo o alguien lo edita a mano, el sello no coincide y no se importa.
 * (No es una firma secreta: protege contra daños y cambios a mano, no contra alguien
 * que estudie la app. Por eso, además, todo lo importado se valida y se limpia.)
 */

/** Distinto al de RODEXA Moto: una copia de moto no se confunde con una de carro. */
export const BACKUP_HEADER = 'RODEXA-CARRO-COPIA-1';
export const BACKUP_EXTENSION = 'rodexa';
export const BACKUP_MIME = 'application/octet-stream';
/** Un archivo más grande no es una copia real (una copia normal pesa unos pocos KB). */
export const MAX_BACKUP_CHARS = 15_000_000;
const SEAL_PREFIX = 'FIN ';

/** Sello del contenido (FNV-1a de 32 bits, en hexadecimal). */
export function backupSeal(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** "RODEXA-Carro-copia-2026-11-05.rodexa" o, con la hora, "RODEXA-Carro-copia-2026-11-05-1430.rodexa". */
export const backupFileName = (isoDate: string, time?: string) =>
  `RODEXA-Carro-copia-${isoDate}${time ? `-${time}` : ''}.${BACKUP_EXTENSION}`;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const INDEX = new Map([...ALPHABET].map((c, i) => [c, i]));

/** Texto → bytes UTF-8 (tildes y ñ incluidas). */
function toUtf8(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

function fromUtf8(bytes: number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    let c: number;
    if (b < 0x80) c = b;
    else if (b < 0xe0) c = ((b & 31) << 6) | (bytes[i++] & 63);
    else if (b < 0xf0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    parts.push(String.fromCodePoint(c));
  }
  return parts.join('');
}

function toBase64(bytes: number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b = 0, c = 0] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    const n = (a << 16) | (b << 8) | c;
    parts.push(
      ALPHABET[(n >> 18) & 63] +
        ALPHABET[(n >> 12) & 63] +
        (i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63] : '=') +
        (i + 2 < bytes.length ? ALPHABET[n & 63] : '='),
    );
  }
  return parts.join('');
}

/** undefined si no es base64 válido. */
function fromBase64(text: string): number[] | undefined {
  const clean = text.replace(/[\s=]/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const chunk = [...clean.slice(i, i + 4)].map((c) => INDEX.get(c));
    if (chunk.some((v) => v === undefined) || chunk.length < 2) return undefined;
    const [a, b, c = 0, d = 0] = chunk as number[];
    const n = (a << 18) | (b << 12) | (c << 6) | d;
    out.push((n >> 16) & 255);
    if (chunk.length > 2) out.push((n >> 8) & 255);
    if (chunk.length > 3) out.push(n & 255);
  }
  return out;
}

/**
 * Dirección (content://) del archivo que Android creó en "Guardar en…".
 * expo-intent-launcher no la entrega limpia: entrega el Intent como texto
 * ("Intent { dat=content://…/document/msf:123 flg=0x43 }"), con la parte de la ruta
 * sin codificar. Aquí se recupera y se vuelve a codificar el id del documento
 * (puede traer "/" o ":", p. ej. "raw:/storage/…/Download/copia.rodexa").
 * `undefined` = no se encontró una dirección válida.
 */
export function documentUriFromResult(data: string | undefined): string | undefined {
  if (!data) return undefined;
  let raw = data.trim();
  const at = raw.indexOf('dat=');
  if (at >= 0) {
    raw = raw.slice(at + 4);
    // Lo que sigue a la dirección: " flg=…", " typ=…", " (has extras)", " }"…
    const end = raw.search(/ (?:[a-z]+=|\(has |\})/);
    if (end >= 0) raw = raw.slice(0, end);
    raw = raw.trim();
  }
  const m = /^content:\/\/([^/\s]+)\/document\/(.+)$/.exec(raw);
  if (!m) return undefined;
  let id = m[2];
  try {
    // Si ya venía codificado, no se codifica dos veces.
    id = decodeURIComponent(id);
  } catch {
    // Se deja como venía.
  }
  return `content://${m[1]}/document/${encodeURIComponent(id)}`;
}

/** Copia (JSON) → contenido del archivo .rodexa. */
export function packBackup(json: string): string {
  const body = toBase64(toUtf8(json));
  return `${BACKUP_HEADER}\n${body}\n${SEAL_PREFIX}${backupSeal(body)}\n`;
}

/**
 * Contenido de un archivo .rodexa → copia (JSON). Si no trae el encabezado se
 * devuelve tal cual: así siguen sirviendo las copias viejas en texto (JSON).
 * `undefined` = trae el encabezado pero está dañado, incompleto o editado (sello).
 */
export function unpackBackup(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed.startsWith(BACKUP_HEADER)) return trimmed;
  const sealAt = trimmed.lastIndexOf(SEAL_PREFIX);
  if (sealAt < 0) return undefined;
  const body = trimmed.slice(BACKUP_HEADER.length, sealAt).replace(/\s/g, '');
  if (trimmed.slice(sealAt + SEAL_PREFIX.length).trim() !== backupSeal(body)) return undefined;
  const bytes = fromBase64(body);
  if (!bytes) return undefined;
  try {
    return fromUtf8(bytes);
  } catch {
    return undefined;
  }
}
