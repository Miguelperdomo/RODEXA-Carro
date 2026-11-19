import { router } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import { buildComponentDetail, missingSummary } from '@/features/cars/componentDetail';
import { CareScoreCard } from '@/features/care/components/CareScoreCard';
import { CarHeader } from '@/features/cars/components/CarHeader';
import { SettingsButton } from '@/features/settings/components/SettingsButton';
import { OdometerCard } from '@/features/cars/components/OdometerCard';
import { needsEnergyConfirmation } from '@/features/cars/capabilities';
import { DocumentRow } from '@/features/documents/components/DocumentRow';
import { sheetFieldCount } from '@/features/parts/userSpecs';
import { budgetStatus, budgetSummary } from '@/features/budget/rules';
import { creditOf, creditProgress, creditShort } from '@/features/credit/credit';
import { INCOME_COPY } from '@/features/income/income';
import { statusOn, statusText } from '@/features/picoYPlaca/rules';
import { useSettings } from '@/features/settings/SettingsProvider';
import { weeklyStatusText } from '@/features/weeklyCheck/rules';
import { needsAttention } from '@/features/documents/summary';
import { documentStatusText } from '@/features/documents/presentation';
import type { ComponentCode } from '@/features/cars/types';
import { USAGE_LABELS } from '@/features/cars/usage';
import { vehicleInfoRows } from '@/features/cars/vehicleOptions';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, maintenanceStatusLabels, spacing } from '@/shared/theme';
import { INFO_MAINTENANCE_STATUS } from '@/shared/help/infoTexts';
import { openOfficialSite, type OfficialSite } from '@/features/emergency/officialLinks';
import { parkingLabel, sinceLabel } from '@/features/parking/parking';
import { useParking } from '@/features/parking/useParking';
import {
  ActionRow,
  AppText,
  Button,
  Card,
  CollapsibleGroup,
  InfoRow,
  QuickTiles,
  Screen,
  SectionHeader,
  StatusRow,
  useToast,
} from '@/shared/ui';
import { today } from '@/shared/utils/date';
import { AppSearch } from '@/features/search/components/AppSearch';

/** Documentos que se muestran en Mi carro (el resto en la pantalla Documentos). */
const DOCUMENTS_PREVIEW = 4;

const goDetail = (code: ComponentCode) =>
  router.push({ pathname: '/mi-carro/componente/[code]', params: { code } });
const goConfigure = (code: ComponentCode) =>
  router.push({ pathname: '/mi-carro/configurar/[code]', params: { code } });

export default function MyCarScreen() {
  const styles = useStyles();
  // Del primer ingreso o de demostración (mock); vendrán de SQLite en la etapa de datos reales.
  const { profile, odometer, components, documents, history, dashboard } = useAppData();
  const toast = useToast();
  const parked = useParking();
  // SIMIT y RUNT: solo se abre la página oficial (y se copia la placa para pegarla).
  const openSite = async (site: OfficialSite) =>
    toast.show((await openOfficialSite(site, profile.plate)) ?? 'No se pudo abrir la página. Intenta de nuevo.');
  const { carSheet, picoYPlaca, budget, recurringExpenses, customReminders, contacts } = useSession();
  const credit = creditOf(recurringExpenses);
  const activeReminders = customReminders.filter((r) => !r.doneAt).length;
  const { settings, update } = useSettings();
  const sheetCount = sheetFieldCount(carSheet);
  const now = today();
  // Grupos plegables: se recuerda cuáles dejó abiertos.
  const openGroups = settings.carOpenGroups.split(',').filter(Boolean);
  const isOpen = (key: string) => openGroups.includes(key);
  const toggle = (key: string) =>
    update({ carOpenGroups: (isOpen(key) ? openGroups.filter((k) => k !== key) : [...openGroups, key]).join(',') });
  // Resúmenes que se ven aunque el grupo esté cerrado.
  const due = components.filter((c) => c.enabled && c.status === 'due').length;
  const soon = components.filter((c) => c.enabled && c.status === 'soon').length;
  const maintenanceSummary =
    due > 0
      ? `${due} ${due === 1 ? 'pendiente' : 'pendientes'}`
      : soon > 0
        ? `${soon} ${soon === 1 ? 'próximo' : 'próximos'}`
        : 'Al día según tus registros';
  const attention = documents.filter(needsAttention);
  const documentsSummary = attention.length > 0 ? `${attention[0].title}: ${documentStatusText(attention[0])}` : 'Al día';

  return (
    <Screen scroll scrollToTopOnTab contentStyle={styles.content}>
      <CarHeader profile={profile} action={<SettingsButton />} />
      {/* "¿Qué quieres hacer?": encuentra cualquier pantalla escribiendo (sin tildes, perdona errores). */}
      <AppSearch />
      <CareScoreCard />

      <OdometerCard
        odometer={odometer}
        onUpdate={() => router.push('/registrar/kilometraje')}
      />

      {needsEnergyConfirmation(profile) && (
        <Card tone="highlight">
          <AppText variant="bodyStrong">Confirma el combustible o la energía de tu carro</AppText>
          <AppText tone="secondary">
            Con ese dato te mostramos solo los mantenimientos y registros que le aplican. Mientras
            tanto verás todos los posibles.
          </AppText>
          <View style={styles.cardAction}>
            <Button
              label="Confirmar ahora"
              variant="secondary"
              fullWidth
              onPress={() => router.push('/mi-carro/editar')}
            />
          </View>
        </Card>
      )}

      {/* Accesos rápidos: lo que más se usa, a un toque. */}
      <View>
        <SectionHeader title="Accesos rápidos" />
        <QuickTiles
          tiles={[
            { key: 'income', icon: 'income', label: 'Ingresos', onPress: () => router.push('/ingresos') },
            { key: 'credit', icon: 'loan', label: 'Crédito', onPress: () => router.push('/mi-carro/credito') },
            {
              key: 'calendar',
              icon: 'calendar',
              label: 'Calendario',
              onPress: () => router.push({ pathname: '/historial', params: { vista: 'calendario' } }),
            },
            { key: 'contacts', icon: 'contact', label: 'Contactos', onPress: () => router.push('/mi-carro/contactos') },
            { key: 'workshops', icon: 'workshop', label: 'Talleres', onPress: () => router.push('/talleres') },
            { key: 'parts', icon: 'parts', label: 'Repuestos', onPress: () => router.push('/mis-repuestos') },
          ]}
        />
      </View>

      {/* Ayuda en la vía: siempre a la vista (cuando hay un problema no hay que buscarla). */}
      <View>
        <SectionHeader title="Ayuda en la vía" />
        <QuickTiles
          tone="alert"
          tiles={[
            { key: 'accident', icon: 'emergency', label: 'Tuve un accidente', onPress: () => router.push('/emergencia') },
            { key: 'stranded', icon: 'tow', label: 'Me quedé varado', onPress: () => router.push('/varado') },
            { key: 'parking', icon: 'parking', label: '¿Dónde lo parqueé?', onPress: () => router.push('/parqueadero') },
          ]}
        />
        {parked && (
          <AppText variant="caption" tone="secondary" style={styles.parked}>
            Parqueado: {parkingLabel(parked)} · {sinceLabel(parked.at, new Date())}
          </AppText>
        )}
      </View>

      {/* Grupos plegables con resumen: recuerdan cómo los dejaste. */}
      <CollapsibleGroup
        title="Mantenimiento"
        icon="maintenance"
        summary={maintenanceSummary}
        open={isOpen('maintenance')}
        onToggle={() => toggle('maintenance')}>
        <View style={styles.groupNote}>
          <SectionHeader title="Estado" caption="Según tus registros" info={INFO_MAINTENANCE_STATUS} />
        </View>
        {components.map((component, index) => {
          const detail = buildComponentDetail(component, history, odometer.registeredKm, now);
          const missing = component.enabled && !detail.ready ? missingSummary(detail) : '';
          return (
            <Fragment key={component.code}>
              {index > 0 && <View style={styles.divider} />}
              <StatusRow
                status={component.status}
                title={component.title}
                icon={component.icon}
                statusLabel={component.enabled ? maintenanceStatusLabels[component.status] : 'Sin activar'}
                detail={!component.enabled ? component.detail : missing || component.detail}
                onPress={() => goDetail(component.code)}
              />
              {(missing || !component.enabled) && (
                <View style={styles.rowAction}>
                  <Button
                    label={component.enabled ? 'Completar datos' : 'Activar'}
                    icon={component.enabled ? 'note' : 'add'}
                    variant="secondary"
                    onPress={() => goConfigure(component.code)}
                  />
                </View>
              )}
            </Fragment>
          );
        })}
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Documentos"
        icon="document"
        summary={documentsSummary}
        open={isOpen('documents')}
        onToggle={() => toggle('documents')}>
        {/* Lista corta: primero lo que requiere atención. El resto, en "Ver todos". */}
        {[...attention, ...documents.filter((d) => !needsAttention(d))].slice(0, DOCUMENTS_PREVIEW).map((doc, index) => (
          <Fragment key={doc.key}>
            {index > 0 && <View style={styles.divider} />}
            <DocumentRow doc={doc} />
          </Fragment>
        ))}
        <View style={styles.groupAction}>
          <Button
            label={`Ver todos los documentos (${documents.length})`}
            variant="secondary"
            fullWidth
            onPress={() => router.push('/documentos')}
          />
        </View>
        <View style={styles.divider} />
        <ActionRow
          icon="statusOk"
          label="¿Estoy en regla?"
          description="Documentos y lo que debe llevar el carro"
          onPress={() => router.push('/en-regla')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="receipt"
          label="¿Me multaron?"
          description="Paga con descuento: cuenta los días hábiles"
          onPress={() => router.push('/multas')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="info"
          label="Ley de tránsito"
          description="Multas e inmovilización más comunes"
          onPress={() => router.push('/ley-transito')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="paperwork"
          label="Guía de traspaso"
          description="Vender o comprar un carro usado"
          onPress={() => router.push('/traspaso')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="fine"
          label="Consultar multas (SIMIT)"
          description="Abre la página oficial y copia tu placa"
          onPress={() => void openSite('simit')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="inspection"
          label="SOAT y tecnomecánica en el RUNT"
          description="Abre la consulta oficial y copia tu placa"
          onPress={() => void openSite('runt')}
        />
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Mi dinero"
        icon="expense"
        summary={budgetSummary(budgetStatus(budget, dashboard.month.totalCop))}
        open={isOpen('money')}
        onToggle={() => toggle('money')}>
        <ActionRow
          icon="expense"
          label="Presupuesto mensual"
          description={budgetSummary(budgetStatus(budget, dashboard.month.totalCop))}
          onPress={() => router.push('/mi-carro/presupuesto')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="calendar"
          label="Gastos que se repiten"
          description={
            recurringExpenses.length > 0
              ? `${recurringExpenses.length} ${recurringExpenses.length === 1 ? 'gasto' : 'gastos'} cada mes`
              : 'Garaje, cuota del crédito, seguro…'
          }
          onPress={() => router.push('/mi-carro/gastos-fijos')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="loan"
          label="Crédito del carro"
          description={credit ? creditShort(creditProgress(credit, history, today())) : 'Cuotas, avisos y cuándo terminas'}
          onPress={() => router.push('/mi-carro/credito')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="income"
          label="Ingresos de mi carro"
          description={INCOME_COPY.rowDescription}
          onPress={() => router.push('/ingresos')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="stats"
          label="¿Cuánto me ahorro en carro?"
          description="Frente al transporte público, con tus gastos reales"
          onPress={() => router.push('/ahorro')}
        />
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Para no olvidar"
        icon="notifications"
        summary={`Pico y placa: ${statusText(statusOn(picoYPlaca, today()))}`}
        open={isOpen('remember')}
        onToggle={() => toggle('remember')}>
        <ActionRow
          icon="notifications"
          label="Recordatorios"
          description={
            activeReminders > 0
              ? `${activeReminders} ${activeReminders === 1 ? 'recordatorio activo' : 'recordatorios activos'}`
              : 'Lo que quieras, por fecha o por kilometraje'
          }
          onPress={() => router.push('/mi-carro/recordatorios')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="calendar"
          label="Pico y placa"
          description={statusText(statusOn(picoYPlaca, today()))}
          onPress={() => router.push('/mi-carro/pico-y-placa')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="checklist"
          label="Revisión semanal"
          description={weeklyStatusText(settings, today())}
          onPress={() => router.push('/revision-semanal')}
        />
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Servicios"
        icon="workshop"
        summary="Talleres, CDA y repuestos"
        open={isOpen('services')}
        onToggle={() => toggle('services')}>
        <ActionRow
          icon="workshop"
          label="Talleres y servicios"
          description="Talleres, servicios a domicilio y CDA en tu ciudad"
          onPress={() => router.push('/talleres')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="partsCatalog"
          label="Repuestos de mi carro"
          description="Marca, referencia y última compra · pídelos por WhatsApp"
          onPress={() => router.push('/mis-repuestos')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="partner"
          label="¿Ofreces un servicio para carros?"
          description="Taller, servicio a domicilio o CDA: inscríbelo en RODEXA"
          onPress={() => router.push('/inscribir')}
        />
      </CollapsibleGroup>

      <CollapsibleGroup title="Mi carro" icon="car" summary="Datos, ficha y contactos" open={isOpen('car')} onToggle={() => toggle('car')}>
        <View style={styles.groupBody}>
          {vehicleInfoRows(profile).map((row, index) => (
            <InfoRow key={row.key} label={row.label} value={row.value} divider={index > 0} />
          ))}
          <InfoRow label="Uso principal" value={profile.usageType ? USAGE_LABELS[profile.usageType] : undefined} divider />
          <View style={styles.cardAction}>
            <Button label="Editar información" icon="note" variant="secondary" fullWidth onPress={() => router.push('/mi-carro/editar')} />
          </View>
        </View>
        <View style={styles.divider} />
        <ActionRow
          icon="note"
          label="Ficha del carro"
          description={
            sheetCount > 0
              ? `Datos del carro · ${sheetCount} ${sheetCount === 1 ? 'dato anotado' : 'datos anotados'}`
              : 'Datos del carro y lo que quieras anotar'
          }
          onPress={() => router.push('/mi-carro/ficha')}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="phone"
          label="Mis contactos del carro"
          description={
            contacts.length > 0
              ? `${contacts.length} ${contacts.length === 1 ? 'contacto' : 'contactos'} · llama con un toque`
              : 'Mecánico, aseguradora, grúa, lavadero'
          }
          onPress={() => router.push('/mi-carro/contactos')}
        />
      </CollapsibleGroup>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({
  content: {
    gap: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  cardAction: {
    marginTop: spacing.md,
  },
  parked: {
    marginTop: spacing.sm,
  },
  groupNote: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  groupBody: {
    padding: spacing.lg,
  },
  groupAction: {
    padding: spacing.lg,
  },
  rowAction: {
    paddingLeft: 68,
    paddingRight: spacing.lg,
    paddingBottom: spacing.md,
    marginTop: -spacing.xs,
  },
}));
