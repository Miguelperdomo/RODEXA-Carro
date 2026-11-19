import type { Href } from 'expo-router';

import type { IconName } from '@/shared/ui';

/**
 * Buscador "¿Qué quieres hacer?": cada pantalla con las palabras con que la gente la busca (como
 * se dice en Colombia). Se busca sin tildes y perdonando una letra mal escrita. Funciona sin
 * internet. Al agregar una pantalla nueva, agrégala aquí.
 */
export type Destination = {
  key: string;
  title: string;
  description: string;
  icon: IconName;
  href: Href;
  /** Otras formas de buscarla. */
  words: string;
};

export const DESTINATIONS: Destination[] = [
  // Registrar
  { key: 'fuel', title: 'Registrar combustible o carga', description: 'Tanqueo, GNC o carga eléctrica', icon: 'fuel', href: '/registrar/energia', words: 'gasolina tanqueo tanquear combustible diesel acpm galon gnc gas carga electrica llenar' },
  { key: 'km', title: 'Actualizar kilometraje', description: 'El km del tablero', icon: 'odometer', href: '/registrar/kilometraje', words: 'kilometraje km kilometros tablero odometro' },
  { key: 'maintenance', title: 'Registrar mantenimiento', description: 'Aceite, frenos, llantas…', icon: 'maintenance', href: '/registrar/mantenimiento', words: 'mantenimiento aceite frenos llantas filtro bujia correa taller arreglo cambio alineacion' },
  { key: 'expense', title: 'Registrar gasto', description: 'Lavado, parqueadero, peajes…', icon: 'expense', href: '/registrar/gasto', words: 'gasto pague lavado parqueadero peaje compra' },
  { key: 'income', title: 'Ingresos de mi carro', description: 'Lo que generas con tu carro', icon: 'income', href: '/ingresos', words: 'ingresos gane trabajo pasajeros domicilios plata genere' },
  { key: 'doc', title: 'Registrar documento', description: 'SOAT, tecnomecánica, licencia', icon: 'document', href: '/registrar/documento', words: 'documento soat tecno tecnomecanica licencia poliza seguro impuesto' },
  // Mi carro
  { key: 'docs', title: 'Mis documentos', description: 'Vencimientos', icon: 'document', href: '/documentos', words: 'documentos soat tecnomecanica vence vencimiento licencia papeles' },
  { key: 'credit', title: 'Crédito del carro', description: 'Cuotas y cuándo terminas', icon: 'loan', href: '/mi-carro/credito', words: 'credito cuota cuotas leasing financiacion deuda banco pagar' },
  { key: 'parts', title: 'Repuestos de mi carro', description: 'Marca, referencia y última compra', icon: 'parts', href: '/mis-repuestos', words: 'repuestos referencia aceite filtro bujia llanta pastillas almacen' },
  { key: 'parking', title: '¿Dónde lo parqueé?', description: 'Piso, puesto y foto', icon: 'parking', href: '/parqueadero', words: 'parqueadero parquee deje donde piso puesto sotano' },
  { key: 'contacts', title: 'Mis contactos del carro', description: 'Mecánico, grúa, aseguradora', icon: 'phone', href: '/mi-carro/contactos', words: 'contactos mecanico grua telefono llamar aseguradora familiar' },
  { key: 'reminders', title: 'Mis recordatorios', description: 'Por fecha o por km', icon: 'notifications', href: '/mi-carro/recordatorios', words: 'recordatorios recordar avisame alarma' },
  { key: 'recurring', title: 'Gastos que se repiten', description: 'Garaje, seguro, cuota', icon: 'calendar', href: '/mi-carro/gastos-fijos', words: 'gastos fijos mensuales garaje seguro mes' },
  { key: 'budget', title: 'Presupuesto mensual', description: 'Cuánto gastar como máximo', icon: 'expense', href: '/mi-carro/presupuesto', words: 'presupuesto limite maximo gastar' },
  { key: 'pyp', title: 'Pico y placa', description: 'Tus días de restricción', icon: 'calendar', href: '/mi-carro/pico-y-placa', words: 'pico placa restriccion dias' },
  { key: 'sheet', title: 'Ficha de mi carro', description: 'Medidas y referencias', icon: 'note', href: '/mi-carro/ficha', words: 'ficha chasis motor datos llantas medida vin' },
  { key: 'edit', title: 'Editar datos del carro', description: 'Marca, modelo, año, placa', icon: 'car', href: '/mi-carro/editar', words: 'editar carro placa modelo marca cilindraje año servicio' },
  { key: 'weekly', title: 'Revisión semanal', description: 'Llantas, luces, niveles', icon: 'checklist', href: '/revision-semanal', words: 'revision semanal chequeo luces niveles' },
  { key: 'trip', title: 'Voy a viajar', description: 'Revisa el carro antes de salir', icon: 'travel', href: '/revision-viaje', words: 'viaje viajar carretera puente salir festivo' },
  { key: 'savings', title: '¿Cuánto me ahorro en carro?', description: 'Frente al transporte público', icon: 'stats', href: '/ahorro', words: 'ahorro ahorrar bus transmilenio metro mio pasaje transporte' },
  // Por si acaso
  { key: 'stranded', title: 'Me quedé varado', description: 'Pinchazo, no prende, se recalienta…', icon: 'tow', href: '/varado', words: 'varado pinchazo pinche despinche llanta no prende arranca bateria recalienta gasolina grua' },
  { key: 'emergency', title: 'Tuve un accidente', description: '123, SOAT y contactos', icon: 'emergency', href: '/emergencia', words: 'accidente choque emergencia 123 ambulancia' },
  { key: 'compliance', title: '¿Estoy en regla?', description: 'Documentos y lo que debe llevar el carro', icon: 'statusOk', href: '/en-regla', words: 'regla papeles documentos extintor botiquin kit carretera gato cruceta tacos control agente policia' },
  { key: 'fines', title: '¿Me multaron?', description: 'Paga con descuento', icon: 'receipt', href: '/multas', words: 'multa comparendo fotomulta descuento curso simit pagar' },
  { key: 'law', title: 'Ley de tránsito', description: 'Multas e inmovilización', icon: 'info', href: '/ley-transito', words: 'ley transito normas multas inmovilizar patios velocidad licencia' },
  { key: 'transfer', title: 'Guía de traspaso', description: 'Vender o comprar un carro usado', icon: 'paperwork', href: '/traspaso', words: 'traspaso vender comprar usado runt compraventa' },
  { key: 'workshops', title: 'Talleres y servicios', description: 'Talleres, a domicilio y CDA', icon: 'workshop', href: '/talleres', words: 'taller talleres mecanico domicilio cda tecnomecanica grua' },
  // Historial y estadísticas
  { key: 'calendar', title: 'Calendario', description: 'Lo que hiciste, vencimientos y festivos', icon: 'calendar', href: { pathname: '/historial', params: { vista: 'calendario' } }, words: 'calendario agenda fechas dia mes vence vencimientos festivo puente cuando' },
  { key: 'history', title: 'Historial', description: 'Todo lo que registraste', icon: 'history', href: '/historial', words: 'historial registros buscar' },
  { key: 'stats', title: 'Estadísticas', description: 'Cuánto te cuesta tu carro', icon: 'stats', href: '/estadisticas', words: 'estadisticas gastos cuanto gasto consumo rendimiento' },
  { key: 'year', title: 'Tu año con tu carro', description: 'Resumen para compartir', icon: 'stats', href: '/tu-ano', words: 'año resumen compartir' },
  // Configuración
  { key: 'settings', title: 'Configuración', description: 'Tema, estilo, notificaciones', icon: 'settings', href: '/configuracion', words: 'configuracion ajustes opciones tema estilo tranqui detalle' },
  { key: 'notif', title: 'Notificaciones', description: 'Avisos y puentes festivos', icon: 'notifications', href: '/configuracion/notificaciones', words: 'notificaciones avisos alertas puentes festivos' },
  { key: 'backup', title: 'Copia de seguridad', description: 'Guardar o recuperar tus datos', icon: 'exportData', href: '/configuracion/datos', words: 'copia seguridad respaldo backup celular nuevo recuperar' },
  { key: 'prefs', title: 'Preferencias generales', description: 'Formatos y opciones', icon: 'settings', href: '/configuracion/preferencias', words: 'preferencias formato fecha' },
  { key: 'help', title: 'Ayuda y contacto', description: 'Preguntas frecuentes', icon: 'faq', href: '/configuracion/ayuda', words: 'ayuda preguntas frecuentes soporte contacto' },
  { key: 'report', title: 'Reportar un problema', description: 'Escríbenos', icon: 'bug', href: '/configuracion/reportar', words: 'reportar problema error falla' },
  { key: 'privacy', title: 'Privacidad y datos', description: 'Borrar datos y política', icon: 'policy', href: '/configuracion/privacidad', words: 'privacidad borrar datos politica eliminar' },
  { key: 'pro', title: 'RODEXA Pro', description: 'Funciones avanzadas', icon: 'premium', href: '/pro', words: 'pro premium suscripcion' },
  { key: 'signup', title: 'Inscribe tu negocio', description: 'Taller, servicio o CDA', icon: 'partner', href: '/inscribir', words: 'inscribir taller negocio servicio cda registrar' },
];

/** Minúsculas, sin tildes ni signos. */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ¿Las dos palabras son iguales con a lo sumo una letra distinta, de más o de menos? */
function oneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Puntaje de una palabra buscada contra las palabras de un destino (0 = no coincide). */
function wordScore(query: string, words: string[]): number {
  let best = 0;
  for (const w of words) {
    if (w === query) return 3;
    // "cred" encuentra "credito".
    if (query.length >= 2 && w.startsWith(query)) best = Math.max(best, 2);
    // Una letra mal escrita: "credto" → "credito" (o al empezar la palabra).
    else if (query.length >= 4 && (oneEdit(query, w) || (w.length > query.length && oneEdit(query, w.slice(0, query.length)))))
      best = Math.max(best, 1);
  }
  return best;
}

/** Palabras que no dicen qué busca ("de", "mi", "que"…). */
const FILLER = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'en', 'mi', 'mis', 'un', 'una', 'que', 'como', 'con', 'por',
  'para', 'al', 'lo', 'me', 'se', 'su', 'tu', 'es', 'y', 'o', 'cuanto', 'cuanta', 'cuando', 'donde',
  'quiero', 'ver', 'hay', 'tengo', 'esta',
]);

/** Los mejores destinos para lo que escribió (máximo `limit`). Todas las palabras deben coincidir. */
export function searchDestinations(text: string, limit = 6): Destination[] {
  const all = normalizeSearch(text).split(' ').filter((w) => w.length >= 2);
  // "cambio DE aceite": las palabras de relleno no cuentan (si solo hay relleno, se usan igual).
  const meaningful = all.filter((w) => !FILLER.has(w));
  const query = meaningful.length > 0 ? meaningful : all;
  if (query.length === 0) return [];
  const scored = DESTINATIONS.map((d) => {
    const titleWords = normalizeSearch(d.title).split(' ');
    const words = [...titleWords, ...normalizeSearch(`${d.description} ${d.words}`).split(' ')];
    let total = 0;
    for (const q of query) {
      const s = Math.max(wordScore(q, titleWords) * 2, wordScore(q, words));
      if (s === 0) return { d, total: 0 };
      total += s;
    }
    return { d, total };
  });
  return scored
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((x) => x.d);
}
