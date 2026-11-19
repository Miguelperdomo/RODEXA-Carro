#!/usr/bin/env node
/**
 * Genera src/features/catalogs/data/colombia.ts con los departamentos y municipios OFICIALES
 * de Colombia (DIVIPOLA del DANE, publicada en datos.gov.co, conjunto gdxc-w37w).
 *
 *   node scripts/generate-colombia.mjs
 *
 * No necesita librerías (usa fetch de Node 18+). No edites el archivo generado a mano:
 * cambia este script y vuelve a correrlo.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE =
  'https://www.datos.gov.co/resource/gdxc-w37w.json?$select=cod_dpto,dpto,cod_mpio,nom_mpio,tipo_municipio&$limit=5000&$order=cod_mpio';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'features', 'catalogs', 'data', 'colombia.ts');

const EXPECTED_MUNICIPALITIES = 1122;
const EXPECTED_DEPARTMENTS = 33;

/** Nombres especiales (los mismos de RODEXA Moto). */
const DEPARTMENT_NAMES = { '11': 'Bogotá D.C.', '88': 'San Andrés y Providencia' };
/** Nombre común en vez del oficial largo. */
const MUNICIPALITY_NAMES = {
  '11001': 'Bogotá D.C.',
  '76001': 'Cali',
  '54001': 'Cúcuta',
  '13001': 'Cartagena',
  '76111': 'Buga',
  '52835': 'Tumaco',
};

/**
 * Catálogo ANTERIOR de RODEXA Carro (id, nombre, departamento). Los usuarios pueden tener
 * guardado uno de estos ids: se emparejan con su código DANE para que nadie pierda su ciudad.
 */
const LEGACY_CITIES = [
  ['bogota', 'Bogotá', 'Bogotá D.C.'], ['medellin', 'Medellín', 'Antioquia'], ['cali', 'Cali', 'Valle del Cauca'],
  ['barranquilla', 'Barranquilla', 'Atlántico'], ['cartagena', 'Cartagena', 'Bolívar'], ['bucaramanga', 'Bucaramanga', 'Santander'],
  ['cucuta', 'Cúcuta', 'Norte de Santander'], ['pereira', 'Pereira', 'Risaralda'], ['manizales', 'Manizales', 'Caldas'],
  ['armenia', 'Armenia', 'Quindío'], ['ibague', 'Ibagué', 'Tolima'], ['neiva', 'Neiva', 'Huila'],
  ['villavicencio', 'Villavicencio', 'Meta'], ['pasto', 'Pasto', 'Nariño'], ['popayan', 'Popayán', 'Cauca'],
  ['tunja', 'Tunja', 'Boyacá'], ['santa-marta', 'Santa Marta', 'Magdalena'], ['valledupar', 'Valledupar', 'Cesar'],
  ['monteria', 'Montería', 'Córdoba'], ['sincelejo', 'Sincelejo', 'Sucre'], ['riohacha', 'Riohacha', 'La Guajira'],
  ['florencia', 'Florencia', 'Caquetá'], ['mocoa', 'Mocoa', 'Putumayo'], ['quibdo', 'Quibdó', 'Chocó'],
  ['yopal', 'Yopal', 'Casanare'], ['arauca', 'Arauca', 'Arauca'], ['leticia', 'Leticia', 'Amazonas'],
  ['san-jose-guaviare', 'San José del Guaviare', 'Guaviare'], ['san-andres', 'San Andrés', 'San Andrés y Providencia'],
  ['soacha', 'Soacha', 'Cundinamarca'], ['chia', 'Chía', 'Cundinamarca'], ['zipaquira', 'Zipaquirá', 'Cundinamarca'],
  ['facatativa', 'Facatativá', 'Cundinamarca'], ['fusagasuga', 'Fusagasugá', 'Cundinamarca'], ['girardot', 'Girardot', 'Cundinamarca'],
  ['bello', 'Bello', 'Antioquia'], ['itagui', 'Itagüí', 'Antioquia'], ['envigado', 'Envigado', 'Antioquia'],
  ['rionegro', 'Rionegro', 'Antioquia'], ['apartado', 'Apartadó', 'Antioquia'], ['caucasia', 'Caucasia', 'Antioquia'],
  ['palmira', 'Palmira', 'Valle del Cauca'], ['buenaventura', 'Buenaventura', 'Valle del Cauca'], ['tulua', 'Tuluá', 'Valle del Cauca'],
  ['buga', 'Buga', 'Valle del Cauca'], ['cartago', 'Cartago', 'Valle del Cauca'], ['soledad', 'Soledad', 'Atlántico'],
  ['malambo', 'Malambo', 'Atlántico'], ['magangue', 'Magangué', 'Bolívar'], ['floridablanca', 'Floridablanca', 'Santander'],
  ['giron', 'Girón', 'Santander'], ['piedecuesta', 'Piedecuesta', 'Santander'], ['barrancabermeja', 'Barrancabermeja', 'Santander'],
  ['ocana', 'Ocaña', 'Norte de Santander'], ['pamplona', 'Pamplona', 'Norte de Santander'], ['dosquebradas', 'Dosquebradas', 'Risaralda'],
  ['la-dorada', 'La Dorada', 'Caldas'], ['espinal', 'Espinal', 'Tolima'], ['rovira', 'Rovira', 'Tolima'],
  ['melgar', 'Melgar', 'Tolima'], ['honda', 'Honda', 'Tolima'], ['chaparral', 'Chaparral', 'Tolima'],
  ['pitalito', 'Pitalito', 'Huila'], ['garzon', 'Garzón', 'Huila'], ['orito', 'Orito', 'Putumayo'],
  ['puerto-asis', 'Puerto Asís', 'Putumayo'], ['ipiales', 'Ipiales', 'Nariño'], ['tumaco', 'Tumaco', 'Nariño'],
  ['sogamoso', 'Sogamoso', 'Boyacá'], ['duitama', 'Duitama', 'Boyacá'], ['cienaga', 'Ciénaga', 'Magdalena'],
  ['aguachica', 'Aguachica', 'Cesar'], ['lorica', 'Lorica', 'Córdoba'], ['maicao', 'Maicao', 'La Guajira'],
  ['acacias', 'Acacías', 'Meta'],
];

/**
 * Emparejados A MANO (revisados uno por uno): el nombre del catálogo anterior no coincide con
 * el oficial del DANE. Se completa si el script avisa de ciudades sin emparejar.
 */
const LEGACY_MANUAL = {
  // El catálogo anterior decía "Bogotá"; el oficial es "Bogotá, D.C." (aquí "Bogotá D.C.").
  bogota: '11001',
};

const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en', 'a', 'al']);

/** "NORTE DE SANTANDER" → "Norte de Santander"; mayúscula después de "-" o "(". */
export function titleCase(raw) {
  const words = raw.trim().toLowerCase().split(/\s+/);
  return words
    .map((word, i) => {
      const cap = (w) => w.replace(/(^|[-(])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
      return i > 0 && CONNECTORS.has(word) ? word : cap(word);
    })
    .join(' ');
}

const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`datos.gov.co respondió ${res.status}`);
  const rows = await res.json();

  const departments = new Map();
  const municipalities = [];
  for (const r of rows) {
    const dcode = String(r.cod_dpto).padStart(2, '0');
    const mcode = String(r.cod_mpio).padStart(5, '0');
    if (!departments.has(dcode)) departments.set(dcode, DEPARTMENT_NAMES[dcode] ?? titleCase(r.dpto));
    municipalities.push([mcode, MUNICIPALITY_NAMES[mcode] ?? titleCase(r.nom_mpio)]);
  }
  if (municipalities.length !== EXPECTED_MUNICIPALITIES) throw new Error(`Se esperaban ${EXPECTED_MUNICIPALITIES} municipios y llegaron ${municipalities.length}`);
  if (departments.size !== EXPECTED_DEPARTMENTS) throw new Error(`Se esperaban ${EXPECTED_DEPARTMENTS} departamentos y llegaron ${departments.size}`);

  // Ids viejos → código DANE (por nombre y departamento, sin tildes; o a mano).
  const deptByName = new Map([...departments].map(([code, name]) => [plain(name), code]));
  const legacy = {};
  const unmatched = [];
  for (const [id, name, department] of LEGACY_CITIES) {
    if (LEGACY_MANUAL[id]) {
      legacy[id] = LEGACY_MANUAL[id];
      continue;
    }
    const dcode = deptByName.get(plain(department));
    const hits = municipalities.filter(([code, n]) => code.startsWith(dcode ?? '??') && plain(n) === plain(name));
    if (hits.length === 1) legacy[id] = hits[0][0];
    else unmatched.push(`${id} (${name}, ${department}): ${hits.length} coincidencias`);
  }
  if (unmatched.length) {
    console.error('Ciudades viejas sin emparejar (agrégalas a LEGACY_MANUAL):\n  ' + unmatched.join('\n  '));
    process.exitCode = 1;
    return;
  }

  const deps = [...departments].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const out = `/**
 * ARCHIVO GENERADO — no lo edites a mano. Se genera con: node scripts/generate-colombia.mjs
 *
 * Fuente: DIVIPOLA del DANE, "Departamentos y municipios de Colombia", datos.gov.co
 * (conjunto gdxc-w37w): ${municipalities.length} municipios (incluye islas y áreas no municipalizadas)
 * y ${deps.length} departamentos (incluida Bogotá D.C.).
 */

/** Departamentos, en orden alfabético. \`code\`: los 2 dígitos del DANE. */
export const DEPARTMENTS: readonly { code: string; name: string }[] = [
${deps.map((d) => `  { code: ${q(d.code)}, name: ${q(d.name)} },`).join('\n')}
];

/** Municipios: [código DANE de 5 dígitos, nombre]. Los 2 primeros dígitos son el departamento. */
export const MUNICIPALITIES: readonly (readonly [string, string])[] = [
${municipalities.map(([c, n]) => `  [${q(c)}, ${q(n)}],`).join('\n')}
];

/** Ids del catálogo anterior de RODEXA Carro → código DANE (para que nadie pierda su ciudad). */
export const LEGACY_CITY_IDS: Readonly<Record<string, string>> = {
${Object.entries(legacy).map(([id, code]) => `  ${q(id)}: ${q(code)},`).join('\n')}
};
`;
  writeFileSync(OUT, out, 'utf8');
  console.log(`Listo: ${deps.length} departamentos, ${municipalities.length} municipios, ${Object.keys(legacy).length} de ${LEGACY_CITIES.length} ciudades viejas emparejadas.`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
