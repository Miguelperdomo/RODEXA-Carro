import { router } from 'expo-router';
import { useState } from 'react';

import { openEmailDraft, reportDraft } from '@/features/help/email';
import { useT } from '@/i18n';
import { Button, Field, FormScreen, TextField, useToast } from '@/shared/ui';

/** Reportar un problema: prepara un correo (no se guarda ni se envía solo). */
export default function ReportProblemScreen() {
  const t = useT();
  const toast = useToast();
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && problem.trim() === '' ? 'Describe el problema que encontraste.' : undefined;

  const send = async () => {
    setSubmitted(true);
    if (problem.trim() === '') return;
    const opened = await openEmailDraft(reportDraft(problem, context), () => toast.show(t('help.emailCopied')));
    if (opened) router.back();
  };

  return (
    <FormScreen
      title="Reportar un problema"
      closeIcon="back"
      footer={<Button label="Enviar reporte" icon="bug" fullWidth onPress={send} />}>
      <Field label="¿Qué problema encontraste?" error={error}>
        <TextField
          value={problem}
          onChange={setProblem}
          placeholder="Describe el problema…"
          multiline
          invalid={!!error}
          accessibilityLabel="Problema encontrado"
        />
      </Field>
      <Field label="¿Qué estabas haciendo cuando ocurrió?" optional>
        <TextField
          value={context}
          onChange={setContext}
          placeholder="Describe qué estabas haciendo…"
          multiline
          accessibilityLabel="Qué estabas haciendo"
        />
      </Field>
    </FormScreen>
  );
}
