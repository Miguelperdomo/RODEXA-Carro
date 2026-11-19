import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { BRAND } from '@/config/brand';
import { appAlert } from '@/shared/ui/AppDialog';

/**
 * Correos de Ayuda y soporte. RODEXA solo PREPARA el correo y abre la app de
 * correo del usuario: él lo revisa y lo envía. No hay servidor, API ni envío
 * automático, y nada de esto se guarda en el teléfono.
 */
export type EmailDraft = { subject: string; body?: string };

const SIGNATURE = `---\n\nEnviado desde ${BRAND.productName}\n${BRAND.madeBy}`;

export function reportDraft(problem: string, context: string): EmailDraft {
  const lines = [`Reporte de problema — ${BRAND.productName}`, '', 'Problema:', problem.trim()];
  if (context.trim()) lines.push('', 'Qué estaba haciendo:', context.trim());
  return { subject: '[RODEXA] Reporte de problema', body: [...lines, '', SIGNATURE].join('\n') };
}

export function suggestionDraft(idea: string): EmailDraft {
  const lines = [`Sugerencia de mejora — ${BRAND.productName}`, '', 'Idea:', idea.trim()];
  return { subject: '[RODEXA] Sugerencia de mejora', body: [...lines, '', SIGNATURE].join('\n') };
}

export const CONTACT_DRAFT: EmailDraft = { subject: '[RODEXA] Contacto' };

/** Campos que llena el dueño del taller (no se envía nada sin que él lo revise). */
export const WORKSHOP_FIELDS = [
  'Nombre del taller',
  'Ciudad',
  'Dirección',
  'Teléfono / WhatsApp',
  'Correo',
  'Persona de contacto',
  'Servicios que ofrece (mecánica, eléctrica, frenos, llantas, alineación, latonería, pintura…)',
  'Tipos de carro que atiende (gasolina, diésel, GNC, eléctricos, híbridos)',
  'Marcas en las que se especializa',
  'Horario de atención',
  'Página web o redes sociales',
  'Comentarios',
];

/** "Tengo un taller": solicitud para inscribirlo en RODEXA, con la estructura lista. */
export function workshopDraft(): EmailDraft {
  const lines = [
    `Quiero inscribir mi taller en ${BRAND.masterBrand}`,
    '',
    'Completa los datos de tu taller:',
    '',
    ...WORKSHOP_FIELDS.map((field) => `${field}: `),
  ];
  return { subject: '[RODEXA] Inscripción de taller', body: [...lines, '', SIGNATURE].join('\n') };
}

export function mailtoUrl(to: string, { subject, body }: EmailDraft): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${to}?${params.join('&')}`;
}

/**
 * Abre la app de correo con el borrador. `true` = se abrió. Si el teléfono no
 * tiene app de correo, avisa con el correo y la opción de copiarlo (sin errores técnicos).
 */
export async function openEmailDraft(draft: EmailDraft, onCopied?: () => void): Promise<boolean> {
  try {
    await Linking.openURL(mailtoUrl(BRAND.supportEmail, draft));
    return true;
  } catch {
    appAlert('No encontramos una aplicación de correo en tu dispositivo.', BRAND.supportEmail, [
      { text: 'Cerrar', style: 'cancel' },
      {
        text: 'Copiar correo',
        onPress: async () => {
          try {
            await Clipboard.setStringAsync(BRAND.supportEmail);
            onCopied?.();
          } catch {
            // Sin portapapeles: el correo sigue a la vista en la ventana.
          }
        },
      },
    ]);
    return false;
  }
}
