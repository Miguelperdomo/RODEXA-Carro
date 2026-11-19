import type { Language } from '@/features/settings/types';

type Localized = Record<Language, string>;

export type FaqItem = { id: string; question: Localized; answer: Localized };

/** Preguntas frecuentes. Describen lo que la app hace hoy (sin prometer funciones futuras). */
export const FAQ: FaqItem[] = [
  // ——— Antes de empezar (se ven también desde la bienvenida, antes de registrar el carro) ———
  {
    id: 'free',
    question: { es: '¿RODEXA Carro es gratis?', en: 'Is RODEXA Carro free?' },
    answer: {
      es: 'Sí. Todas las funciones que ves hoy en la app son gratis. No pide tarjeta, cuenta ni correo.',
      en: 'Yes. Every feature you see in the app today is free. No card, account or email needed.',
    },
  },
  {
    id: 'account-internet',
    question: { es: '¿Necesito crear una cuenta o tener internet?', en: 'Do I need an account or internet?' },
    answer: {
      es: 'No necesitas cuenta, correo ni contraseña. La app funciona sin internet: tus datos se guardan en tu celular. Solo algunas cosas usan internet, como abrir la consulta oficial del pico y placa, el correo de soporte o compartir la app.',
      en: 'You don’t need an account, email or password. The app works offline: your data is saved on your phone. Only a few things use the internet, like opening the official “pico y placa” lookup, the support email or sharing the app.',
    },
  },
  {
    id: 'new-phone',
    question: { es: '¿Qué pasa si cambio de celular?', en: 'What if I change phones?' },
    answer: {
      es: 'En tu celular de antes, entra a Configuración → Copia de seguridad y toca «Guardar copia en el celular». Se guarda un archivo «RODEXA-Carro-copia-fecha.rodexa» donde elijas (Descargas o Google Drive); pásalo al celular nuevo por Drive, cable o Quick Share. En el celular nuevo, instala RODEXA Carro y en la bienvenida toca «Ya tenía RODEXA: recuperar mi copia» y elige el archivo: entras directo con tu carro y tus registros. Las fotos (del carro y del parqueadero) y las preferencias de la app no van en la copia: puedes volver a ponerlas.',
      en: 'On your old phone, go to Settings → Backup and tap “Save backup on the phone”. A file “RODEXA-Carro-copia-date.rodexa” is saved wherever you choose (Downloads or Google Drive); move it to the new phone via Drive, cable or Quick Share. On the new phone, install RODEXA Carro, tap “I already had RODEXA: restore my backup” on the welcome screen and pick the file: you go straight in with your car and records. Photos (of your car and parking spot) and app preferences aren’t included: you can add them again.',
    },
  },
  {
    id: 'permissions',
    question: { es: '¿Qué permisos pide la app y por qué?', en: 'Which permissions does the app ask for and why?' },
    answer: {
      es: 'Notificaciones: para avisarte del aceite, los documentos y lo que configures (puedes decir que no). Cámara: solo si decides tomarle una foto a tu carro o al lugar donde lo parqueaste; es opcional y la app funciona igual sin ella. Para elegir una foto de la galería se usa el selector del celular, sin permiso adicional. Las fotos se guardan solo en tu celular. RODEXA Carro no pide tu ubicación, tus contactos ni el micrófono. Para llamar a tus contactos del carro se abre el marcador de tu celular con el número, sin permisos adicionales.',
      en: 'Notifications: to remind you about oil, documents and whatever you set up (you can say no). Camera: only if you choose to take a photo of your car or of where you parked it; it’s optional and the app works the same without it. Picking a photo from the gallery uses your phone’s picker, with no extra permission. Photos are saved only on your phone. RODEXA Carro doesn’t ask for your location, contacts or microphone. To call your car contacts, your phone’s dialer opens with the number, with no extra permissions.',
    },
  },
  {
    id: 'tranqui',
    question: { es: '¿Qué es el estilo Tranqui y en qué se diferencia de Al detalle?', en: 'What is the Tranqui style and how is it different from Detailed?' },
    answer: {
      es: 'Son dos formas de usar la app. En Tranqui te pedimos el kilometraje una vez al mes (o antes, si según tu ritmo un mantenimiento podría estar cerca), eliges si llevas el combustible (no llevarlo, un valor al mes o cada carga) y no te enviamos recordatorios de combustible, de días sin registrar ni de revisión semanal. Los avisos de mantenimiento y documentos siguen igual. En Al detalle registras cada carga y el kilometraje, y ves la actividad reciente y el resumen del mes en Inicio. Lo cambias cuando quieras en Configuración → Mi estilo, sin perder tus datos.',
      en: 'They are two ways to use the app. In Tranqui we ask for your mileage once a month (or sooner, if a service might be near based on your pace), you choose how to track fuel (not at all, one amount a month or every fill-up) and we don’t send fuel, inactivity or weekly check reminders. Maintenance and document reminders stay the same. In Detailed you log every fill-up and your mileage, and see recent activity and the monthly summary on Home. Change it anytime in Settings → My style without losing your data.',
    },
  },
  {
    id: 'first-car',
    question: { es: '¿Cómo registro mi primer carro?', en: 'How do I register my first car?' },
    answer: {
      es: 'La primera vez que abres RODEXA Carro, toca “Comenzar” y completa los pasos: tus datos, marca, modelo, año y cilindraje, uso principal y kilometraje. Después puedes cambiar todo en Mi carro → Editar información.',
      en: 'The first time you open RODEXA Carro, tap “Start” and complete the steps: your details, brand, model, year and engine size, main use and odometer. You can change everything later in My car → Edit information.',
    },
  },
  {
    id: 'maintenance',
    question: { es: '¿Cómo registro un mantenimiento?', en: 'How do I log maintenance?' },
    answer: {
      es: 'Toca el botón + de la barra inferior y elige “Mantenimiento”. Abre la categoría, marca qué se hizo e indica el kilometraje, la fecha y, si quieres, el costo. Si no recuerdas el kilometraje de ese momento, marca “No sé el kilometraje”: RODEXA Carro lo guarda como desconocido y no inventa ninguno.',
      en: 'Tap the + button in the bottom bar and choose “Maintenance”. Open the category, select what was done and enter the odometer, date and, optionally, the cost. If you don’t remember the odometer at that moment, check “No sé el kilometraje” (I don’t know the odometer): RODEXA Carro saves it as unknown and never makes one up.',
    },
  },
  {
    id: 'fuel',
    question: {
      es: '¿Cómo registro una carga de combustible o energía y cómo se calcula el consumo?',
      en: 'How do I log a fill-up or a charge and how is consumption calculated?',
    },
    answer: {
      es: 'Toca + y elige “Carga de combustible”, “Carga de GNC” o “Carga eléctrica” (solo aparecen los que usa tu carro). Escribe dos de estos tres datos: la cantidad, el precio por unidad o el total pagado, y RODEXA Carro calcula el tercero. El consumo se calcula solo entre registros comparables con kilometraje: dos tanques llenos (km/L), dos cargas completas de GNC (km/m³) o dos cargas eléctricas que terminaron en el mismo % (km/kWh). Si no hay datos suficientes, no se muestra un número inventado.',
      en: 'Tap + and choose “Tanqueo” (fill-up), “Carga de GNC” (CNG) or “Carga eléctrica” (charge); only the ones your car uses appear. Enter two of these three: quantity, unit price or total paid, and RODEXA Carro calculates the third. Consumption is only calculated between comparable records with odometer: two full tanks (km/L), two full CNG fills (km/m³) or two charges that ended at the same % (km/kWh). Without enough data, no made-up number is shown.',
    },
  },
  {
    id: 'odometer',
    question: { es: '¿Cómo actualizo el kilometraje?', en: 'How do I update the odometer?' },
    answer: {
      es: 'Toca + → “Kilometraje”, o “Actualizar kilometraje” en la tarjeta de tu carro en Inicio. Escribe lo que marca el tablero de tu carro, no el estimado.',
      en: 'Tap + → “Odometer”, or “Update odometer” on your car card in Home. Enter what your dashboard shows, not the estimate.',
    },
  },
  {
    id: 'reminders',
    question: { es: '¿Cómo funcionan los recordatorios?', en: 'How do reminders work?' },
    answer: {
      es: 'RODEXA Carro compara tu kilometraje registrado con el intervalo que configuraste para cada componente, y la fecha de vencimiento de tus documentos. Te avisa dentro de la app y con notificaciones en tu celular, aunque la app esté cerrada: como máximo una al día y solo con datos que registraste. Puedes apagar cada tipo en Configuración → Preferencias de notificaciones.',
      en: 'RODEXA Carro compares your logged odometer with the interval you set for each component, and your documents’ expiration dates. It alerts you inside the app and with notifications on your phone, even when the app is closed: at most one per day and only from data you recorded. You can turn off each type in Settings → Notification preferences.',
    },
  },
  {
    id: 'phone-notifications',
    question: {
      es: '¿Cómo activo las notificaciones en mi celular?',
      en: 'How do I turn on notifications on my phone?',
    },
    answer: {
      es: 'Ve a Configuración → Preferencias de notificaciones → “Notificaciones del teléfono” y tócala para permitirlas. Si antes las rechazaste, se abrirán los ajustes de Android para que las actives. Sin este permiso RODEXA Carro funciona igual, pero no puede avisarte en el celular.',
      en: 'Go to Settings → Notification preferences → “Phone notifications” and tap it to allow them. If you declined them before, Android settings will open so you can turn them on. Without this permission RODEXA Carro still works, but it can’t alert you on your phone.',
    },
  },
  {
    id: 'ok',
    question: { es: '¿Qué significa “Al día”?', en: 'What does “Up to date” mean?' },
    answer: {
      es: 'Según tus registros, todavía no corresponde hacer ese mantenimiento. No significa que RODEXA Carro haya revisado la pieza: solo compara tus datos con el intervalo.',
      en: 'According to your records, that maintenance isn’t due yet. It doesn’t mean RODEXA Carro checked the part: it only compares your data with the interval.',
    },
  },
  {
    id: 'soon',
    question: { es: '¿Qué significa “Próximo”?', en: 'What does “Soon” mean?' },
    answer: {
      es: 'Falta poco: estás dentro del margen de aviso (el 15 % final del intervalo, o 30 días antes del vencimiento de un documento).',
      en: 'It’s close: you’re within the warning margin (the last 15 % of the interval, or 30 days before a document expires).',
    },
  },
  {
    id: 'due',
    question: { es: '¿Qué significa “Pendiente”?', en: 'What does “Due” mean?' },
    answer: {
      es: 'Ya se cumplió el kilometraje o la fecha prevista según tus registros. Revisa si ya corresponde hacerlo y regístralo cuando lo hagas.',
      en: 'The expected odometer or date has passed according to your records. Check whether it’s time and log it once done.',
    },
  },
  {
    id: 'nodata',
    question: { es: '¿Qué significa “Sin datos”?', en: 'What does “No data” mean?' },
    answer: {
      es: 'Falta información para calcular el estado, por ejemplo el kilometraje del último cambio o cada cuántos km se hace. Toca “Completar datos” en Mi carro.',
      en: 'Some information is missing to calculate the status, such as the odometer at the last change or how often it’s done. Tap “Complete data” in My car.',
    },
  },
  {
    id: 'data-storage',
    question: { es: '¿Dónde se guardan mis datos?', en: 'Where is my data stored?' },
    answer: {
      es: 'En tu celular, sin cuenta ni correo. Se conservan al cerrar la app, reiniciar o apagar el teléfono. Se pierden si desinstalas la app, borras sus datos desde los ajustes de Android o restableces el teléfono.',
      en: 'On your phone, with no account or email. They’re kept when you close the app, restart or turn off your phone. They’re lost if you uninstall the app, clear its data in Android settings or reset your phone.',
    },
  },
  {
    id: 'delete-data',
    question: { es: '¿Cómo borro mis datos y empiezo de cero?', en: 'How do I delete my data and start over?' },
    answer: {
      es: 'En Configuración → Privacidad y datos → “Eliminar todos los datos”. Borra de tu celular el carro y todos sus registros, y la app vuelve al primer ingreso. No se puede deshacer. Es distinto de “Restablecer preferencias”, que solo restaura el tema, el idioma, los formatos y las notificaciones.',
      en: 'In Settings → Privacy & data → “Delete all data”. It deletes your car and all its records from your phone, and the app goes back to the first setup. It can’t be undone. It’s different from “Reset preferences”, which only restores theme, language, formats and notifications.',
    },
  },
  {
    id: 'car-not-listed',
    question: { es: 'Mi carro no aparece en la lista, ¿qué hago?', en: 'My car isn’t in the list, what should I do?' },
    answer: {
      es: 'Elige la marca y luego “Otro modelo” para escribirlo; si la marca tampoco está, elige “Otra”. También puedes avisarnos en Ayuda y soporte → Sugerir una mejora para agregarla al catálogo.',
      en: 'Choose the brand and then “Otro modelo” (Other model) to type it; if the brand isn’t there either, choose “Otra” (Other). You can also let us know in Help & support → Suggest an improvement so we add it to the catalog.',
    },
  },
  {
    id: 'theme',
    question: { es: '¿Cómo cambio el tema?', en: 'How do I change the theme?' },
    answer: {
      es: 'En Configuración → Apariencia elige Claro, Oscuro o Sistema. “Sistema” sigue el tema de tu celular.',
      en: 'In Settings → Appearance choose Light, Dark or System. “System” follows your phone’s theme.',
    },
  },
  {
    id: 'language',
    question: { es: '¿Cómo cambio el idioma?', en: 'How do I change the language?' },
    answer: {
      es: 'En Configuración → Idioma y región → Idioma. Por ahora la traducción al inglés es parcial.',
      en: 'In Settings → Language & region → Language. The English translation is partial for now.',
    },
  },
];
