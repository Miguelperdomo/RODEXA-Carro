/** Copia de seguridad en archivo .rodexa y "Ya tenía RODEXA". */
import { backupFileContent, createBackup, parseBackup } from '@/features/pro/backup';
import { EMPTY_STORED_USER_DATA, type StoredUserData } from '@/storage/userDataStore';

import { BACKUP_HEADER, backupFileName, documentUriFromResult, packBackup, unpackBackup } from '../backupFile';

const NOW = new Date(2026, 10, 6);
const user: StoredUserData = {
  ...EMPTY_STORED_USER_DATA,
  onboarding: {
    user: { name: 'Begoña Muñoz', city: 'Ibagué' },
    profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', year: 2022, energySource: 'gasoline' },
    km: 20000,
    maintenance: [],
    documents: {},
    completedAt: '2026-09-01',
  },
  records: [{ id: 'r1', kind: 'odometer', date: '2026-09-10', km: 20500 }],
};

describe('archivo de copia (.rodexa)', () => {
  it('no se ve como código: encabezado y contenido empaquetado', () => {
    const content = backupFileContent(user, NOW);
    expect(content.startsWith(`${BACKUP_HEADER}\n`)).toBe(true);
    expect(BACKUP_HEADER).toBe('RODEXA-CARRO-COPIA-1');
    expect(content).not.toMatch(/[{}"]/);
    expect(content).not.toMatch(/Begoña|rodexa-carro-backup/);
  });

  it('ida y vuelta exacta, con tildes y ñ', () => {
    const parsed = parseBackup(backupFileContent(user, NOW));
    expect(parsed.ok && parsed.data).toEqual(user);
    expect(parsed.ok && parsed.summary).toMatchObject({ carName: 'Kia Picanto 2022', records: 1 });
    const text = 'áéíóú ñÑ ü ¿¡ 漢字';
    expect(unpackBackup(packBackup(text))).toBe(text);
  });

  it('aunque un chat o un editor le metan saltos de línea, se lee igual', () => {
    const [head, body, seal] = backupFileContent(user, NOW).split('\n');
    const wrapped = `${head}\r\n${body.replace(/(.{76})/g, '$1\r\n')}\r\n${seal}`;
    expect(parseBackup(wrapped).ok).toBe(true);
  });

  it('las copias viejas en texto (JSON, "Copiar al portapapeles") se siguen pudiendo recuperar', () => {
    expect(parseBackup(createBackup(user, NOW)).ok).toBe(true);
  });

  it('nombre del archivo con la fecha', () => {
    expect(backupFileName('2026-11-06')).toBe('RODEXA-Carro-copia-2026-11-06.rodexa');
  });
});

describe('seguridad al recuperar', () => {
  it('archivo editado a mano o cortado: el sello no coincide y no se importa', () => {
    const lines = backupFileContent(user, NOW).split('\n');
    lines[1] = (lines[1][0] === 'A' ? 'B' : 'A') + lines[1].slice(1);
    expect(parseBackup(lines.join('\n'))).toMatchObject({ ok: false, error: 'damaged' });
    expect(parseBackup(lines.slice(0, 2).join('\n'))).toMatchObject({ ok: false, error: 'damaged' });
  });

  it('una copia de RODEXA Moto no se confunde con una de carro', () => {
    expect(parseBackup('RODEXA-MOTO-COPIA-1\nABCD\nFIN 1234')).toMatchObject({ ok: false, error: 'moto-copy' });
  });

  it('archivo gigante u otro archivo cualquiera: no se importa', () => {
    expect(parseBackup('x'.repeat(15_000_001))).toMatchObject({ ok: false, error: 'too-big' });
    expect(parseBackup('%PDF-1.7 ...').ok).toBe(false);
    expect(parseBackup('')).toMatchObject({ ok: false, error: 'empty' });
  });

  it('cada error tiene un mensaje amable', () => {
    const result = parseBackup('RODEXA-CARRO-COPIA-1\n%%%\nFIN 0');
    expect(!result.ok && result.message).toMatch(/dañado/);
  });
});

describe('dirección del archivo que crea "Guardar en…"', () => {
  it('saca la dirección real del texto del Intent', () => {
    expect(
      documentUriFromResult('Intent { dat=content://com.android.providers.downloads.documents/document/msf:1000000123 flg=0x43 }'),
    ).toBe('content://com.android.providers.downloads.documents/document/msf%3A1000000123');
    expect(
      documentUriFromResult(
        'Intent { dat=content://com.android.externalstorage.documents/document/primary:Download/RODEXA-Carro-copia-2026-11-06.rodexa flg=0x43 (has extras) }',
      ),
    ).toBe('content://com.android.externalstorage.documents/document/primary%3ADownload%2FRODEXA-Carro-copia-2026-11-06.rodexa');
  });

  it('sin dirección válida: undefined (se usa el plan B, nunca se dice "guardada")', () => {
    expect(documentUriFromResult(undefined)).toBeUndefined();
    expect(documentUriFromResult('Intent { flg=0x43 }')).toBeUndefined();
    expect(documentUriFromResult('file:///data/user/0/copia.rodexa')).toBeUndefined();
  });
});

describe('pantallas', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
  const read = (p: string) => readFileSync(`src/app/${p}`, 'utf8');

  it('la política de privacidad explica la copia .rodexa (texto aprobado)', () => {
    const legal = readFileSync('src/features/legal/documents.ts', 'utf8');
    expect(legal).toContain('RODEXA Carro no lo recibe ni lo envía a ningún servidor. La copia no incluye las fotos ni las preferencias de la aplicación.');
    expect(legal.indexOf('archivo (.rodexa)')).toBeLessThan(legal.indexOf("heading: '3. Notificaciones'"));
  });

  it('bienvenida: "Ya tenía RODEXA" abre la recuperación', () => {
    const welcome = read('(onboarding)/bienvenida.tsx');
    expect(welcome).toContain('Ya tenía RODEXA: recuperar mi copia');
    expect(welcome).toContain("router.push('/recuperar')");
    expect(read('(onboarding)/recuperar.tsx')).toContain('<RestoreBackup');
  });

  it('Copia de seguridad: guarda el archivo y solo dice "guardada" después de comprobarlo', () => {
    const data = read('configuracion/datos.tsx');
    expect(data).toContain('Guardar copia en el celular');
    expect(data).toMatch(/if \(result === 'saved'\) \{\s*\/\/ Solo después de COMPROBAR el archivo\.\s*update\(\{ lastBackupAt: iso \}\)/);
    expect(data).toContain('<RestoreBackup');
  });
});
