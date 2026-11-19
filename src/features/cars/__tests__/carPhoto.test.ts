/** Foto del carro y del parqueadero: opcional, solo en el celular, sin pedir de más. */
import { hasPlace, sanitizeParking } from '@/features/parking/parking';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

import { deleteCarPhotos, keepCarPhoto, validCarPhoto } from '../carPhoto';

// Sistema de archivos de mentira: un conjunto de rutas que "existen".
const mockFiles = new Set<string>();
jest.mock('expo-file-system', () => {
  const join = (parts: unknown[]) =>
    parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/').replace(/\/+/g, '/').replace('file:/', 'file:///');
  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return [...mockFiles].some((f) => f.startsWith(`${this.uri}/`));
    }
    create() {}
    list() {
      return [...mockFiles].filter((f) => f.startsWith(`${this.uri}/`)).map((f) => new File(f));
    }
    delete() {
      [...mockFiles].filter((f) => f.startsWith(`${this.uri}/`)).forEach((f) => mockFiles.delete(f));
    }
  }
  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    async copy(dest: File) {
      mockFiles.add(dest.uri);
    }
    delete() {
      mockFiles.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { document: { uri: 'file:///docs' } } };
});

beforeEach(() => mockFiles.clear());

describe('foto del carro', () => {
  it('es opcional: sin foto no hay nada', () => {
    expect(DEFAULT_SETTINGS.carPhotoUri).toBe('');
    expect(validCarPhoto('')).toBeUndefined();
  });

  it('se copia a la carpeta de RODEXA y solo queda una', async () => {
    const first = await keepCarPhoto('file:///cache/a.jpg');
    expect(first.startsWith('file:///docs/carro/')).toBe(true);
    expect(validCarPhoto(first)).toBe(first);
    const second = await keepCarPhoto('file:///cache/b.jpg');
    expect(validCarPhoto(second)).toBe(second);
    expect(validCarPhoto(first)).toBeUndefined();
  });

  it('una ruta de otro lado o borrada no vale; "Quitar" borra la carpeta', async () => {
    expect(validCarPhoto('file:///otra/carro.jpg')).toBeUndefined();
    const uri = await keepCarPhoto('file:///cache/a.jpg');
    deleteCarPhotos();
    expect(validCarPhoto(uri)).toBeUndefined();
  });
});

describe('foto del parqueadero', () => {
  it('una foto sola también sirve para guardar el lugar', () => {
    expect(hasPlace({ photoUri: 'file:///docs/parqueadero/p.jpg' })).toBe(true);
    expect(hasPlace({})).toBe(false);
  });

  it('se lee del celular sin migraciones; una ruta rara se descarta', () => {
    const at = '2026-11-06T10:00:00Z';
    expect(sanitizeParking({ at, photoUri: 'file:///docs/parqueadero/p.jpg' })).toMatchObject({ photoUri: 'file:///docs/parqueadero/p.jpg' });
    expect(sanitizeParking({ at, level: '3', photoUri: 'https://x.com/p.jpg' })?.photoUri).toBeUndefined();
    expect(sanitizeParking({ at, level: '3' })?.photoUri).toBeUndefined();
  });
});

describe('dónde se ve la foto', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };

  it('Configuración (cabecera y fila), Inicio y Mi carro', () => {
    const settings = readFileSync('src/app/configuracion.tsx', 'utf8');
    expect(settings).toMatch(/<CarAvatar\s+photo=\{carPhoto\.photo\}/);
    expect(settings).toContain('label="Foto de mi carro"');
    expect(readFileSync('src/features/dashboard/components/CarCard.tsx', 'utf8')).toContain('<CarAvatar');
    expect(readFileSync('src/features/cars/components/CarHeader.tsx', 'utf8')).toContain('<CarAvatar');
  });
});

describe('permisos', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
  const app = JSON.parse(readFileSync('app.json', 'utf8')) as { expo: { plugins: unknown[] } };

  it('la política de privacidad dice para qué se usa la cámara (texto aprobado)', () => {
    const legal = readFileSync('src/features/legal/documents.ts', 'utf8');
    expect(legal).toContain(
      'La cámara se solicita únicamente si el usuario decide tomar una foto opcional de su vehículo o del lugar donde lo parqueó; las fotos se guardan solo en el dispositivo, no se envían a ningún servidor y se pueden eliminar en cualquier momento.',
    );
    expect(legal).not.toContain('llamadas, cámara o micrófono');
  });

  it('cámara con explicación y sin micrófono', () => {
    const picker = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-image-picker') as [string, Record<string, unknown>];
    expect(picker[1].microphonePermission).toBe(false);
    expect(String(picker[1].cameraPermission)).toMatch(/solo si decides/);
  });
});
