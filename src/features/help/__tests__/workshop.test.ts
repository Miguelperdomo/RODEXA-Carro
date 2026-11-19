/** Correo "¿Tienes un taller?": la estructura lista para llenar. */
import { mailtoUrl, WORKSHOP_FIELDS, workshopDraft } from '../email';

describe('inscripción de taller', () => {
  it('asunto y todos los campos para llenar, uno por línea', () => {
    const draft = workshopDraft();
    expect(draft.subject).toBe('[RODEXA] Inscripción de taller');
    const lines = draft.body!.split('\n');
    for (const field of WORKSHOP_FIELDS) expect(lines).toContain(`${field}: `);
    expect(draft.body).toMatch(/Quiero inscribir mi taller en RODEXA/);
    expect(draft.body).toMatch(/Enviado desde RODEXA Carro/);
  });

  it('el enlace de correo lleva asunto y cuerpo codificados', () => {
    const url = mailtoUrl('soporte@ejemplo.com', workshopDraft());
    expect(url.startsWith('mailto:soporte@ejemplo.com?subject=')).toBe(true);
    expect(url).toContain(encodeURIComponent('Nombre del taller: '));
  });
});
