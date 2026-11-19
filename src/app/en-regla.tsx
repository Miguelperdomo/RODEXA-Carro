import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { DocumentRow } from '@/features/documents/components/DocumentRow';
import { ROAD_KIT } from '@/features/law/values';
import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, SectionHeader } from '@/shared/ui';

/** Documentos que pide la ley para manejar un carro. */
const REQUIRED = ['soat', 'rtm', 'license'] as const;

/**
 * "¿Estoy en regla?": los documentos que te pueden pedir (SOAT, revisión técnico-mecánica y
 * licencia) y lo que la ley pide llevar en el carro (art. 30 de la Ley 769 de 2002). Lo que llevas
 * lo marcas tú: RODEXA no lo revisa.
 */
export default function ComplianceScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { documents } = useAppData();
  const { settings, update } = useSettings();
  const docs = REQUIRED.flatMap((type) => documents.filter((d) => d.type === type));
  const problems = docs.filter((d) => d.status === 'due' || d.status === 'nodata');
  const kit = settings.roadKit.split(',').filter(Boolean);
  const missingKit = ROAD_KIT.filter((k) => !kit.includes(k.key));
  const ok = problems.length === 0 && missingKit.length === 0;

  const toggle = (key: string) =>
    update({ roadKit: (kit.includes(key) ? kit.filter((k) => k !== key) : [...kit, key]).join(',') });

  return (
    <FormScreen title="¿Estoy en regla?" closeIcon="back">
      <Card tone={ok ? 'default' : 'highlight'}>
        <View style={styles.row}>
          <Icon name={ok ? 'statusOk' : 'warning'} color={ok ? colors.status.ok.color : colors.status.soon.color} />
          <AppText variant="bodyStrong" style={styles.flex}>
            {ok
              ? 'Todo en regla según lo que registraste'
              : [
                  problems.length > 0 ? `${problems.length} ${problems.length === 1 ? 'documento por revisar' : 'documentos por revisar'}` : '',
                  missingKit.length > 0 ? `${missingKit.length} ${missingKit.length === 1 ? 'elemento sin marcar' : 'elementos sin marcar'}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
          </AppText>
        </View>
      </Card>

      <View>
        <SectionHeader title="Documentos" caption="Te los pueden pedir en un control" />
        <Card flush>
          {docs.map((doc, i) => (
            <Fragment key={doc.key}>
              {i > 0 && <View style={styles.divider} />}
              <DocumentRow doc={doc} />
            </Fragment>
          ))}
        </Card>
      </View>

      <View>
        <SectionHeader title="Lo que debe llevar el carro" caption="Marca lo que llevas" />
        <Card flush>
          {ROAD_KIT.map((item, i) => {
            const checked = kit.includes(item.key);
            return (
              <Fragment key={item.key}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  onPress={() => toggle(item.key)}
                  style={styles.kitRow}>
                  <Icon name={checked ? 'checkboxOn' : 'checkboxOff'} color={checked ? colors.brand.accent : colors.text.muted} />
                  <AppText style={styles.flex}>{item.label}</AppText>
                </Pressable>
              </Fragment>
            );
          })}
        </Card>
        <AppText variant="caption" tone="muted" style={styles.note}>
          Equipo de prevención y seguridad (artículo 30 de la Ley 769 de 2002), como lo enumera el Ministerio de Transporte.
          Revisa que el extintor y el botiquín no estén vencidos.
        </AppText>
      </View>

      <Button label="¿Me multaron?" icon="fine" variant="secondary" fullWidth onPress={() => router.push('/multas')} />
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  kitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  note: {
    marginTop: spacing.sm,
  },
}));
