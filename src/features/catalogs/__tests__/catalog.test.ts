/** Integridad del catálogo de marcas y modelos. */
import { CAR_BRANDS } from '../data/carBrands';
import { CAR_MODELS } from '../data/carModels';

describe('catálogo de carros', () => {
  it('ids únicos de marcas y modelos', () => {
    expect(new Set(CAR_BRANDS.map((b) => b.id)).size).toBe(CAR_BRANDS.length);
    expect(new Set(CAR_MODELS.map((m) => m.id)).size).toBe(CAR_MODELS.length);
  });

  it('cada modelo pertenece a una marca del catálogo y cada marca tiene modelos', () => {
    const brands = new Set(CAR_BRANDS.map((b) => b.id));
    expect(CAR_MODELS.filter((m) => !brands.has(m.brandId))).toEqual([]);
    expect(CAR_BRANDS.filter((b) => !CAR_MODELS.some((m) => m.brandId === b.id))).toEqual([]);
  });

  it('incluye Foton, Brilliance y los modelos nuevos de JAC', () => {
    const names = (brandId: string) => CAR_MODELS.filter((m) => m.brandId === brandId).map((m) => m.name);
    expect(names('brilliance')).toEqual(['V3', 'V5', 'V6']);
    expect(names('foton')).toEqual(['Tunland', 'View']);
    expect(names('jac')).toEqual(expect.arrayContaining(['JS2', 'JS2 Pro', 'JS3', 'JS4', 'E10X', 'E30X', 'E-J7']));
  });
});
