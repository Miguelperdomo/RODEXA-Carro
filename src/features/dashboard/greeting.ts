/**
 * Saludo de Inicio según la hora, sin género: no se pregunta ni se adivina por el nombre.
 * - 5:00 a 11:59 → "Buenos días"
 * - 12:00 a 18:59 → "Buenas tardes"
 * - 19:00 a 4:59 → "Buenas noches"
 * Con nombre se usa solo el primero ("Susana María Pérez" → "Buenas tardes, Susana").
 */
export function greeting(now: Date, name?: string): string {
  const hour = now.getHours();
  const salute = hour >= 5 && hour < 12 ? 'Buenos días' : hour >= 12 && hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName ? `${salute}, ${firstName}` : salute;
}

/** Línea bajo el saludo: con el apodo del carro si lo tiene ("Así va La Negra hoy."). */
export function greetingSubtitle(nickname?: string): string {
  const name = nickname?.trim();
  return name ? `Así va ${name} hoy.` : 'Así va tu carro hoy.';
}
