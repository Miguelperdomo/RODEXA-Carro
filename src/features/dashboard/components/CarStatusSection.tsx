import { router } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import { createStyles, documentStatusLabels, maintenanceStatusLabels, spacing } from '@/shared/theme';
import { Button, Card, SectionHeader, StatusRow } from '@/shared/ui';

import type { StatusItem } from '../types';

type CarStatusSectionProps = {
  items: StatusItem[];
};

/** "Estado de mi carro": las filas llegan ya ordenadas (🔴 → 🟡 → ⚪ → 🟢 → ▫️). */
export function CarStatusSection({ items }: CarStatusSectionProps) {
  const styles = useStyles();
  return (
    <View>
      <SectionHeader title="Estado de mi carro" caption="Según tus registros" />
      <Card flush>
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 && <View style={styles.divider} />}
            <StatusRow
              status={item.status}
              title={item.title}
              icon={item.icon}
              statusLabel={
                item.kind === 'document'
                  ? documentStatusLabels[item.status]
                  : maintenanceStatusLabels[item.status]
              }
              detail={item.detail}
              onPress={() => router.push(item.href)}
            />
          </Fragment>
        ))}
        <View style={styles.divider} />
        <View style={styles.footer}>
          <Button
            label="Controlar otro componente"
            icon="add"
            variant="ghost"
            onPress={() => router.push('/carro')}
          />
        </View>
      </Card>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
}));
