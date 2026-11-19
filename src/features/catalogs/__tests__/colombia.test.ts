/** Departamentos y municipios oficiales (DIVIPOLA del DANE) y ciudades del catálogo anterior. */
import { DEPARTMENTS, LEGACY_CITY_IDS, MUNICIPALITIES } from '../data/colombia';
import { findCity, getDepartments, getMunicipalities } from '../repository';

describe('datos oficiales', () => {
  it('33 departamentos y 1.122 municipios', () => {
    expect(getDepartments()).toHaveLength(33);
    expect(MUNICIPALITIES).toHaveLength(1122);
  });

  it('códigos únicos de 5 dígitos, cada uno de un departamento existente', () => {
    const codes = MUNICIPALITIES.map(([code]) => code);
    expect(new Set(codes).size).toBe(codes.length);
    const departmentCodes = new Set(DEPARTMENTS.map((d) => d.code));
    for (const code of codes) {
      expect(code).toMatch(/^\d{5}$/);
      expect(departmentCodes.has(code.slice(0, 2))).toBe(true);
    }
  });

  it('departamentos en orden alfabético', () => {
    const names = getDepartments().map((d) => d.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
  });

  it('nombres legibles y especiales', () => {
    const departments = getDepartments().map((d) => d.name);
    expect(departments).toEqual(
      expect.arrayContaining(['Norte de Santander', 'Valle del Cauca', 'Bogotá D.C.', 'San Andrés y Providencia', 'La Guajira']),
    );
    expect(findCity('05001')?.name).toBe('Medellín');
    expect(findCity('11001')?.name).toBe('Bogotá D.C.');
    expect(findCity('76001')?.name).toBe('Cali');
    expect(findCity('54001')?.name).toBe('Cúcuta');
    expect(findCity('13001')?.name).toBe('Cartagena');
    expect(findCity('76111')?.name).toBe('Buga');
    expect(findCity('52835')?.name).toBe('Tumaco');
    // Ningún nombre queda en mayúsculas sostenidas (salvo siglas como D.C.).
    expect(MUNICIPALITIES.filter(([, name]) => /[A-ZÁÉÍÓÚÑ]{4,}/.test(name))).toEqual([]);
  });
});

describe('municipios por departamento', () => {
  it('Tolima (73) trae solo los de Tolima, incluye Ibagué y vienen en orden alfabético', () => {
    const tolima = getMunicipalities('73');
    expect(tolima.length).toBeGreaterThan(40);
    expect(tolima.every((m) => m.departmentCode === '73' && m.department === 'Tolima')).toBe(true);
    expect(tolima.map((m) => m.name)).toContain('Ibagué');
    const names = tolima.map((m) => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
  });

  it('sin departamento → lista vacía (nunca los 1.122 de una vez)', () => {
    expect(getMunicipalities(null)).toEqual([]);
    expect(getMunicipalities('')).toEqual([]);
    expect(getMunicipalities(undefined)).toEqual([]);
  });
});

describe('que nadie pierda su ciudad', () => {
  it('las 75 ciudades del catálogo anterior se siguen reconociendo', () => {
    expect(Object.keys(LEGACY_CITY_IDS)).toHaveLength(75);
    for (const [legacyId, code] of Object.entries(LEGACY_CITY_IDS)) {
      expect(findCity(legacyId)?.id).toBe(code);
    }
    expect(findCity('medellin')).toEqual({ id: '05001', name: 'Medellín', department: 'Antioquia', departmentCode: '05' });
    expect(findCity('bogota')?.name).toBe('Bogotá D.C.');
    expect(findCity('rionegro')?.department).toBe('Antioquia');
    expect(findCity('armenia')?.department).toBe('Quindío');
  });

  it('el departamento sale de los 2 primeros dígitos del código', () => {
    expect(findCity('73001')).toMatchObject({ departmentCode: '73', department: 'Tolima' });
  });

  it('un id desconocido o vacío → undefined (nunca se inventa un municipio)', () => {
    expect(findCity('no-existe')).toBeUndefined();
    expect(findCity('99999')).toBeUndefined();
    expect(findCity('')).toBeUndefined();
    expect(findCity(null)).toBeUndefined();
    expect(findCity(undefined)).toBeUndefined();
    expect(findCity('other')).toBeUndefined(); // "Otro municipio": se muestra el texto guardado
  });
});
