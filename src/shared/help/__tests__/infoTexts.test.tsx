/** Botón ⓘ: explicaciones cortas, solo al tocarlo, sin datos técnicos inventados. */
import { act, create } from 'react-test-renderer';
import { Alert } from 'react-native';

import { MAINTENANCE_ITEMS, maintenanceHintsText } from '@/features/maintenance/catalog';
import { StatTile } from '@/features/stats/components/StatTile';
import { Field } from '@/shared/ui/Field';
import { InfoButton } from '@/shared/ui/InfoButton';
import { SectionHeader } from '@/shared/ui/SectionHeader';

import {
  INFO_CARE_SCORE,
  INFO_COST_PER_KM_MONTH,
  INFO_COST_PER_KM_YEAR,
  INFO_FULL,
  INFO_MAINTENANCE_STATUS,
  infoConsumption,
} from '../infoTexts';

describe('InfoButton', () => {
  it('al tocarlo abre una ventana con el título, la explicación y "Entendido"', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<InfoButton title="Costo por km" message="Explicación" />);
    });
    const button = tree.root.findByProps({ accessibilityLabel: 'Qué significa: Costo por km' });
    expect(button.props.hitSlop).toBe(10);
    act(() => button.props.onPress());
    // Sin la ventana propia montada (en la prueba), se usa la del sistema con los mismos datos.
    expect(alert).toHaveBeenCalledWith('Costo por km', 'Explicación', [{ text: 'Entendido' }], undefined);
    alert.mockRestore();
  });

  it('sin `info`, Field, SectionHeader y StatTile no muestran ⓘ', () => {
    const count = (el: React.ReactElement) => {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(el);
      });
      return tree.root.findAllByType(InfoButton).length;
    };
    expect(count(<Field label="Nombre">{null}</Field>)).toBe(0);
    expect(count(<SectionHeader title="Mantenimiento" />)).toBe(0);
    expect(count(<StatTile icon="expense" label="Total" value="$1" />)).toBe(0);
    expect(count(<Field label="¿Llenaste el tanque?" info={INFO_FULL.fuel}>{null}</Field>)).toBe(1);
    expect(count(<SectionHeader title="Mantenimiento" info={INFO_MAINTENANCE_STATUS} />)).toBe(1);
    expect(count(<StatTile icon="expense" label="Costo por km" info={INFO_COST_PER_KM_MONTH} />)).toBe(1);
  });
});

describe('textos del ⓘ', () => {
  const all = [
    INFO_COST_PER_KM_MONTH,
    INFO_COST_PER_KM_YEAR,
    INFO_CARE_SCORE,
    INFO_MAINTENANCE_STATUS,
    INFO_FULL.fuel!,
    INFO_FULL.cng!,
    infoConsumption('fuel'),
    infoConsumption('cng'),
    infoConsumption('charge'),
  ];

  it('cortos y sin precios', () => {
    for (const info of all) {
      expect(info.message.length).toBeLessThan(420);
      expect(info.message).not.toMatch(/\$/);
    }
  });

  it('dicen lo que REALMENTE calcula la app', () => {
    expect(INFO_COST_PER_KM_MONTH.message).toMatch(/100 km/); // MIN_KM_FOR_COST_PER_KM
    expect(INFO_CARE_SCORE.message).toMatch(/50 puntos[\s\S]*30[\s\S]*20/); // WEIGHTS
    expect(INFO_MAINTENANCE_STATUS.message).toMatch(/15 %/); // WARN_RATIO
    expect(infoConsumption('charge').message).toMatch(/mismo porcentaje/);
  });
});

describe('explicaciones de los mantenimientos', () => {
  const items = MAINTENANCE_ITEMS;
  const hinted = items.filter((i) => i.hint);

  it('una línea, sin intervalos, precios ni consejos', () => {
    expect(hinted.length).toBeGreaterThan(30);
    for (const { label, hint } of hinted) {
      expect(`${label}: ${hint}`).not.toMatch(/\n/);
      expect(hint!.length).toBeLessThanOrEqual(130);
      expect(hint).not.toMatch(/\$|cada \d|\d+\s?(km|meses|años)|deberías|recomend|cámbial/i);
    }
  });

  it('los nombres obvios no tienen explicación', () => {
    for (const code of ['oil', 'battery', 'tire_front', 'tire_rear', 'wipers', 'headlight_bulb', 'horn']) {
      expect(items.find((i) => i.code === code)?.hint).toBeUndefined();
    }
  });

  it('el ⓘ de una categoría lista "Nombre: explicación", una por párrafo; sin explicaciones no hay ⓘ', () => {
    const text = maintenanceHintsText([
      { label: 'Rótulas', hint: 'Uniones de la rueda.' },
      { label: 'Resortes' },
      { label: 'Bujes', hint: 'Piezas de caucho.' },
    ]);
    expect(text).toBe('Rótulas: Uniones de la rueda.\n\nBujes: Piezas de caucho.');
    expect(maintenanceHintsText([{ label: 'Aceite de motor' }])).toBeUndefined();
  });
});
