/**
 * Textos legales de RODEXA Carro, tal como los definió Providentia Tech.
 * `**texto**` marca negrita dentro de un párrafo. Cada documento existe una sola vez
 * aquí y se muestra con LegalDocumentView.
 */

export type LegalBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDocument = {
  /** Título corto del encabezado de la pantalla. */
  screenTitle: string;
  title: string;
  updated?: string;
  intro: LegalBlock[];
  sections: LegalSection[];
  signature?: string[];
};

const p = (text: string): LegalBlock => ({ kind: 'paragraph', text });
const list = (...items: string[]): LegalBlock => ({ kind: 'list', items });

const SIGNATURE = ['RODEXA Carro', 'Un producto de Providentia Tech'];

export const TERMS: LegalDocument = {
  screenTitle: 'Términos y condiciones',
  title: 'Términos y condiciones de RODEXA Carro',
  updated: 'Última actualización: noviembre de 2026',
  intro: [
    p(
      'Bienvenido a **RODEXA Carro**, una aplicación desarrollada por **Providentia Tech** para ayudar a los usuarios a organizar, consultar y hacer seguimiento de la información relacionada con el cuidado y control de sus carros.',
    ),
    p('Al instalar, acceder o utilizar RODEXA Carro, aceptas estos Términos y Condiciones.'),
  ],
  sections: [
    {
      heading: '1. Uso de RODEXA Carro',
      blocks: [
        p(
          'RODEXA Carro está diseñada como una herramienta de apoyo para registrar y consultar información relacionada con un carro, incluyendo kilometraje, mantenimientos, combustible, gastos, documentos, recordatorios y otros datos relacionados con su cuidado.',
        ),
        p('La información mostrada por RODEXA se basa principalmente en los datos proporcionados por el usuario.'),
      ],
    },
    {
      heading: '2. Información proporcionada por el usuario',
      blocks: [
        p(
          'El usuario es responsable de la información que registre en la aplicación y debe procurar que los datos ingresados sean correctos.',
        ),
        p(
          'RODEXA Carro no debe inventar ni asumir información que el usuario no conozca. Cuando una función permita indicar que un dato es desconocido, el usuario podrá utilizar dicha opción.',
        ),
      ],
    },
    {
      heading: '3. Almacenamiento local',
      blocks: [
        p(
          'En su versión inicial, RODEXA Carro almacena la información de la aplicación localmente en el dispositivo del usuario.',
        ),
        p(
          'La aplicación no requiere crear una cuenta ni proporcionar una cédula, número de teléfono, correo electrónico u otros datos personales de identificación para utilizar sus funciones principales.',
        ),
        p(
          'Debido al almacenamiento local, la información puede perderse si el usuario desinstala la aplicación, elimina los datos de la aplicación, restablece el dispositivo o pierde el acceso al dispositivo.',
        ),
        p('RODEXA Carro no garantiza la recuperación de información almacenada exclusivamente en el dispositivo.'),
        p(
          'Las futuras funciones de respaldo, sincronización o recuperación podrán estar sujetas a condiciones diferentes y serán informadas al usuario antes de su implementación.',
        ),
      ],
    },
    {
      heading: '4. Notificaciones',
      blocks: [
        p('RODEXA Carro puede solicitar permiso para enviar notificaciones al dispositivo.'),
        p(
          'Las notificaciones pueden utilizarse para recordar al usuario fechas, mantenimientos, kilometraje, combustible u otras actividades relacionadas con el cuidado de su carro.',
        ),
        p(
          'El usuario puede aceptar o rechazar el permiso de notificaciones. Rechazarlo no impide utilizar las funciones principales de la aplicación.',
        ),
      ],
    },
    {
      heading: '5. Información de mantenimiento y seguridad',
      blocks: [
        p(
          'RODEXA Carro es una herramienta de organización y seguimiento y no reemplaza la revisión realizada por un mecánico, técnico, centro de diagnóstico o profesional competente.',
        ),
        p(
          'Los recordatorios, estimaciones y recomendaciones de la aplicación deben utilizarse como apoyo y no como sustituto de una inspección profesional del carro.',
        ),
        p(
          'El usuario es responsable de verificar el estado real de su carro y de cumplir las obligaciones legales aplicables a su vehículo.',
        ),
        p(
          'RODEXA Carro puede mostrar información de talleres, servicios a domicilio y centros de diagnóstico automotor (CDA) que solicitaron aparecer en la aplicación. Esta información es suministrada por cada negocio y se publica después de una verificación básica. RODEXA Carro y Providentia Tech no prestan esos servicios ni garantizan su calidad, precio o resultado. Los negocios que pagan por aparecer de forma destacada se identifican como «Patrocinado».',
        ),
      ],
    },
    {
      heading: '6. Disponibilidad de la aplicación',
      blocks: [
        p('RODEXA Carro puede recibir actualizaciones, modificaciones, mejoras o correcciones.'),
        p(
          'Providentia Tech podrá modificar, actualizar o retirar determinadas funciones de la aplicación cuando sea necesario para su funcionamiento, seguridad, mantenimiento o evolución.',
        ),
      ],
    },
    {
      heading: '7. Propiedad intelectual',
      blocks: [
        p(
          'RODEXA Carro, incluyendo su nombre, identidad visual, logotipo, diseño, código fuente, interfaces, textos, elementos gráficos, estructura y demás componentes desarrollados específicamente para la aplicación, pertenece a **Providentia Tech** o se encuentra utilizado bajo las licencias correspondientes.',
        ),
        p(
          'La publicación de RODEXA Carro no implica que el código fuente de la aplicación sea de código abierto ni concede al usuario derechos para copiar, modificar, redistribuir, vender o reutilizar sus componentes protegidos sin autorización.',
        ),
      ],
    },
    {
      heading: '8. Uso permitido',
      blocks: [
        p(
          'El usuario puede utilizar RODEXA Carro para sus fines personales y legítimos relacionados con la gestión y cuidado de sus carros.',
        ),
        p(
          'No está permitido utilizar la aplicación para actividades ilícitas, intentar alterar su funcionamiento, acceder sin autorización a sus sistemas o distribuir versiones modificadas de la aplicación sin autorización.',
        ),
      ],
    },
    {
      heading: '9. Cambios en estos términos',
      blocks: [
        p(
          'Estos Términos y Condiciones pueden actualizarse cuando sea necesario. La versión vigente estará disponible dentro de la aplicación y/o en el medio oficial correspondiente.',
        ),
      ],
    },
    {
      heading: '10. Contacto',
      blocks: [
        p(
          'Para preguntas relacionadas con RODEXA Carro, sus términos o su funcionamiento, el usuario podrá utilizar el canal oficial de contacto proporcionado por Providentia Tech.',
        ),
      ],
    },
  ],
  signature: SIGNATURE,
};

/**
 * Política de privacidad. Las frases de almacenamiento (secciones 2, 5, 7 y 8)
 * describen el almacenamiento local persistente del teléfono (sin servidor).
 */
export const PRIVACY_POLICY: LegalDocument = {
  screenTitle: 'Política de privacidad',
  title: 'Política de privacidad de RODEXA Carro',
  updated: 'Última actualización: noviembre de 2026',
  intro: [
    p('**RODEXA Carro**, un producto de **Providentia Tech**, respeta la privacidad de sus usuarios.'),
    p(
      'Esta Política de Privacidad explica qué información utiliza RODEXA Carro, cómo se almacena y qué permisos puede solicitar la aplicación.',
    ),
  ],
  sections: [
    {
      heading: '1. Información que RODEXA Carro solicita',
      blocks: [
        p('La versión inicial de RODEXA Carro no requiere crear una cuenta.'),
        p('La aplicación no solicita como requisito para utilizar sus funciones principales:'),
        list(
          'Número de cédula.',
          'Correo electrónico.',
          'Número de teléfono.',
          'Contraseña.',
          'Datos bancarios.',
          'Información de tarjetas de pago.',
        ),
        p(
          'El usuario puede introducir voluntariamente información relacionada con su carro, como marca, modelo, año, kilometraje, mantenimientos, combustible, gastos, documentos y otros datos necesarios para utilizar las funciones de la aplicación.',
        ),
        p(
          'Además, el usuario puede registrar de forma opcional: los ingresos que genera con su carro; los datos de un crédito o leasing del vehículo (valor de la cuota, número de cuotas y día de pago); los comparendos que reciba (fecha, número y valor); los repuestos que usa su carro (marca, referencia y última compra); y los contactos y talleres que decida guardar. Esta información se guarda únicamente en el dispositivo.',
        ),
      ],
    },
    {
      heading: '2. Almacenamiento de la información',
      blocks: [
        p('En su versión inicial, la información registrada por el usuario se almacena localmente en el dispositivo.'),
        p(
          'RODEXA Carro no envía estos registros a un servidor propio ni requiere una cuenta para utilizar las funciones principales de la aplicación.',
        ),
        p(
          'Por esta razón, los datos almacenados localmente pueden perderse si el usuario desinstala la aplicación, elimina los datos de la aplicación, restablece el dispositivo o pierde el acceso al dispositivo.',
        ),
        p('RODEXA Carro no garantiza la recuperación de información que se encuentre almacenada únicamente en el dispositivo.'),
        p(
          'El usuario puede crear una copia de seguridad de su información en un archivo (.rodexa) desde la aplicación. Ese archivo se guarda únicamente en la ubicación que el usuario elija (por ejemplo, la memoria del dispositivo o un servicio de almacenamiento propio del usuario); RODEXA Carro no lo recibe ni lo envía a ningún servidor. La copia no incluye las fotos ni las preferencias de la aplicación. Cualquier persona que tenga acceso al archivo podría recuperar la información que contiene, por lo que el usuario es responsable de guardarlo en un lugar seguro.',
        ),
      ],
    },
    {
      heading: '3. Notificaciones',
      blocks: [
        p('RODEXA Carro puede solicitar permiso para enviar notificaciones.'),
        p(
          'Las notificaciones se utilizan para recordar al usuario información relacionada con su carro, como mantenimientos, documentos, kilometraje, combustible y otras actividades relevantes.',
        ),
        p('Las notificaciones locales son generadas por la aplicación en el propio dispositivo.'),
        p('El usuario puede aceptar o rechazar el permiso de notificaciones.'),
      ],
    },
    {
      heading: '4. Información del dispositivo',
      blocks: [
        p(
          'RODEXA Carro no necesita acceder a información personal del dispositivo que no sea necesaria para proporcionar sus funciones.',
        ),
        p(
          'La aplicación no solicita acceso a contactos, mensajes SMS, llamadas ni micrófono. La cámara se solicita únicamente si el usuario decide tomar una foto opcional de su vehículo o del lugar donde lo parqueó; las fotos se guardan solo en el dispositivo, no se envían a ningún servidor y se pueden eliminar en cualquier momento.',
        ),
        p(
          'Si una futura versión incorpora nuevos permisos o tecnologías que impliquen un tratamiento diferente de información, esta política será actualizada antes o junto con la incorporación de dichos cambios, según corresponda.',
        ),
      ],
    },
    {
      heading: '5. Compartición de información',
      blocks: [
        p(
          'En la versión inicial, RODEXA Carro no vende, alquila ni comparte con terceros la información introducida por el usuario en sus registros de carro.',
        ),
        p('Los datos permanecen almacenados localmente en el dispositivo.'),
        p(
          'RODEXA Carro no se conecta con entidades financieras, aseguradoras, el SIMIT, el RUNT ni otras entidades públicas o privadas. Cuando el usuario toca un botón para consultar una página oficial, llamar, escribir por WhatsApp, abrir un mapa o compartir, la aplicación abre esa página o aplicación externa; RODEXA Carro no envía información por su cuenta. Si la aplicación copia la placa para facilitar una consulta, el usuario decide dónde pegarla.',
        ),
        p(
          'Los formularios para inscribir un negocio, reportar un problema o enviar una sugerencia solo preparan un correo electrónico que el usuario revisa y decide si envía.',
        ),
        p(
          'La sección «Más apps de RODEXA» solo muestra información sobre otras aplicaciones de Providentia Tech y no comparte datos entre ellas.',
        ),
      ],
    },
    {
      heading: '6. Publicidad',
      blocks: [
        p('La versión inicial de RODEXA Carro puede distribuirse sin publicidad.'),
        p(
          'Si en una versión futura se incorporan anuncios, se informará al usuario y se actualizará esta Política de Privacidad y la información correspondiente de Google Play para reflejar las prácticas reales de la aplicación.',
        ),
      ],
    },
    {
      heading: '7. Seguridad',
      blocks: [
        p('RODEXA Carro aplica medidas razonables para proteger la información almacenada por la aplicación.'),
        p(
          'Debido a que la versión inicial utiliza almacenamiento local, la protección de la información también depende de las medidas de seguridad del dispositivo del usuario, como el bloqueo de pantalla y la seguridad del sistema operativo.',
        ),
      ],
    },
    {
      heading: '8. Eliminación de información',
      blocks: [
        p(
          'El usuario puede eliminar la información almacenada localmente mediante las funciones de eliminación disponibles en la aplicación, cuando correspondan, o mediante la eliminación de los datos de la aplicación desde el dispositivo.',
        ),
        p(
          'Como la versión inicial no requiere una cuenta, no existe una cuenta remota asociada a los datos locales del usuario.',
        ),
      ],
    },
    {
      heading: '9. Menores de edad',
      blocks: [
        p('RODEXA Carro no está diseñada específicamente para recopilar información personal de niños.'),
        p(
          'La aplicación no requiere proporcionar información personal identificable para utilizar sus funciones principales.',
        ),
      ],
    },
    {
      heading: '10. Cambios en esta Política de Privacidad',
      blocks: [
        p(
          'Esta Política de Privacidad puede actualizarse cuando cambien las funciones, tecnologías o prácticas de tratamiento de información de RODEXA Carro.',
        ),
        p('La versión vigente estará disponible dentro de la aplicación y en el sitio oficial correspondiente.'),
      ],
    },
    {
      heading: '11. Contacto',
      blocks: [
        p(
          'Para preguntas relacionadas con privacidad, protección de datos o tratamiento de información en RODEXA Carro, el usuario podrá comunicarse mediante el canal oficial de contacto proporcionado por Providentia Tech.',
        ),
      ],
    },
  ],
  signature: SIGNATURE,
};

export const THIRD_PARTY_LICENSES: LegalDocument = {
  screenTitle: 'Licencias de terceros',
  title: 'Licencias de terceros de RODEXA Carro',
  intro: [
    p(
      'RODEXA Carro utiliza componentes y bibliotecas de terceros que pueden estar distribuidos bajo diferentes licencias de software.',
    ),
    p('Las licencias correspondientes a dichos componentes deben respetarse de acuerdo con sus respectivos términos.'),
    p(
      'RODEXA Carro y el código desarrollado específicamente para el producto son propiedad de **Providentia Tech**, salvo aquellos componentes de terceros que se encuentren sujetos a sus propias licencias.',
    ),
    p(
      'La utilización de componentes de código abierto o de terceros dentro de RODEXA Carro no significa que el código propio de RODEXA Carro sea de código abierto.',
    ),
  ],
  sections: [],
};
