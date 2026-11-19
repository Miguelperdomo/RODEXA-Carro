/** "Llamar rápido" en Inicio: qué círculos aparecen, "Varada", la ⭐ y la invitación. */
import { isGettingStartedOpen } from '@/features/dashboard/gettingStarted';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { EMPTY_USER_DATA } from '@/features/session/types';
import { userDataActions } from '@/features/session/userDataActions';
import { sanitizeUserData } from '@/storage/userDataStore';

import { CONTACT_KINDS, quickCall, QUICK_CALL_MAX, sanitizeContacts, shortName, togglePinned, type CarContact } from '../rules';

const c = (id: string, kind: CarContact['kind'], extra: Partial<CarContact> = {}): CarContact => ({
  id,
  kind,
  name: `Contacto ${id}`,
  phone: '3001234567',
  ...extra,
});

describe('círculos de Llamar rápido', () => {
  it('sin fijados: mecánico, aseguradora, grúa, familiar (y "Varada" primero si hay grúa o aseguradora)', () => {
    const list = [c('w', 'wash'), c('f', 'family'), c('t', 'tow'), c('m', 'mechanic'), c('i', 'insurance')];
    const { emergency, circles } = quickCall(list);
    expect(emergency.map((x) => x.id)).toEqual(['t', 'i']);
    // "Varada" ocupa un círculo: quedan 3.
    expect(circles.map((x) => x.id)).toEqual(['m', 'i', 't']);
    expect(emergency.length > 0 ? circles.length + 1 : circles.length).toBe(QUICK_CALL_MAX);
  });

  it('sin grúa ni aseguradora no hay "Varada" y caben 4', () => {
    const list = [c('o', 'other'), c('f', 'family'), c('w', 'wash'), c('m', 'mechanic'), c('m2', 'mechanic')];
    const { emergency, circles } = quickCall(list);
    expect(emergency).toEqual([]);
    expect(circles.map((x) => x.id)).toEqual(['m', 'm2', 'f', 'w']);
  });

  it('con ⭐: solo los fijados, en su orden', () => {
    const list = [c('m', 'mechanic'), c('w', 'wash', { pinned: true }), c('f', 'family', { pinned: true })];
    expect(quickCall(list).circles.map((x) => x.id)).toEqual(['w', 'f']);
  });

  it('nombres largos se acortan en el círculo', () => {
    expect(shortName('Taller de don Jorge')).toBe('Taller de d…');
    expect(shortName('Grúa')).toBe('Grúa');
  });
});

describe('la ⭐ (dato nuevo opcional)', () => {
  it('fijar y quitar', () => {
    const pinned = togglePinned([c('m', 'mechanic')], 'm');
    expect(pinned[0].pinned).toBe(true);
    expect('pinned' in togglePinned(pinned, 'm')[0]).toBe(false);
  });

  it('los contactos guardados antes siguen igual; la ⭐ y "Familiar" se leen bien', () => {
    const old = { id: 'a', kind: 'mechanic', name: 'Don Jorge', phone: '3001234567' };
    expect(sanitizeContacts([old])).toEqual([old]);
    expect(sanitizeContacts([{ ...old, kind: 'family', pinned: true }])?.[0]).toMatchObject({ kind: 'family', pinned: true });
    expect(sanitizeContacts([{ ...old, pinned: 'sí' }])?.[0]).not.toHaveProperty('pinned');
    expect(CONTACT_KINDS.map((k) => k.label)).toContain('Familiar');
  });

  it('viaja en la copia de seguridad', () => {
    const d = userDataActions.setContacts(EMPTY_USER_DATA, [c('m', 'mechanic', { pinned: true })]);
    expect(sanitizeUserData(d).data.contacts?.[0].pinned).toBe(true);
  });
});

describe('invitación sin contactos', () => {
  it('es una preferencia guardable que empieza en "mostrar"', () => {
    expect(DEFAULT_SETTINGS.quickCallInviteDismissed).toBe(false);
  });

  it('no compite con "Primeros pasos" (misma regla que su tarjeta)', () => {
    const data = { profile: { energySource: 'gasoline' }, history: [], components: [], documents: [] } as never;
    expect(isGettingStartedOpen(true, data)).toBe(true);
    expect(isGettingStartedOpen(false, data)).toBe(false);
  });
});
