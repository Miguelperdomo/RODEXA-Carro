# RODEXA Carro — Diseño funcional

> Documento de referencia del producto. Toda decisión nueva que contradiga este documento debe discutirse y, si se aprueba, actualizarse aquí.
>
> **Marca:** RODEXA · **Producto:** RODEXA Carro · **Empresa:** Providentia Tech
> **Versión:** 1.1 · **Aprobado:** 28/09/2026 (Fases 0, 0.5 y 1-A) · Cambio de marca (antes "MotoControl"): 28/09/2026

---

## 0. Arquitectura de marca

**RODEXA es la marca general y RODEXA Carro es el primer producto, enfocado en carros.**

```
RODEXA
├── RODEXA Carro   ← producto actual (carros)
├── RODEXA Auto   ← futuro: carros
├── RODEXA Truck  ← futuro: camiones y vehículos pesados
└── RODEXA Fleet  ← futuro: gestión de múltiples vehículos/flotas
```

- Solo **RODEXA Carro** está en desarrollo. Auto, Truck y Fleet **no se implementan**: no hay pantallas, botones ni selector de tipo de vehículo.
- El producto actual es 100 % para carros; los textos hablan de "tu carro" (p. ej. "Repuestos para mi carro").
- Textos de marca centralizados en `src/config/brand.ts` (nombre, lema "Control y cuidado de tu carro", "Un producto de Providentia Tech", © 2026, datos legales vacíos hasta que se entreguen — no inventar NIT, dirección, teléfono, correo ni web).
- Identidad nativa (`app.json`): `name` "RODEXA Carro", `slug` "rodexa-carro", `scheme` "rodexacarro". Ícono y splash nativos siguen siendo los genéricos hasta tener el logo definitivo. La carpeta y `package.json` conservan el nombre técnico `app-carro`.

---

## 0.1 Configuración, tema e idioma (28/09/2026)

- **Tema:** un único sistema (`src/shared/theme/ThemeProvider.tsx`) con tokens claro/oscuro (`colors.ts`) y `createStyles()`. Preferencia Claro / Oscuro / Sistema (Sistema sigue al celular). El azul de marca #1E4FD8 se usa para rellenos; `brand.accent` es su versión legible como texto/ícono (igual en claro, más claro en oscuro).
- **Preferencias:** `src/features/settings` (`Settings`, `DEFAULT_SETTINGS`, `SettingsProvider`). Hoy en memoria; en SQLite irán a `app_settings` con las mismas claves. "Restablecer preferencias" NO borra carro, historial, mantenimientos, documentos ni gastos.
- **Formatos:** distancia (km/mi) y fecha (DD/MM/YYYY · MM/DD/YYYY) centralizados en `formatKm` / `formatDate`. Los datos siempre se guardan en km.
- **Idioma:** `src/i18n` sin librería (es base + en con las mismas claves). Traducido: navegación, Configuración y Notificaciones; el resto sigue en español.
- **Notificaciones:** dentro de la app, deducidas de los datos (`src/features/notifications/build.ts`), nunca aleatorias. Sin push todavía.

---

## 1. Visión y principios

**Mensaje principal:**

> **RODEXA Carro entiende el estado de tu carro y te ayuda a saber qué necesita.**

RODEXA Carro no es una simple app de registro de gastos. Con la información que el usuario registra, muestra de forma sencilla **el estado de su carro** y recomienda qué hacer.

**Principios de producto (no negociables):**

1. **Filtro de toda funcionalidad:** "¿Esto realmente le resuelve un problema al conductor?" Si la respuesta es no, queda fuera.
2. **Nunca inventar el estado de una pieza.** RODEXA Carro mide si el **mantenimiento está al día según los registros**, no el estado físico de la pieza. Sin datos → ⚪ Sin datos.
3. **Lo estimado nunca se presenta como real.** El kilometraje estimado siempre se muestra aparte, marcado con "~", y nunca genera alertas rojas.
4. **No inventar datos del fabricante ni normativa.** Los intervalos son configurados por el usuario o "sugeridos", siempre con la indicación de verificar el manual del carro.
5. **Registrar debe tomar segundos.** Solo se piden los datos que desbloquean algo visible.
6. **Tus datos son tuyos.** El respaldo básico será gratuito siempre. Sin cobros sorpresa.
7. **Funciona sin internet y sin cuenta.**

**Posicionamiento competitivo (uso interno, no para la marca):** apps como R5 resuelven "¿mis papeles están al día?"; RODEXA Carro resuelve "¿mi carro está al día?". La marca debe construir identidad propia y no presentarse como alternativa a otra app.

## 2. Público objetivo

Personas que usan el carro a diario en Colombia: trabajadores, estudiantes, domiciliarios, mensajeros y conductores que quieren controlar gastos y mantenimiento. Los usuarios que trabajan con el carro son un segmento clave para funciones futuras (ingresos/ganancias), pero la app inicial no se limita a ellos.

## 3. Alcance del MVP

**Incluye:**

1. Registro de carro (modo sin cuenta)
2. Kilometraje (registrado + estimado + confirmación semanal)
3. Dashboard "Estado de mi carro"
4. Gastos (registro rápido)
5. Mantenimiento
6. Historial
7. Documentos (fechas ingresadas manualmente)
8. Recordatorios básicos
9. Estadísticas básicas

Botón central **"+"** con acceso rápido a: Gasto · Mantenimiento · Kilometraje.

**Fuera del MVP:** marketplace, talleres, pagos, premium, calificaciones, citas, ingresos, redes sociales, venta de SOAT/seguros, consulta RUNT/SIMIT, pico y placa, bitácora detallada de combustible, fotos/adjuntos, repuestos detallados.

**Verificación de documentos:** no existe una API pública oficial verificada de RUNT/SIMIT para consultar vigencia por placa. Las fechas las ingresa el usuario. Evaluar intermediarios privados queda para mucho después.

## 4. Stack tecnológico

| Capa | Tecnología |
|---|---|
| App | React Native + Expo + TypeScript |
| Navegación | Expo Router |
| Base de datos local | SQLite (expo-sqlite) + Drizzle ORM |
| Estado de UI | Zustand |
| Formularios y validación | React Hook Form + Zod |
| Backend (fase posterior) | Supabase |
| Arquitectura | Offline-first, por módulos, lógica de negocio en funciones TypeScript puras |

Recomendaciones basadas en **reglas TypeScript**, sin IA por ahora.

## 5. Roadmap

| Fase | Contenido |
|---|---|
| 1 | Diseño funcional (este documento) → configuración Expo/TS/Router → SQLite + Drizzle |
| 2 | UI/UX: sistema de diseño y wireframes |
| 3 | Registro de carro + onboarding |
| 4 | Kilometraje + estimación |
| 5 | Estado del carro + recordatorios + dashboard |
| 6 | Mantenimiento |
| 7 | Gastos + "+" rápido |
| 8 | Historial |
| 9 | Documentos |
| 10 | Estadísticas |
| 11 | Cuenta + respaldo/sincronización con Supabase |
| 12 | Pruebas + beta con usuarios reales |
| 13 | Correcciones según feedback |
| 14 | Publicación en Google Play |
| 15 | Premium y monetización (solo después de validar valor) |
| Futuro | **RODEXA Carro Repuestos** (niveles 0–3) — ver [modulo-repuestos.md](modulo-repuestos.md). **No forma parte del MVP.** |

Cada fase requiere aprobación antes de comenzar.

**Visión de producto a largo plazo:** que RODEXA Carro detecte qué necesita el carro, explique qué significa, muestre qué opciones hay para solucionarlo y, en el futuro, ayude a conseguirlo.

---

## 6. Información que necesita RODEXA Carro

**Principio:** cada dato solicitado debe desbloquear algo visible en el dashboard.

| Dato | ¿Obligatorio? | Desbloquea | Si falta |
|---|---|---|---|
| Marca + modelo | ✅ | Nombre del carro | No se puede crear |
| Kilometraje actual | ✅ | Base de todos los cálculos por km | No se puede crear |
| Año, cilindraje, placa | Opcional | Nada en el MVP | — |
| Km del último cambio de aceite + intervalo | Opcional | Estado del aceite | ⚪ Sin datos |
| Km del último cambio del alineación y balanceo + intervalo | Opcional | Estado del kit | ⚪ Sin datos |
| Vencimiento SOAT | Opcional | Estado SOAT | ⚪ Sin datos |
| Vencimiento tecnomecánica / "no aplica aún" | Opcional | Estado tecnomecánica | ⚪ Sin datos |
| ≥ 3 lecturas de km en el tiempo | Se acumula | Km estimado, km/día | "Sin suficiente información" |
| Gastos | Se acumula | "Este mes" | "Aún no registras gastos" |
| Gastos + lecturas del mes | Se acumula | Costo por km | No se muestra |

## 7. Componentes del MVP

| Componente | En el MVP | Cálculo |
|---|---|---|
| **Aceite de motor** | Fila fija | Por km |
| **Alineación y balanceo** | Fila fija | Por km |
| **SOAT** | Fila fija | Por fecha |
| **Tecnomecánica** | Fila fija | Por fecha o "no aplica aún" (lo marca el usuario; no afirmamos plazos legales) |
| Revisión de frenos | Opcional (el usuario la activa) | Por km |
| Mantenimiento general / sincronización | Opcional | Por km |
| Batería | Opcional | Por meses |
| Llantas | Opcional | Por km |

El dashboard muestra las 4 filas fijas y un botón "+ Controlar otro componente".

## 8. Reglas del "Estado de mi carro"

### 8.1 Vocabulario de estados

| Estado | Uso |
|---|---|
| 🟢 **Al día** | Mantenimiento no requerido aún según registros |
| 🟡 **Próximo** | Dentro del margen de aviso |
| 🔴 **Pendiente** | Se superó el km/fecha prevista |
| ⚪ **Sin datos** | Falta información para calcular |
| 🟢 **Vigente** / 🟡 **Por vencer** / 🔴 **Vencido** | Documentos |
| ▫️ **No aplica** | Documento marcado por el usuario como no aplicable aún |

Nunca se usa "Normal" ni "Bien": RODEXA Carro no conoce el estado físico de la pieza.

### 8.2 Componentes por kilometraje

- **L** = km del último mantenimiento de ese tipo (historial o respuesta del onboarding)
- **I** = intervalo en km (configurado por el usuario o sugerido)
- **R** = último kilometraje **registrado** (nunca el estimado)
- **Próximo** = L + I · **Faltan** = Próximo − R
- **Margen de aviso M** = 15 % de I

| Condición | Estado | Texto ejemplo |
|---|---|---|
| Falta L o I | ⚪ Sin datos | "Registra tu último cambio para activar el aviso" |
| L > R | ⚪ Sin datos | "Revisa los datos: el último cambio es mayor al km actual" |
| Faltan > M | 🟢 Al día | "Próximo cambio en ~760 km" |
| 0 < Faltan ≤ M | 🟡 Próximo | "Faltan 260 km" |
| Faltan ≤ 0 | 🔴 Pendiente | "Previsto a los 53.000 km (registrado: 53.240 km)" |

Componentes por **meses**: misma lógica con fechas. Si un componente tiene intervalo por km y por meses, el estado es **el peor de los dos**.

### 8.3 Documentos (fechas en zona horaria America/Bogota, comparación por día)

| Condición | Estado |
|---|---|
| Sin fecha de vencimiento | ⚪ Sin datos |
| Marcado "No aplica aún" | ▫️ No aplica |
| Faltan > 30 días | 🟢 Vigente — "hasta 14/05/2027" |
| Faltan 0–30 días | 🟡 Por vencer — "vence en 12 días" / "vence hoy" |
| Fecha pasada | 🔴 Vencido — "venció el 14/05/2027" |

### 8.4 Reglas de protección

1. El 🔴 solo se activa con **datos registrados**, nunca con estimaciones.
2. Si el último km registrado tiene **más de 14 días**, las filas por km muestran "según tu registro de hace N días".
3. El color nunca va solo: siempre acompañado de texto.
4. El detalle de toda fila por km incluye: *"Intervalo sugerido / configurado por ti. Verifica el manual de tu carro o consulta a tu mecánico."*
5. Orden en el dashboard: 🔴 → 🟡 → ⚪ → 🟢 → ▫️.

### 8.5 Kilometraje estimado

**Se muestra solo si se cumplen todas:**

- ≥ 3 lecturas en los últimos 60 días
- Las lecturas abarcan ≥ 14 días
- Km recorrido entre lecturas > 0
- Han pasado ≥ 3 días desde la última lectura
- Han pasado ≤ 30 días desde la última lectura

**Cálculo:** ritmo = (km última − km primera) ÷ días entre ellas; estimado = R + ritmo × días desde la última lectura; redondeado a 50 km y mostrado con "~".

**Presentación:**

```
Kilometraje registrado   53.240 km   (hace 5 días)
Kilometraje estimado     ~53.400 km  ⓘ
```

Si no se cumplen las condiciones: *"Estimado: sin suficiente información"*.

**El estimado:**

- ✅ Puede generar una recomendación suave ("podrías estar cerca de…, actualiza tu kilometraje").
- ❌ No cambia colores.
- ❌ No se guarda como lectura.
- ❌ No se usa en estadísticas.

**Confirmación semanal:** si pasaron ≥ 7 días desde la última lectura, aparece una tarjeta (y en el futuro, notificación local): *"¿Cuánto marca tu carro hoy? Míralo en el tablero."* El teclado **no se precarga con el estimado**; este aparece solo como referencia en gris.

**Validaciones:** el km no puede ser menor que la lectura anterior (existe flujo de corrección). Si implica > 500 km/día, se pide confirmación ("¿Seguro?"), sin bloquear.

### 8.6 "RODEXA Carro recomienda"

Máximo 3 recomendaciones, por prioridad. Siempre "según tus registros", tono no imperativo.

| Prioridad | Disparador | Texto ejemplo |
|---|---|---|
| 1 | Componente 🔴 | "Según tu último registro (53.240 km), el cambio de aceite estaba previsto a los 53.000 km. Revisa si ya corresponde hacerlo." |
| 2 | Documento 🔴/🟡 | "Tu SOAT vence en 12 días (14/05/2027)." |
| 3 | Componente 🟡 | "Según tu último registro, revisa el aceite aproximadamente en 260 km." |
| 4 | Estimado cercano a un componente | "Según tu ritmo (~35 km/día), podrías llegar al cambio de aceite esta semana. Actualiza tu kilometraje para confirmarlo." |
| 5 | Km desactualizado > 14 días | "Hace 18 días no actualizas el kilometraje." |
| 6 | Faltan datos clave (una sola) | "Registra tu último cambio de aceite para que RODEXA Carro pueda avisarte." |
| — | Nada que reportar | "Todo al día según tus registros. 👍" |

### 8.7 "Este mes"

- **Total gastado:** suma de gastos del mes calendario.
- **Costo por km:** solo si hay ≥ 100 km recorridos en el mes según lecturas registradas. Si no, no se muestra.
- **Comparación con el mes anterior:** solo si ese mes tiene datos.

### 8.8 Intervalos sugeridos

- El onboarding pregunta: "¿Cada cuántos km cambias el aceite?" (1.500 · 2.000 · 3.000 · 4.000 · Otro · No sé).
- Si responde "No sé": se usa un valor de referencia provisional marcado como **sugerido**, con la indicación de verificar el manual.
- **Pendiente:** validar valores de referencia con 2–3 mecánicos y manuales de 3–4 carros populares.

---

## 9. Modelo de datos inicial (MVP)

Convenciones:

- Todas las tablas: `id` UUID generado en el dispositivo, `created_at`, `updated_at`, `deleted_at` (borrado suave) → permiten sincronización futura.
- Fechas en ISO 8601. Dinero en **pesos enteros** (`amount_cop`), nunca decimales flotantes.
- El **estado del carro no se guarda**: se calcula con funciones puras a partir de los datos.
- `user_id` es opcional: se llena cuando el usuario cree su cuenta (Fase 11).

```
app_settings            clave-valor: onboarding_done, local_owner_id, preferencias

cars             id, user_id?, brand_code, brand_name, model_id?, model, year?,
                        displacement_cc?, plate?, nickname?, usage_type?,
                        cooling_applies?, is_active
                        (usage_type: personal | work | delivery | apps | travel | mixed;
                        aún no altera cálculos ni recomendaciones)

profiles                nombre, city_id? (del catálogo de ciudades; nunca dirección)

catálogos (hoy estáticos en src/features/catalogs, luego tablas):
  cities (id, name, department) · car_brands (id, name)
  car_models (id, brand_id, name, engine_cc?) · model_years (model_id, year)
  model_variants (model_id, year, engine_cc) → Marca → Modelo → Año → Variante/cilindraje
                        (cooling_applies: ¿tiene refrigeración líquida? null = sin registrar;
                        false oculta la categoría "Refrigeración" de mantenimientos)
                        (brand_code normalizado desde la lista del onboarding, "other"
                        si es texto libre → prepara el futuro catálogo de repuestos)

odometer_readings       id, car_id, km, recorded_at,
                        source: onboarding | manual | weekly_check | maintenance | expense
                        (km actual = lectura más reciente)

service_types           catálogo: code (oil, alignment, brake_check, general, tires,
                        battery), name, icon, suggested_interval_km?,
                        suggested_interval_months?, is_core

service_plans           id, car_id, service_type_id, enabled,
                        interval_km?, interval_months?, interval_source: user | suggested,
                        baseline_km?, baseline_date?

maintenance_records     id, car_id, performed_at, odometer_km, cost_cop?,
                        workshop_name?, notes?
maintenance_items       id, record_id, item_code, notes?
                        item_code sale del catálogo de mantenimientos (~45 tipos en 5
                        categorías: motor y transmisión, frenos, ruedas y suspensión,
                        sistema eléctrico, refrigeración; más "other" con descripción).
                        Cada tipo puede indicar qué service_type pone "Al día"
                        (p. ej. tire_rear → tires, brake_pads_front → brake_check).
                        Fuente en código: src/features/maintenance/catalog.ts

expense_categories      catálogo: code, name, icon
expenses                id, car_id, category_id, amount_cop, spent_at,
                        odometer_km?, description?, maintenance_record_id?

documents               id, car_id, type: soat | rtm | tax | other,
                        expires_at?, issued_at?, number?, issuer?,
                        not_applicable, notes?
```

**Regla de gastos:** un mantenimiento con costo genera un gasto vinculado (`maintenance_record_id`). Las estadísticas se calculan solo desde `expenses`, así nunca se cuenta dos veces el mismo dinero.

---

## 10. Primer ingreso (onboarding)

> Actualizado el 28/09/2026: este flujo reemplaza la versión inicial de 7 pasos.

```
Abrir app → Splash (siempre) → ¿configurado?
   ├─ No → Bienvenida → Formulario (6 pasos) → Resumen → Preparando → Inicio
   └─ Sí → Inicio
```

- **Splash** (cada apertura, ~1,6 s): logo, "RODEXA Carro", "Entiende el estado de tu carro.",
  carga sutil y "Un producto de Providentia Tech".
- **Bienvenida:** "Bienvenido a RODEXA Carro" · [Comenzar] (sin cuenta ni correo).
- **Formulario por pasos** (barra de progreso):
  1. Sobre ti — nombre (obligatorio), ciudad (opcional; nunca dirección).
  2. Tu carro — marca, modelo (obligatorios); año, cilindraje, placa (opcionales).
  3. Kilometraje actual (obligatorio) — punto de partida.
  4. Mantenimientos recientes (opcional): aceite, kit, frenos, llantas, batería, otro →
     fecha, km, costo opcional. [Omitir por ahora].
  5. Documentos (opcional): vencimiento de SOAT y tecnomecánica. [Omitir por ahora].
  6. Refrigeración: Sí / No / No sé → `cooling_applies`.
- **Resumen:** "Revisa tus datos" · [Crear mi RODEXA Carro] · [Editar].
- **Preparando** (~2,2 s, sin interrupción): mensajes progresivos → Inicio existente.

Como el primer ingreso no pregunta intervalos, el aceite y el kit empiezan en ⚪ "Sin datos"
con la recomendación de configurarlos. `app_settings.onboarding_done` decidirá el camino
cuando exista almacenamiento real (hoy es solo memoria).

---

## 11. Dashboard (diseño conceptual)

```
┌─────────────────────────────────────┐
│ 🚗 Chevrolet Onix               ⚙️  │
│ 53.240 km  registrado hace 5 días   │
│ ~53.400 km estimado ⓘ   [Actualizar]│
├─────────────────────────────────────┤
│ ┌ ¿Cuánto marca tu carro hoy? ─────┐ │  ← solo si pasaron ≥ 7 días
│ │ Hace 8 días no lo actualizas [→]│ │
│ └─────────────────────────────────┘ │
│ ESTADO DE MI CARRO                   │
│ 🔴 Aceite         Pendiente        ›│
│    Previsto a los 53.000 km         │
│ 🟡 SOAT           Vence en 12 días ›│
│ ⚪ Alineación y balanceo Sin datos · Completar ›│
│ 🟢 Tecnomecánica  Vigente hasta 02/08/27 ›│
│ + Controlar otro componente         │
├─────────────────────────────────────┤
│ 💡 RODEXA CARRO RECOMIENDA           │
│ • Según tu último registro, el      │
│   cambio de aceite estaba previsto  │
│   a los 53.000 km. Revisa si ya     │
│   corresponde hacerlo. [Registrar]  │
│ • Tu SOAT vence en 12 días.         │
├─────────────────────────────────────┤
│ 💰 ESTE MES          $384.500      ›│
│    ~$307/km · 1.250 km recorridos   │
├─────────────────────────────────────┤
│  🏠 Inicio  📜 Historial  ➕  📊  🚗  │
└─────────────────────────────────────┘
```

- Cada fila abre su detalle: último mantenimiento, intervalo (con aviso de verificar el manual), historial y botón "Registrar cambio".
- [Registrar] en una recomendación abre el formulario precargado (tipo + km).
- Día 1 sin gastos: "Aún no registras gastos · [+ Registrar]".
- Todo se calcula localmente desde SQLite: sin esperas de red.

---

## 12. Validación con usuarios (pendiente de ejecutar)

Entrevistas a 10–15 conductores (mezcla de domiciliarios, mensajeros, trabajadores y usuarios normales). Preguntar por comportamiento pasado, no hipotético; mostrar el concepto solo al final.

**Señales positivas:** ≥ 60 % ha olvidado un mantenimiento o documento; ≥ 50 % aceptaría confirmar el km semanalmente; la mayoría entiende la pantalla de estado sin explicación.

**Señales de alerta:** "eso lo hace el mecánico por mí", "no anotaría nada", "ya uso otra app y me basta".

**Pregunta adicional (para el módulo futuro de Repuestos):** "Cuando le toca cambiar algo a tu carro, ¿cómo sabes qué comprar y dónde? ¿Quién te dice la referencia?"

Los resultados deben revisarse contra este documento y ajustarlo si es necesario.
