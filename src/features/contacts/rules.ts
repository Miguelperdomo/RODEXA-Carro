import type { IconName } from '@/shared/ui';

/**
 * Mis contactos del carro: los números los escribe el usuario (RODEXA no trae directorios).
 * Sirven para llamar con un toque, por ejemplo en una varada.
 */
export type ContactKind = 'mechanic' | 'insurance' | 'tow' | 'family' | 'wash' | 'other';

export type CarContact = {
  id: string;
  kind: ContactKind;
  name: string;
  phone: string;
  note?: string;
  /** Fijado con ⭐ para "Llamar rápido" en Inicio (opcional: los contactos anteriores no lo tienen). */
  pinned?: boolean;
};

export const MAX_CONTACTS = 20;

export const CONTACT_KINDS: { kind: ContactKind; label: string; icon: IconName; placeholder: string }[] = [
  { kind: 'mechanic', label: 'Mecánico', icon: 'maintenance', placeholder: 'Ej.: Taller de don Jorge' },
  { kind: 'insurance', label: 'Asistencia de la aseguradora', icon: 'insurance', placeholder: 'Ej.: Asistencia de mi póliza' },
  { kind: 'tow', label: 'Grúa', icon: 'tow', placeholder: 'Ej.: Grúas del barrio' },
  { kind: 'family', label: 'Familiar', icon: 'usagePersonal', placeholder: 'Ej.: Mi hermano' },
  { kind: 'wash', label: 'Lavadero', icon: 'wash', placeholder: 'Ej.: Lavadero la 80' },
  { kind: 'other', label: 'Otro', icon: 'contact', placeholder: 'Ej.: Electricista' },
];

export const contactKind = (kind: ContactKind) => CONTACT_KINDS.find((k) => k.kind === kind) ?? CONTACT_KINDS[CONTACT_KINDS.length - 1];

/** Solo dígitos (y un "+" inicial): "+57 (601) 555-12-34" → "+576015551234". */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

/** Enlace para llamar. */
export function telUrl(phone: string): string {
  return `tel:${normalizePhone(phone)}`;
}

export type ContactErrors = { name?: string; phone?: string };

export function validateContact(input: { name: string; phone: string }): ContactErrors {
  const errors: ContactErrors = {};
  if (!input.name.trim()) errors.name = 'Escribe un nombre.';
  const digits = normalizePhone(input.phone).replace('+', '');
  if (!/^[\d\s()+\-.]*$/.test(input.phone.trim()) || digits.length < 3 || digits.length > 15) {
    errors.phone = 'Revisa el número (solo números, de 3 a 15 dígitos).';
  }
  return errors;
}

const KINDS = CONTACT_KINDS.map((k) => k.kind);

/** Lectura tolerante: los elementos que no tienen la forma esperada se descartan. */
export function sanitizeContacts(raw: unknown): CarContact[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.flatMap((v): CarContact[] => {
    if (typeof v !== 'object' || v === null) return [];
    const r = v as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.phone !== 'string') return [];
    if (!KINDS.includes(r.kind as ContactKind)) return [];
    if (Object.keys(validateContact({ name: r.name, phone: r.phone })).length > 0) return [];
    return [
      {
        id: r.id,
        kind: r.kind as ContactKind,
        name: r.name.trim(),
        phone: r.phone.trim(),
        ...(typeof r.note === 'string' && r.note.trim() ? { note: r.note.trim() } : {}),
        ...(r.pinned === true ? { pinned: true } : {}),
      },
    ];
  }).slice(0, MAX_CONTACTS);
}

// ── Llamar rápido (Inicio) ──────────────────────────────────────────────────

/** Círculos en Inicio (incluido "Varada" si aparece). */
export const QUICK_CALL_MAX = 4;
/** Sin fijados, este es el orden; los demás tipos van después. */
const QUICK_ORDER: ContactKind[] = ['mechanic', 'insurance', 'tow', 'family', 'wash', 'other'];
/** "Varada": la grúa y la asistencia de la aseguradora. */
export const EMERGENCY_KINDS: ContactKind[] = ['tow', 'insurance'];

export type QuickCall = {
  /** Contactos para una varada (grúa y aseguradora); vacío → no hay círculo "Varada". */
  emergency: CarContact[];
  /** Contactos en círculos (sin contar "Varada"). */
  circles: CarContact[];
};

/**
 * Qué se muestra en "Llamar rápido": hasta 4 círculos. Si hay grúa o aseguradora, el
 * primero es "Varada". Luego los fijados con ⭐ (en su orden); sin fijados, mecánico,
 * aseguradora, grúa y familiar.
 */
export function quickCall(contacts: CarContact[]): QuickCall {
  const emergency = contacts.filter((c) => EMERGENCY_KINDS.includes(c.kind));
  const room = QUICK_CALL_MAX - (emergency.length > 0 ? 1 : 0);
  const pinned = contacts.filter((c) => c.pinned);
  const circles =
    pinned.length > 0
      ? pinned
      : contacts
          .map((c, index) => ({ c, index }))
          .sort((a, b) => QUICK_ORDER.indexOf(a.c.kind) - QUICK_ORDER.indexOf(b.c.kind) || a.index - b.index)
          .map(({ c }) => c);
  return { emergency, circles: circles.slice(0, room) };
}

/** Fija o quita la ⭐ de un contacto. */
export function togglePinned(contacts: CarContact[], id: string): CarContact[] {
  return contacts.map((c) => {
    if (c.id !== id) return c;
    const { pinned: _old, ...rest } = c;
    return c.pinned ? rest : { ...rest, pinned: true };
  });
}

/** Nombre corto para el círculo ("Taller de don Jorge" → "Taller de…"). */
export function shortName(name: string, max = 12): string {
  const trimmed = name.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
