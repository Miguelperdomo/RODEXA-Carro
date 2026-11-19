import { View } from 'react-native';

import { createStyles, spacing } from '@/shared/theme';
import { AppText, FormScreen } from '@/shared/ui';

import type { LegalBlock, LegalDocument } from '../documents';

/** Párrafo con negritas marcadas como `**texto**`. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <AppText tone="secondary">
      {parts.map((part, index) =>
        // Las posiciones impares son lo que estaba entre ** **.
        index % 2 === 1 ? (
          <AppText key={index} variant="bodyStrong">
            {part}
          </AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

function Block({ block }: { block: LegalBlock }) {
  const styles = useStyles();
  if (block.kind === 'paragraph') return <RichText text={block.text} />;
  return (
    <View style={styles.list}>
      {block.items.map((item) => (
        <View key={item} style={styles.listItem}>
          <AppText tone="secondary">•</AppText>
          <View style={styles.flex}>
            <RichText text={item} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Pantalla de lectura de un documento legal (términos, privacidad, licencias). */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const styles = useStyles();

  return (
    <FormScreen title={document.screenTitle} closeIcon="back">
      <View style={styles.group}>
        <AppText variant="title">{document.title}</AppText>
        {document.updated && (
          <AppText variant="caption" tone="muted">
            {document.updated}
          </AppText>
        )}
      </View>

      {document.intro.length > 0 && (
        <View style={styles.group}>
          {document.intro.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </View>
      )}

      {document.sections.map((section) => (
        <View key={section.heading} style={styles.group}>
          <AppText variant="heading">{section.heading}</AppText>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </View>
      ))}

      {document.signature && (
        <View style={styles.signature}>
          {document.signature.map((line) => (
            <AppText key={line} variant="bodyStrong" align="center">
              {line}
            </AppText>
          ))}
        </View>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  flex: {
    flex: 1,
  },
  group: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  signature: {
    gap: 2,
    paddingTop: spacing.sm,
  },
}));
