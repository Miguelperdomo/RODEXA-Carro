# RODEXA Carro Repuestos — Concepto del módulo futuro

> **Estado:** concepto aprobado para el roadmap. **NO forma parte del MVP. NO se programa todavía.**
> **Fecha:** 28/09/2026 · Referencia principal: [diseno-funcional.md](diseno-funcional.md)
> **Alcance:** módulo de **RODEXA Carro**, solo carros ("Repuestos para mi carro"). Un futuro RODEXA Auto tendría su propio "Repuestos para mi carro" — no se implementa ahora.

---

## 1. Idea

Cuando RODEXA Carro detecta que un mantenimiento se acerca, además de avisar debe poder ayudar al usuario a saber **qué necesita su carro, qué opciones tiene y cuánto podría costar**.

```
🟡 Alineación y balanceo — Próximo · Faltan ~200 km
   [ Ver opciones para tu carro ]
```

**Cadena de confianza obligatoria:**

```
Carro → marca/modelo/año/cilindraje → componente → especificación
     → referencia compatible → fuente → precio aproximado (fecha, ciudad, fuente)
```

Si falta cualquier eslabón confiable, RODEXA Carro dice:

> ⚠️ No tenemos suficiente información para confirmar la referencia exacta.

## 2. Niveles

| Nivel | Nombre | Qué hace | Riesgo |
|---|---|---|---|
| **0** | **Especificación** | Muestra lo que el fabricante indica para tu carro: p. ej. tipo/viscosidad de aceite, medida de llanta, kit de distribución, tipo de bujía. Sin marcas ni precios. | Bajo |
| **1** | **Recomendación** | Referencias de productos compatibles con esa especificación + precio aproximado con fuente y fecha. | Medio |
| **2** | **Comparación** | 💰 Económica · ⚖️ Calidad/precio · 🏆 Premium, con criterios explícitos, diferencias, compatibilidad y precio. | Medio |
| **3** | **Compra / instalación** | Dónde comprar (tiendas, distribuidores, aliados) y "¿Quieres comprarlo o encontrar un taller que lo instale?" | Alto |

El **Nivel 0** se agregó porque entrega mucho valor con poco riesgo: saber *qué especificación* necesita el carro ya resuelve la pregunta "¿qué aceite le echo?" sin comprometerse con marcas ni precios.

**Componentes objetivo (por prioridad):** aceite, alineación y balanceo, llantas, bujía, pastillas de freno, batería, filtro de aire, bombillos, cables. Repuestos específicos y piezas pequeñas (tornillería) solo cuando exista información suficiente; es probable que nunca sea viable cubrirlos de forma exhaustiva.

## 3. Reglas de confiabilidad

1. **Nunca inventar** referencias, compatibilidades ni precios.
2. Toda compatibilidad tiene **fuente** y **nivel de confianza**. Sin fuente → no se muestra.
3. Los precios siempre son **aproximados**, en **rango**, con **fecha**, **ciudad** (si aplica) y **fuente**.
4. Nunca decir "el mejor". Las categorías se explican con criterios visibles.
5. Componentes de **seguridad** (frenos, llantas) muestran siempre: "Verifica con tu mecánico antes de comprar o instalar".
6. **El orden de las opciones nunca depende de quién paga.** Todo contenido patrocinado se marca como "Patrocinado" y va separado.
7. Si el modelo/año/versión del carro no está confirmado en el catálogo, solo se muestra Nivel 0 genérico o el mensaje de información insuficiente.

## 4. Niveles de confianza de una compatibilidad

| Nivel | Fuente | Se muestra como |
|---|---|---|
| A | Manual del fabricante del carro / referencia original (OEM) | ✅ Confirmado por el fabricante |
| B | Catálogo de aplicaciones del fabricante del repuesto | ✅ Según catálogo de [marca] |
| C | Verificado por mecánico aliado | ☑️ Verificado por taller |
| D | Reportado por usuarios (varios reportes coincidentes) | 👥 Reportado por usuarios — verifica antes de comprar |
| — | Sin fuente | No se muestra |

## 5. Criterios de clasificación (Nivel 2)

Los criterios exactos deben definirse y publicarse antes de lanzar el Nivel 2. Propuesta inicial:

- **💰 Económica:** la opción compatible de menor precio aproximado entre las que tienen fuente de confianza A–C.
- **⚖️ Calidad/precio:** marca reconocida del repuesto con precio en el rango medio de las opciones compatibles.
- **🏆 Premium / Original:** referencia original (OEM) o especificación superior documentada.

Cada tarjeta muestra el **porqué** de su categoría.

## 6. Arquitectura futura (sin implementar)

### 6.1 Principio

El catálogo **vive en el servidor** (Supabase), no dentro de la app: es grande, cambia constantemente y debe corregirse sin publicar una nueva versión. La app guarda una **caché local** de lo que el usuario consultó, para verlo sin internet.

### 6.2 Entidades del catálogo (servidor)

```
vehicle_makes           marcas (Chevrolet, Renault, Mazda…)
vehicle_models          modelo + cilindraje (Onix, 1000 cc)
vehicle_variants        años/versión/mercado (Onix 1.0 Turbo 2020–2024, Colombia)

part_categories         aceite, kit_distribucion, bujia, pastillas_freno_del, …
                        (mapeo desde service_types del MVP)
part_specs              especificación por variante + categoría
                        (ej. aceite: viscosidad/norma; llanta: medida; correa: referencia y dientes)

products                marca del repuesto, referencia, categoría, atributos técnicos
product_compatibility   producto ↔ variante, fuente, nivel de confianza, verificado_en
sources                 manual, catálogo de fabricante, taller, usuarios (con URL/documento)

price_observations      producto, precio_cop, tienda/fuente, ciudad, observado_en
stores / partners       tiendas y aliados (Nivel 3)
```

### 6.3 En la app

```
src/features/parts/          ← módulo nuevo, se enchufa sin tocar los demás
  services/partsCatalog.ts   ← interfaz: getOptions(car, component)
  components/                ← tarjetas de especificación, opciones, comparación
```

Respuesta del servicio (siempre con confianza explícita):

```ts
type PartsLookupResult =
  | { status: 'confirmed'; spec; options: PartOption[]; sources; updatedAt }
  | { status: 'spec_only'; spec; sources; updatedAt }   // Nivel 0
  | { status: 'insufficient'; reason }                  // ⚠️ mensaje estándar
```

- Punto de entrada: detalle de un componente en el dashboard → "Ver opciones para tu carro".
- Se activa con un **feature flag**, para liberarlo por etapas.
- Las preguntas en lenguaje natural ("¿Qué bujía necesita mi carro?") se resuelven primero con un flujo guiado (elegir componente → respuesta). Si en el futuro se usa IA, **solo podrá responder con datos del catálogo** y sus fuentes, nunca generar referencias por sí misma.

## 7. Preparación desde el MVP (sin cambiar funcionalidades)

| Preparación | Estado |
|---|---|
| Guardar la **marca como código normalizado** (de la lista de marcas del onboarding) además del texto | Incluido en el diseño del MVP |
| Guardar año y cilindraje como campos separados (opcionales) | Ya en el modelo |
| `service_types.code` estables (`oil`, `alignment`, …) para mapearlos después a `part_categories` | Ya en el modelo |
| Tipo `Recommendation` con **acciones extensibles** (hoy: "Registrar"; mañana: "Ver opciones") | Se implementará así en la Fase 5 |
| Estructura modular por `features/` + sistema simple de feature flags | Fase 1 |
| Campo `vehicle_variant_id` en `cars` | **No ahora**: se agrega con una migración cuando exista el catálogo |
| Campos opcionales "marca/referencia del repuesto usado" en mantenimientos | **Propuesta pendiente de aprobación** (ver §10) |

## 8. Información necesaria y a investigar

| Información | Posibles fuentes (a investigar) |
|---|---|
| Especificaciones por modelo | Manuales del propietario, fichas técnicas de fabricantes y ensambladoras en Colombia |
| Compatibilidades de repuestos | Catálogos de aplicación de fabricantes de repuestos (bujías, correas, baterías, llantas, filtros) |
| Validación práctica | Mecánicos aliados |
| Precios | Tiendas y distribuidores aliados, marketplaces (revisar términos de uso; no hacer scraping sin autorización), precios reportados por usuarios |
| Variantes del mercado colombiano | Ensambladoras/importadores; un mismo modelo puede cambiar entre años |

**Pendiente de investigar antes de construir:** disponibilidad de catálogos en formato usable, programas de afiliados que operen en Colombia, condiciones legales de publicar precios de terceros, y requisitos del Estatuto del Consumidor (Ley 1480 de 2011) y de protección de datos (Ley 1581 de 2012). Recomendado: revisión con asesor legal.

## 9. Riesgos

| Riesgo | Consecuencia | Mitigación |
|---|---|---|
| Referencia incorrecta | Daño al motor, gasto perdido | Cadena de fuentes, niveles de confianza, mensaje de información insuficiente |
| Error en frenos o llantas | **Riesgo de seguridad** | Aviso obligatorio de verificar con mecánico; solo fuentes A–C |
| Variantes del mismo modelo entre años | Compatibilidad falsa | Catálogo por variante (años/versión), no solo por nombre |
| Precios desactualizados | Pérdida de confianza | Rangos, fecha visible, caducidad automática de precios viejos |
| Repuestos falsificados en el mercado | Usuario compra imitaciones | Aliados verificados en Nivel 3; advertencias |
| Conflicto de interés por comisiones | Destruye la confianza (el activo principal) | Orden independiente del pago; "Patrocinado" visible |
| Costo de mantener el catálogo | Inviable si se intenta cubrir todo | Empezar por pocas categorías y los modelos más populares |
| Responsabilidad legal | Reclamaciones | Términos claros, asesoría legal, lenguaje de "opciones", no de instrucciones |

## 10. Presentación al usuario (concepto)

```
⚙️ Kit de distribución · Chevrolet Onix (2023)

ESPECIFICACIÓN                      ✅ Según manual del fabricante
  Correa: [referencia] · [número de dientes] · [ancho] · Tensor [sí/no]

OPCIONES                            Precios aprox. · Bogotá · 12/09/2026
  💰 Económica        $XX.000 – $XX.000   ›
     Por qué: menor precio entre opciones compatibles verificadas
  ⚖️ Calidad/precio   $XX.000 – $XX.000   ›
  🏆 Original         $XX.000 – $XX.000   ›

  ℹ️ Los precios varían según tienda, ciudad y fecha.
  🔧 Verifica con tu mecánico antes de comprar.

  [ ¿Dónde comprarlo? ]  [ ¿Buscar taller que lo instale? ]   ← Nivel 3
```

Sin información suficiente:

```
⚠️ No tenemos suficiente información para confirmar la referencia exacta
   para tu Chevrolet Onix.
   Te recomendamos revisar el manual o llevar el repuesto usado al almacén.
```

## 11. Modelo de negocio potencial (solo después de validar el MVP)

| Opción | Esfuerzo | Potencial | Riesgo para la confianza | Orden sugerido |
|---|---|---|---|---|
| Afiliados (enlaces con comisión) | Bajo | Bajo–medio (requiere volumen) | Bajo si se marca | 1 |
| Leads a tiendas locales (contacto por WhatsApp, pago por contacto) | Medio | Medio | Bajo | 1 |
| Alianzas con tiendas/distribuidores | Medio | Medio–alto | Medio | 2 |
| Talleres (instalación, citas, listado destacado) | Medio–alto | Medio–alto | Medio | 3 |
| Publicidad de negocios relacionados | Bajo | Bajo–medio | **Alto** si no se separa | Con cuidado |
| Datos agregados y anonimizados de demanda para distribuidores | Medio | Alto | Alto (requiere consentimiento explícito) | Evaluar |
| Marketplace propio (pagos, logística, devoluciones) | **Muy alto** | Alto | Alto | Último / posiblemente nunca |

**Principio:** la monetización nunca altera el orden ni el contenido de las recomendaciones.

## 12. Condiciones para empezar

1. MVP publicado y con retención demostrada.
2. Entrevistas confirman el problema ("¿cómo sabes qué comprar y dónde?").
3. Fuentes de datos confiables identificadas para al menos 3 categorías y los modelos más populares.
4. Revisión legal básica.
