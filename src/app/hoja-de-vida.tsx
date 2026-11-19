import { Share, View } from 'react-native';

import { buildLifeRecord, LIFE_RECORD_DISCLAIMER, lifeRecordText } from '@/features/cars/lifeRecord';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import { useProAccess } from '@/features/pro/access';
import { ProGate } from '@/features/pro/components/ProGate';
import { PRO_FEATURES } from '@/features/pro/config';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, InfoRow, SectionHeader } from '@/shared/ui';
import { today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

/** Hoja de vida del carro: datos, mantenimientos en orden, documentos y repuestos que usa. */
const FEATURE = PRO_FEATURES.find((f) => f.key === 'life_record')!;

/** Lo que incluye (se muestra en la versión gratis, con el aviso de Pro). */
const POINTS = [
  'Datos del carro: placa, energía, chasis y motor',
  'Todos los mantenimientos en orden, con fecha, km, costo y notas',
  'Documentos registrados y sus vencimientos',
  'Repuestos que usa tu carro (aceite, llantas, filtros…)',
  'Compártela por WhatsApp o correo, por ejemplo al vender tu carro',
];

/** Hoja de vida del carro (solo RODEXA Pro). */
export default function LifeRecordScreen() {
  const { isPro } = useProAccess();
  const data = useAppData();
  const { carSheet } = useSession();
  const record = buildLifeRecord(data, carSheet, (code) => maintenanceLabel(code as never));
  const share = () => Share.share({ message: lifeRecordText(record, today()) }).catch(() => {});

  return (
    <FormScreen
      title="Hoja de vida"
      closeIcon="back"
      footer={isPro ? <Button label="Compartir hoja de vida" icon="share" fullWidth onPress={share} /> : undefined}>
      <ProGate feature={FEATURE} points={POINTS}>
        <LifeRecordContent record={record} />
      </ProGate>
    </FormScreen>
  );
}

function LifeRecordContent({ record }: { record: ReturnType<typeof buildLifeRecord> }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.content}>
      <Card style={styles.header}>
        <View style={styles.icon}>
          <Icon name="receipt" size={28} color={colors.brand.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">{record.carName}</AppText>
          <AppText tone="secondary">Kilometraje registrado: {record.currentKm}</AppText>
        </View>
      </Card>

      <View>
        <SectionHeader title="Datos del carro" />
        <Card>
          {record.vehicle.map((r, i) => (
            <InfoRow key={r.label} label={r.label} value={r.value} divider={i > 0} />
          ))}
        </Card>
      </View>

      <View>
        <SectionHeader
          title={`Mantenimientos (${record.serviceCount})`}
          caption={record.serviceTotalCop > 0 ? `${formatCop(record.serviceTotalCop)} registrados` : undefined}
        />
        <Card>
          {record.services.length === 0 ? (
            <AppText tone="secondary">Aún no hay mantenimientos registrados.</AppText>
          ) : (
            record.services.map((s, i) => (
              <View key={`${s.date}-${i}`} style={[styles.service, i > 0 && styles.divider]}>
                <View style={styles.dot} />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{s.title}</AppText>
                  <AppText variant="caption" tone="secondary" numeric>
                    {s.date} · {s.km}
                    {s.cost ? ` · ${s.cost}` : ''}
                  </AppText>
                  {s.note && (
                    <AppText variant="caption" tone="muted">
                      {s.note}
                    </AppText>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>
      </View>

      {record.documents.length > 0 && (
        <View>
          <SectionHeader title="Documentos" />
          <Card>
            {record.documents.map((d, i) => (
              <InfoRow key={`${d.title}-${i}`} label={`${d.title} · ${d.date}`} value={d.detail} divider={i > 0} />
            ))}
          </Card>
        </View>
      )}

      {record.parts.length > 0 && (
        <View>
          <SectionHeader title="Repuestos que usa" />
          <Card>
            {record.parts.map((p, i) => (
              <InfoRow key={p.label} label={p.label} value={p.value} divider={i > 0} />
            ))}
          </Card>
        </View>
      )}

      <View style={styles.note}>
        <Icon name="info" size={18} color={colors.text.secondary} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          {LIFE_RECORD_DISCLAIMER}
        </AppText>
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  content: {
    gap: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  service: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    backgroundColor: colors.brand.primary,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
}));
