/**
 * Textos en español (idioma base). Cada clave debe existir también en `en.ts`
 * (TypeScript lo exige). Traducido hoy: navegación, Configuración y Notificaciones.
 */
export const es = {
  // Navegación
  'tabs.home': 'Inicio',
  'tabs.history': 'Historial',
  'tabs.stats': 'Estadísticas',
  'tabs.car': 'Mi carro',

  // Comunes
  'common.soon': 'Próximamente',
  'common.comingSoon': 'Próximamente',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.edit': 'Editar',
  'common.notRegistered': 'Sin registrar',
  'common.on': 'Activado',
  'common.off': 'Desactivado',
  'common.yes': 'Sí',
  'common.no': 'No',
  'common.dontKnow': 'No sé',

  // Configuración — secciones
  'settings.title': 'Configuración',
  'settings.section.account': 'Cuenta',
  'settings.section.appearance': 'Apariencia',
  'settings.section.languageRegion': 'Idioma y región',
  'settings.section.notifications': 'Notificaciones',
  'settings.section.preferences': 'Preferencias',
  'settings.section.support': 'Ayuda y soporte',
  'settings.section.about': 'Información',
  'settings.section.actions': 'Acciones',
  'settings.section.data': 'Tus datos',
  'settings.contactProvidentia': 'Contactar a Providentia Tech',
  'settings.aboutProvidentia': 'Sobre Providentia Tech',
  'settings.aboutProvidentia.description': 'Quién está detrás de RODEXA',
  'settings.founder': 'Conoce al fundador',
  'settings.data': 'Copia de seguridad',
  'settings.data.description': 'Exporta tus datos para no perderlos al cambiar de celular',

  // Configuración — filas
  'settings.profile': 'Mi perfil',
  'settings.car': 'Mi carro',
  'settings.theme': 'Tema',
  'settings.theme.light': 'Claro',
  'settings.theme.dark': 'Oscuro',
  'settings.theme.system': 'Sistema',
  'settings.language': 'Idioma',
  'settings.languageRegion': 'Idioma y región',
  'settings.notificationCenter': 'Centro de notificaciones',
  'settings.notificationPrefs': 'Preferencias de notificaciones',
  'settings.general': 'Preferencias generales',
  'settings.general.description': 'Distancia, moneda y formato de fecha',
  'settings.maintenance': 'Mantenimiento',
  'settings.documents': 'Documentos',
  'settings.privacy': 'Privacidad y datos',
  'settings.help': 'Ayuda y soporte',
  'settings.about': 'Acerca de RODEXA Carro',
  'settings.version': 'Versión',
  'settings.resetPreferences': 'Restablecer preferencias',
  'settings.resetPreferences.description': 'Tema, idioma, formatos y notificaciones',
  'settings.logout': 'Cerrar sesión',
  'settings.logout.description': 'Disponible cuando existan cuentas',
  'settings.unread': '{count} sin leer',

  // Premium (solo visual)
  'premium.title': 'RODEXA Pro',
  'premium.subtitle': 'Entiende cuánto cuesta, cómo lo estás cuidando y cómo se está comportando.',
  'premium.idea1': 'Estadísticas y análisis de gastos y energía',
  'premium.idea2': 'Importar y exportar tus datos',
  'premium.idea3': 'Informe completo y análisis del estado',
  'premium.free': 'Lo que usas hoy sigue gratis. Toca para conocer lo que incluirá.',
  'premium.soon': 'disponible próximamente',
  'settings.theme.appliesTo': 'Se aplica a toda la app. “Sistema” sigue el tema de tu celular.',

  // Feedback
  'toast.themeChanged': 'Tema cambiado',
  'toast.preferenceUpdated': 'Preferencia actualizada',
  'toast.profileUpdated': 'Perfil actualizado',
  'toast.carUpdated': 'Información del carro actualizada',
  'toast.preferencesReset': 'Preferencias restauradas',
  'toast.languageChanged': 'Idioma cambiado',
  'toast.allRead': 'Todas las notificaciones marcadas como leídas',
  'toast.dataDeleted': 'Se borraron los datos de tu carro de este celular',

  // Confirmaciones
  'confirm.reset.title': '¿Restablecer preferencias?',
  'confirm.reset.message':
    'Se restauran tema, idioma, formatos y notificaciones. Tu carro, historial, mantenimientos, documentos y gastos NO se borran.',
  'confirm.reset.action': 'Restablecer',
  'confirm.delete.title': '¿Eliminar todos los datos?',
  'confirm.delete.message':
    'Esta acción borrará de este celular tu carro, historial, mantenimientos, documentos y gastos. No se puede deshacer. Tus preferencias se conservan.',
  'confirm.delete.action': 'Eliminar',

  // Perfil
  'profile.title': 'Mi perfil',
  'profile.name': 'Nombre',
  'profile.city': 'Ciudad',
  'profile.edit': 'Editar perfil',
  'profile.nameRequired': 'Escribe tu nombre.',
  'profile.cityHint': 'Solo la ciudad, no tu dirección.',
  'profile.noAccount': 'Aún no hay cuentas de usuario: tu perfil vive solo en este celular.',

  // Mi carro (resumen)
  'carro.title': 'Mi carro',
  'carro.brand': 'Marca',
  'carro.model': 'Modelo',
  'carro.year': 'Año',
  'carro.engine': 'Cilindraje',
  'carro.variant': 'Versión',
  'carro.plate': 'Placa',
  'carro.body': 'Tipo de carro',
  'carro.energy': 'Combustible o energía',
  'carro.transmission': 'Transmisión',
  'carro.drivetrain': 'Tracción',
  'carro.timing': 'Distribución',
  'carro.tank': 'Capacidad del tanque',
  'carro.battery': 'Capacidad de la batería',
  'carro.odometer': 'Kilometraje',
  'carro.usage': 'Uso principal',
  'carro.editInfo': 'Editar información',
  'carro.updateOdometer': 'Actualizar kilometraje',

  // Idioma y región
  'region.title': 'Idioma y región',
  'region.language': 'Idioma',
  'region.partialTranslation':
    'El inglés está en Beta: por ahora cubre la navegación y Configuración. Algunas pantallas, avisos y textos siguen en español.',
  'region.region': 'Región',
  'region.country': 'País',
  'region.currency': 'Moneda',
  'region.distance': 'Distancia',
  'region.dateFormat': 'Formato de fecha',
  'region.editInPreferences': 'Cambia distancia y formato de fecha en Preferencias generales.',

  // Preferencias generales
  'prefs.title': 'Preferencias generales',
  'prefs.distance': 'Unidad de distancia',
  'prefs.distance.km': 'Kilómetros',
  'prefs.distance.mi': 'Millas',
  'prefs.currency': 'Moneda',
  'prefs.dateFormat': 'Formato de fecha',
  'prefs.note':
    'Las distancias se muestran en kilómetros, como marca el tablero de tu carro.',

  // Notificaciones
  'notif.title': 'Notificaciones',
  'notif.filter.all': 'Todas',
  'notif.filter.maintenance': 'Mantenimiento',
  'notif.filter.documents': 'Documentos',
  'notif.filter.odometer': 'Kilometraje',
  'notif.filter.system': 'Sistema',
  'notif.markAllRead': 'Marcar todas como leídas',
  'notif.markRead': 'Marcar como leída',
  'notif.empty': 'No tienes notificaciones en esta categoría.',
  'notif.unread': 'Sin leer',
  'notif.prefs.title': 'Preferencias de notificaciones',
  'notif.prefs.maintenance': 'Recordatorios de mantenimiento',
  'notif.prefs.documents': 'Vencimiento de documentos',
  'notif.prefs.odometer': 'Actualización de kilometraje',
  'notif.prefs.fuel': 'Recordatorios de cargas de combustible y energía',
  'notif.prefs.activity': 'Seguimiento de tu carro',
  'notif.permission.label': 'Notificaciones del teléfono',
  'notif.permission.granted': 'Permitidas',
  'notif.permission.denied': 'No permitidas',
  'notif.permission.undetermined': 'Sin decidir',
  'notif.permission.hint':
    'Sin este permiso RODEXA sigue funcionando, pero no puede avisarte en el teléfono. Tócalo para permitirlas.',
  'notif.prefs.confirmations': 'Confirmaciones de acciones',
  'notif.prefs.important': 'Notificaciones importantes',
  'notif.prefs.credit': 'Cuota del crédito del carro',
  'notif.prefs.longWeekend': 'Puentes festivos (revisión de viaje)',
  'notif.prefs.fines': 'Descuento de comparendos',
  'notif.prefs.note':
    'Los recordatorios llegan al teléfono aunque RODEXA esté cerrada, como máximo uno al día y solo con datos que registraste.',
  'notif.time.today': 'Hoy',
  'notif.time.yesterday': 'Ayer',
  'notif.time.daysAgo': 'Hace {count} días',

  // Mantenimiento
  'mprefs.title': 'Preferencias de mantenimiento',
  'mprefs.reminders': 'Recordatorios de mantenimiento',
  'mprefs.showEstimate': 'Mostrar kilometraje estimado',
  'mprefs.showRecommendations': 'Mostrar recomendaciones',
  'mprefs.showGettingStarted': 'Mostrar primeros pasos en Inicio',
  'mprefs.remindOdometer': 'Recordar actualizar kilometraje',
  'mprefs.note': 'Los intervalos de cada componente (aceite, kit, batería…) se configuran en Mi carro.',

  // Documentos
  'dprefs.title': 'Preferencias de documentos',
  'dprefs.soat': 'Recordar vencimiento de SOAT',
  'dprefs.rtm': 'Recordar vencimiento de tecnomecánica',
  'dprefs.policy': 'Recordar vencimiento de la póliza',
  'dprefs.tax': 'Recordar fecha límite del impuesto',
  'dprefs.other': 'Recordar otros documentos con fecha',
  'dprefs.license': 'Recordar vencimiento de la licencia',

  // Privacidad
  'privacy.title': 'Privacidad y datos',
  'privacy.policy': 'Política de privacidad',
  'privacy.stored': 'Datos almacenados',
  'privacy.stored.description': 'Solo en este celular',
  'privacy.delete': 'Eliminar todos los datos',
  'privacy.delete.description': 'Distinto de restablecer preferencias',
  'privacy.note':
    'Hoy RODEXA Carro no envía tus datos a ningún servidor. Cuando exista respaldo en la nube, podrás decidir qué se guarda.',

  // Ayuda
  'help.title': 'Ayuda y soporte',
  'help.faq': 'Preguntas frecuentes',
  'help.report': 'Reportar un problema',
  'help.suggest': 'Sugerir una mejora',
  'help.contact': 'Contacto',
  'help.report.description': '¿Encontraste un error o algo que no funciona como debería?',
  'help.suggest.description': '¿Tienes una idea para hacer RODEXA mejor?',
  'help.contactUs': 'Contactar con Providentia Tech',
  'help.contactUs.description':
    '¿Tienes alguna pregunta, comentario o quieres ponerte en contacto con nosotros?',
  'help.emailCopied': 'Correo copiado',

  // Acerca de
  'about.title': 'Acerca de RODEXA Carro',
  'about.terms': 'Términos y condiciones',
  'about.privacy': 'Política de privacidad',
  'about.licenses': 'Licencias de terceros',
  'about.rate': 'Valorar RODEXA Carro',
  'about.share': 'Compartir RODEXA Carro',
  'about.recommend': 'Recomendar RODEXA Carro',
  'about.share.description': 'Compártela por la app que prefieras',
  'about.recommend.description': 'Recomiéndala por WhatsApp a otro conductor',
  'about.status': 'Estado de la aplicación',
  'about.status.value': 'Lista para usar',
  'about.legal': 'Legal',
  'about.spread': 'Recomiéndanos',
};

export type TranslationKey = keyof typeof es;
