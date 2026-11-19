/** Fase 21: política de privacidad con los datos opcionales nuevos (texto aprobado). */
import { PRIVACY_POLICY } from '../documents';

const text = JSON.stringify(PRIVACY_POLICY);
const section = (start: string) => {
  const s = PRIVACY_POLICY.sections.find((x) => x.heading.startsWith(start));
  return JSON.stringify(s);
};

describe('política de privacidad (Fase 21)', () => {
  it('sección 1: ingresos, crédito, comparendos, repuestos y contactos, solo en el dispositivo', () => {
    const s1 = section('1.');
    expect(s1).toContain('los ingresos que genera con su carro');
    expect(s1).toContain('los datos de un crédito o leasing del vehículo (valor de la cuota, número de cuotas y día de pago)');
    expect(s1).toContain('los comparendos que reciba (fecha, número y valor)');
    expect(s1).toContain('los repuestos que usa su carro (marca, referencia y última compra)');
    expect(s1).toContain('Esta información se guarda únicamente en el dispositivo.');
  });

  it('sección 5: no se conecta con entidades; los enlaces abren apps externas; los correos los envía el usuario', () => {
    const s5 = section('5.');
    expect(s5).toContain('no se conecta con entidades financieras, aseguradoras, el SIMIT, el RUNT');
    expect(s5).toContain('RODEXA Carro no envía información por su cuenta');
    expect(s5).toContain('solo preparan un correo electrónico que el usuario revisa y decide si envía');
    expect(s5).toContain('no comparte datos entre ellas');
  });

  it('la foto de la tarjeta de propiedad todavía no se menciona (esa función aún no existe)', () => {
    expect(text).not.toMatch(/tarjeta de propiedad/);
    expect(text).not.toMatch(/No leyó bien tu foto/);
  });
});
