import { router } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import type { DocumentSummary } from '@/features/cars/types';
import { DocumentRow } from '@/features/documents/components/DocumentRow';
import { needsAttention } from '@/features/documents/summary';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, SectionHeader } from '@/shared/ui';

/**
 * Documentos del carro, organizados: primero lo que requiere atención, después lo
 * que está al día y lo que falta registrar. Es una herramienta de organización:
 * las fechas son las que registra el usuario.
 */
export default function DocumentsScreen() {
  const styles = useStyles();
  const { documents } = useAppData();
  const groups: { title: string; items: DocumentSummary[] }[] = [
    { title: 'Requieren atención', items: documents.filter(needsAttention) },
    { title: 'Al día', items: documents.filter((d) => d.records > 0 && !needsAttention(d)) },
    { title: 'Sin registrar', items: documents.filter((d) => d.records === 0) },
  ];

  return (
    <FormScreen
      title="Documentos"
      closeIcon="back"
      footer={
        <Button label="Agregar documento" icon="add" fullWidth onPress={() => router.push('/registrar/documento')} />
      }>
      <AppText tone="secondary">
        Tus documentos en un solo lugar. RODEXA te avisa antes de las fechas que registras.
      </AppText>
      {groups
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <View key={group.title}>
            <SectionHeader title={group.title} />
            <Card flush>
              {group.items.map((doc, index) => (
                <Fragment key={doc.key}>
                  {index > 0 && <View style={styles.divider} />}
                  <DocumentRow doc={doc} />
                </Fragment>
              ))}
            </Card>
          </View>
        ))}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  // Mismo separador que las filas de Mi carro.
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
}));
