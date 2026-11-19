/** "Lo que usa mi carro" en Repuestos: se anota, se guarda en la ficha y se lee igual. */
import { userDataActions } from '@/features/session/userDataActions';
import { EMPTY_STORED_USER_DATA, sanitizeUserData } from '@/storage/userDataStore';

import { PARTS } from '../catalog';
import { partSpecKey, partSpecs, partSpecSummary, sheetFieldCount, specExample } from '../userSpecs';

describe('lo que usa mi carro', () => {
  it('claves estables y sin tildes', () => {
    expect(partSpecKey('oil', 'Tipo de aceite')).toBe('part:oil:tipo_de_aceite');
    expect(partSpecKey('spark_plug', 'Calibración')).toBe('part:spark_plug:calibracion');
    expect(partSpecKey('tire_front', 'Índice de carga')).toBe('part:tire_front:indice_de_carga');
  });

  it('todos los campos de todos los repuestos tienen ejemplo y claves únicas', () => {
    for (const part of PARTS) {
      const keys = part.specFields.map((f) => partSpecKey(part.code, f));
      expect(new Set(keys).size).toBe(keys.length);
      for (const field of part.specFields) expect(specExample(part.code, field).length).toBeGreaterThan(3);
    }
    expect(specExample('oil', 'Viscosidad')).toBe('Ej.: 5W-30');
    expect(specExample('tire_front', 'Medida')).toBe('Ej.: 185/65 R15');
    expect(specExample('brake_fluid', 'Tipo')).toBe('Ej.: DOT 4');
  });

  it('el aceite: campos con lo anotado y resumen para la lista', () => {
    const sheet = { [partSpecKey('oil', 'Viscosidad')]: '5W-30', [partSpecKey('oil', 'Tipo de aceite')]: 'Sintético' };
    expect(partSpecs('oil', sheet).map((s) => [s.field, s.value])).toEqual([
      ['Tipo de aceite', 'Sintético'],
      ['Viscosidad', '5W-30'],
      ['Norma', undefined],
      ['Cantidad', undefined],
    ]);
    expect(partSpecSummary('oil', sheet)).toBe('Sintético · 5W-30');
    expect(partSpecSummary('oil_filter', sheet)).toBeUndefined();
  });

  it('se guarda en la ficha, sobrevive a cerrar la app, y borrar un dato lo quita', () => {
    const key = partSpecKey('oil', 'Viscosidad');
    const saved = userDataActions.updateCarSheet(EMPTY_STORED_USER_DATA, { oil: 'Mobil 5W-30', [key]: '5W-30' });
    const reloaded = sanitizeUserData(JSON.parse(JSON.stringify(saved))).data;
    expect(reloaded.carSheet).toEqual({ oil: 'Mobil 5W-30', [key]: '5W-30' });
    const cleared = userDataActions.updateCarSheet(reloaded, { ...reloaded.carSheet, [key]: '' });
    expect(cleared.carSheet).toEqual({ oil: 'Mobil 5W-30' });
  });

  it('el contador de la ficha no cuenta lo anotado en Repuestos', () => {
    expect(sheetFieldCount({ oil: 'x', notes: 'y', [partSpecKey('oil', 'Viscosidad')]: '5W-30' })).toBe(2);
  });
});
