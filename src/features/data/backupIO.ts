import { getDocumentAsync } from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';
import { readAsStringAsync, StorageAccessFramework, writeAsStringAsync } from 'expo-file-system/legacy';
import { ResultCode, startActivityAsync } from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { BACKUP_MIME, documentUriFromResult, MAX_BACKUP_CHARS } from './backupFile';

/**
 * Guardar y abrir el archivo de copia (.rodexa) en el celular. Nada sale del celular por
 * RODEXA: la persona elige dónde guardarlo (Descargas, Drive…) y de dónde abrirlo.
 *
 * Regla: NUNCA se dice "guardada" sin leer el archivo y comprobar que quedó completo. Un
 * archivo vacío o incompleto se borra y se ofrece elegir una carpeta.
 */

/** `pickFolder`: no se pudo con "Guardar en…"; hay que elegir una carpeta. */
export type SaveResult = 'saved' | 'canceled' | 'pickFolder' | 'error';

/**
 * Lo que falló en el último intento de guardar (texto técnico corto). Si al final no se pudo
 * guardar, la pantalla lo muestra para que la persona lo envíe a soporte.
 */
let problems: string[] = [];
const note = (step: string, e: unknown) => {
  const msg = e instanceof Error ? e.message.split('\n')[0] : String(e);
  problems.push(`${step}: ${msg.slice(0, 90)}`);
};
export function lastSaveProblem(): string {
  return problems.join(' | ');
}

/**
 * Escribe y LEE de vuelta: solo es true si el archivo quedó exactamente igual. Dos formas de
 * escribir: si la primera falla en ese celular o en esa carpeta, se intenta con el escritor
 * clásico (que también sirve con carpetas de Android).
 */
async function writeAndVerify(uri: string, content: string): Promise<boolean> {
  try {
    new File(uri).write(content);
    if ((await new File(uri).text()) === content) return true;
    problems.push('escribir(1): el archivo no quedó completo');
  } catch (e) {
    note('escribir(1)', e);
  }
  try {
    await writeAsStringAsync(uri, content);
    if ((await readAsStringAsync(uri)) === content) return true;
    problems.push('escribir(2): el archivo no quedó completo');
    return false;
  } catch (e) {
    note('escribir(2)', e);
    return false;
  }
}

function tryDelete(uri: string) {
  try {
    new File(uri).delete();
  } catch {
    // Si no se pudo, queda un archivo vacío que la persona puede borrar.
  }
}

/** 1) Abre el "Guardar en…" de Android (Descargas, Drive…) y guarda la copia comprobada. */
export async function saveBackupFile(name: string, content: string): Promise<SaveResult> {
  problems = [];
  // Sin el "Guardar en…" de Android: se elige carpeta (y se recuerda).
  if (Platform.OS !== 'android') return 'pickFolder';
  let result: { resultCode: ResultCode; data?: string };
  try {
    result = await startActivityAsync('android.intent.action.CREATE_DOCUMENT', {
      type: BACKUP_MIME,
      category: 'android.intent.category.OPENABLE',
      extra: { 'android.intent.extra.TITLE': name },
    });
  } catch (e) {
    note('guardar en', e);
    return 'pickFolder';
  }
  if (result.resultCode !== ResultCode.Success) return 'canceled';
  const uri = documentUriFromResult(result.data);
  if (!uri) problems.push(`guardar en: dirección no reconocida (${String(result.data).slice(0, 60)})`);
  if (uri && (await writeAndVerify(uri, content))) return 'saved';
  // Android ya creó el archivo: si quedó vacío o incompleto, se borra para no confundir.
  if (uri) tryDelete(uri);
  return 'pickFolder';
}

/** La carpeta elegida, para guardar ahí las próximas copias sin preguntar. */
export type BackupFolder = { uri: string; name: string };

/**
 * Crea el archivo en la carpeta y lo escribe comprobado. Si la forma nueva no puede crear el
 * archivo en esa carpeta, se usa el sistema de carpetas clásico de Android (Storage Access
 * Framework), que es otra implementación independiente.
 */
async function writeInto(folder: Directory, name: string, content: string): Promise<SaveResult> {
  try {
    const file = folder.createFile(name, BACKUP_MIME);
    if (await writeAndVerify(file.uri, content)) return 'saved';
    tryDelete(file.uri);
  } catch (e) {
    note('crear(1)', e);
  }
  try {
    const uri = await StorageAccessFramework.createFileAsync(folder.uri, name, BACKUP_MIME);
    if (await writeAndVerify(uri, content)) return 'saved';
    tryDelete(uri);
  } catch (e) {
    note('crear(2)', e);
  }
  return 'error';
}

/**
 * 2) La persona elige (o crea) una carpeta y ahí se guarda la copia comprobada. Android le da a
 * RODEXA permiso permanente sobre ESA carpeta: se devuelve para recordarla.
 */
export async function saveInFolder(name: string, content: string): Promise<{ result: SaveResult; folder?: BackupFolder }> {
  problems = [];
  let folder: Directory;
  try {
    folder = await Directory.pickDirectoryAsync();
  } catch {
    // Cerrar el selector llega como error.
    return { result: 'canceled' };
  }
  const result = await writeInto(folder, name, content);
  return result === 'saved' ? { result, folder: { uri: folder.uri, name: folderName(folder) } } : { result };
}

/** 3) Guarda en la carpeta que se eligió antes (sin preguntar). 'error' = ya no se puede usar. */
export async function saveInSavedFolder(folderUri: string, name: string, content: string): Promise<SaveResult> {
  problems = [];
  try {
    // Sin revisar "exists" antes: en carpetas de Android a veces responde mal. Se intenta guardar.
    return await writeInto(new Directory(folderUri), name, content);
  } catch (e) {
    note('carpeta guardada', e);
    return 'error';
  }
}

/** El nombre que ve la persona ("RODEXA"); si no se puede leer, el final de la ruta. */
export function folderName(folder: { name?: string; uri: string }): string {
  try {
    if (folder.name) return decodeURIComponent(folder.name).split(/[/:]/).pop() || 'tu carpeta';
  } catch {
    // Se usa la ruta.
  }
  try {
    return decodeURIComponent(folder.uri).split(/[/:]/).filter(Boolean).pop() || 'tu carpeta';
  } catch {
    return 'tu carpeta';
  }
}

export type PickResult =
  | { kind: 'text'; text: string }
  | { kind: 'canceled' }
  /** No se lee: un archivo enorme no es una copia y podría trabar la app. */
  | { kind: 'too-big' }
  | { kind: 'unreadable'; detail: string };

/**
 * La persona elige el archivo de copia y se lee su contenido, directo del archivo elegido
 * (con el permiso que da el selector del sistema; no se pide ningún permiso a la app).
 */
export async function pickBackupFile(): Promise<PickResult> {
  // "*/*": la extensión .rodexa no tiene un tipo conocido en Android.
  const result = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { kind: 'canceled' };
  if ((asset.size ?? 0) > MAX_BACKUP_CHARS) return { kind: 'too-big' };
  const errors: string[] = [];
  const attempts: (() => Promise<string>)[] = [
    () => new File(asset.uri).text(),
    // Lector clásico: sirve con algunas carpetas del almacenamiento interno.
    () => readAsStringAsync(asset.uri),
  ];
  for (const attempt of attempts) {
    try {
      return { kind: 'text', text: await attempt() };
    } catch (e) {
      errors.push(e instanceof Error ? e.message.split('\n')[0].slice(0, 90) : String(e));
    }
  }
  return { kind: 'unreadable', detail: errors.join(' | ') };
}
