import type { HistoryEntry } from '@/features/history/types';

import { EMPTY_USER_DATA, type OnboardingData, type UserData } from '../types';
import { userDataActions as A } from '../userDataActions';

const onboarding: OnboardingData = {
  user: { name: 'Ana', city: '' },
  profile: {
    id: 'car-1',
    brandCode: 'renault',
    brandName: 'Renault',
    model: 'Logan',
    energySource: 'gasoline',
    displacementCc: 1600,
    plate: 'ABC123',
  },
  km: 1000,
  maintenance: [{ code: 'oil', date: '2026-09-01', km: 900, costCop: null }],
  documents: {},
  completedAt: '2026-09-02',
};
const withOnboarding: UserData = { ...EMPTY_USER_DATA, onboarding };

/** Lo que queda después de guardar y volver a abrir la app (JSON descarta los undefined). */
const reload = (data: UserData): UserData => JSON.parse(JSON.stringify(data));

describe('editar el perfil del carro', () => {
  it('borrar un dato (placa) se conserva al reabrir la app', () => {
    const edited = reload(A.updateCar(withOnboarding, { plate: undefined }));
    expect(edited.onboarding?.profile.plate).toBeUndefined();
    expect(edited.onboarding?.profile.model).toBe('Logan');
  });

  it('cambiar a eléctrico y quitar el cilindraje no lo hace reaparecer', () => {
    const edited = reload(A.updateCar(withOnboarding, { energySource: 'electric', displacementCc: undefined }));
    expect(edited.onboarding?.profile.energySource).toBe('electric');
    expect(edited.onboarding?.profile.displacementCc).toBeUndefined();
  });

  it('conserva el resto del primer ingreso (km inicial, mantenimientos, fecha)', () => {
    const edited = A.updateCar(withOnboarding, { transmission: 'manual' });
    expect(edited.onboarding?.km).toBe(1000);
    expect(edited.onboarding?.maintenance).toEqual(onboarding.maintenance);
    expect(edited.onboarding?.completedAt).toBe('2026-09-02');
    expect(edited.onboarding?.profile.transmission).toBe('manual');
  });
});

describe('eliminar registros', () => {
  const record: HistoryEntry = { id: 'km-1', kind: 'odometer', date: '2026-09-03', km: 1200 };

  it('borra un registro posterior al primer ingreso', () => {
    const data = A.addRecord(withOnboarding, record);
    expect(A.deleteEntry(data, 'km-1').records).toEqual([]);
  });

  it('borra un mantenimiento del primer ingreso sin tocar lo demás (queda retirado en su lugar)', () => {
    const data = A.deleteEntry(withOnboarding, 'onb-m-0');
    expect(data.onboarding?.maintenance.every((m) => m.removed)).toBe(true);
    expect(data.onboarding?.profile).toEqual(onboarding.profile);
    // Borrarlo otra vez no hace nada.
    expect(A.deleteEntry(data, 'onb-m-0')).toEqual(data);
  });

  it('un id que no existe no cambia nada', () => {
    expect(A.deleteEntry(withOnboarding, 'no-existe')).toEqual(withOnboarding);
  });
});
