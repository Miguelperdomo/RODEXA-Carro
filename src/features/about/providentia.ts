/**
 * Identidad institucional de Providentia Tech (pantallas "Sobre Providentia Tech" y
 * "Conoce al fundador"). Un solo lugar para estos textos.
 *
 * IMPORTANTE: Providentia Tech es un PROYECTO TECNOLÓGICO EN CONSTRUCCIÓN, no una empresa
 * registrada ni constituida. No agregar NIT, razón social, dirección comercial, matrícula
 * mercantil ni nada que haga parecer que ya existe como sociedad comercial.
 */

export const PROVIDENTIA = {
  name: 'Providentia Tech',
  tagline: 'Tecnología construida paso a paso.',
  status: 'Proyecto tecnológico en construcción',

  about: [
    'Providentia Tech es un proyecto tecnológico independiente que nace con la intención de crear productos de software útiles, accesibles y pensados para resolver problemas reales.',
    'Hoy se encuentra en una etapa de construcción y crecimiento. La idea es desarrollar primero productos, aprender de las personas que los usan, validar ideas y construir una base tecnológica sólida para, más adelante, formalizar Providentia Tech como una empresa.',
  ],

  purpose: [
    'Providentia Tech nace de una idea sencilla: usar la tecnología para construir productos que de verdad sean útiles en la vida cotidiana.',
    'No se trata de crear aplicaciones por crearlas, sino de identificar problemas, entenderlos y desarrollar soluciones fáciles de usar que puedan crecer con las necesidades de las personas.',
    'El proyecto se construye paso a paso: empezando por productos pequeños y específicos para, con el tiempo, formar una familia de soluciones bajo una misma identidad.',
  ],

  story: [
    'Providentia Tech no comenzó como una gran compañía ni con una estructura empresarial detrás. Es un proyecto que se está construyendo desde cero, mientras su fundador termina su formación como Ingeniero de Software y sigue trabajando como desarrollador.',
    'La idea es empezar pequeño, construir productos reales, aprender de quienes los usan y, con el tiempo, convertir este proyecto en una empresa formal de tecnología.',
    'RODEXA es uno de los primeros pasos de ese camino.',
  ],

  projects: [
    {
      key: 'moto',
      icon: 'motorcycle',
      title: 'RODEXA Moto',
      description:
        'Ayuda a los motociclistas a llevar el control de su moto: mantenimiento, documentos, gastos, kilometraje y más.',
    },
    {
      key: 'carro',
      icon: 'car',
      title: 'RODEXA Carro',
      description:
        'Para propietarios de carros: mantenimiento, documentos, gastos, kilometraje, combustible o energía y el cuidado del carro.',
      current: true,
    },
    {
      key: 'game',
      icon: 'star',
      title: 'No Toques el Rojo',
      description: 'Un proyecto de videojuego, parte de la exploración y el desarrollo de productos digitales.',
    },
    {
      key: 'future',
      icon: 'add',
      title: 'Futuros productos',
      description: 'Estos proyectos pueden evolucionar con el tiempo y pueden aparecer nuevos productos de software.',
    },
  ],

  future: [
    { title: 'Construir y aprender', text: 'Crear productos útiles y aprender de las personas que los usan.' },
    { title: 'Mejorar y crecer', text: 'Mejorar esos productos, crear nuevos proyectos y consolidar una identidad tecnológica.' },
    {
      title: 'Formalizar',
      text: 'Cuando llegue el momento adecuado, formalizar Providentia Tech como una empresa legalmente constituida.',
    },
  ],

  transparency: [
    'Providentia Tech se encuentra actualmente en etapa de construcción.',
    'Hoy no es una sociedad comercial registrada ni una empresa formalmente constituida ante Cámara de Comercio.',
    'Esta aplicación forma parte de un proyecto tecnológico que se desarrolla y evoluciona de forma progresiva, con la intención de formalizarlo en el futuro a medida que crezca.',
  ],
} as const;

export const FOUNDER = {
  name: 'Miguel Ángel Rodríguez Perdomo',
  initials: 'MR',
  role: 'Fundador y desarrollador de Providentia Tech',
  education: 'Ingeniero de Software en formación',
  /**
   * Fotografía del fundador: no hay una todavía (no se usa ninguna imagen de reemplazo).
   * Cuando exista, poner aquí el `require` de la imagen y la pantalla la mostrará.
   */
  photo: undefined as number | undefined,
  bio: [
    'Tengo 22 años y estoy próximo a graduarme como Ingeniero de Software.',
    'Trabajo como desarrollador de software y, al mismo tiempo, estoy construyendo Providentia Tech como un proyecto propio, con la intención de convertirlo más adelante en una empresa de tecnología formal.',
    'Mi formación y mi experiencia están en el desarrollo de software, y mi objetivo es seguir creciendo como profesional y como emprendedor mientras construyo productos propios.',
  ],
  why: [
    'Providentia Tech reúne justamente eso: mi formación como ingeniero de software, mi experiencia trabajando en desarrollo y mi interés por crear productos tecnológicos propios.',
    'Empecé desde cero y sin una estructura empresarial detrás. RODEXA es uno de los primeros productos de ese camino, y cada sugerencia de quienes lo usan ayuda a que mejore.',
  ],
} as const;
