import { router } from 'expo-router';
import { useState } from 'react';

import { openEmailDraft, suggestionDraft } from '@/features/help/email';
import { useT } from '@/i18n';
import { Button, Field, FormScreen, TextField, useToast } from '@/shared/ui';

/** Sugerir una mejora: prepara un correo (no se guarda ni se envía solo). */
export default function SuggestImprovementScreen() {
  const t = useT();
  const toast = useToast();
  const [idea, setIdea] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && idea.trim() === '' ? 'Escribe tu idea.' : undefined;

  const send = async () => {
    setSubmitted(true);
    if (idea.trim() === '') return;
    const opened = await openEmailDraft(suggestionDraft(idea), () => toast.show(t('help.emailCopied')));
    if (opened) router.back();
  };

  return (
    <FormScreen
      title="Sugerir una mejora"
      closeIcon="back"
      footer={<Button label="Enviar sugerencia" icon="suggest" fullWidth onPress={send} />}>
      <Field label="Describe tu idea" error={error}>
        <TextField
          value={idea}
          onChange={setIdea}
          placeholder="Escribe tu sugerencia…"
          multiline
          invalid={!!error}
          accessibilityLabel="Tu sugerencia"
        />
      </Field>
    </FormScreen>
  );
}
