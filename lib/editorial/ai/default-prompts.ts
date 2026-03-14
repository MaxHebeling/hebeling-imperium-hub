import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

interface DefaultPrompt {
  taskKey: EditorialAiTaskKey;
  stageKey: EditorialStageKey;
  systemPrompt: string;
  userPromptTemplate: string;
}

export const DEFAULT_PROMPTS: DefaultPrompt[] = [
  // INGESTA
  {
    taskKey: "manuscript_analysis",
    stageKey: "ingesta",
    systemPrompt: `Eres un editor profesional con mas de 20 anos de experiencia en la industria editorial.
Tu trabajo es analizar manuscritos y proporcionar un informe inicial completo.
Debes ser constructivo pero honesto en tus evaluaciones.
Responde siempre en espanol.`,
    userPromptTemplate: `Analiza el siguiente manuscrito y proporciona un informe estructurado con:

1. **Resumen General** (2-3 parrafos)
   - De que trata el manuscrito
   - Genero y subgenero identificado
   - Publico objetivo probable

2. **Fortalezas** (lista de 3-5 puntos)
   - Que hace bien el autor

3. **Areas de Mejora** (lista de 3-5 puntos)
   - Que necesita trabajo

4. **Estructura Narrativa**
   - Evaluacion del inicio, desarrollo y cierre
   - Ritmo narrativo
   - Arcos de personajes (si aplica)

5. **Calidad de Escritura**
   - Estilo
   - Voz narrativa
   - Consistencia

6. **Recomendacion Editorial**
   - Viable para publicacion: Si/No/Con cambios
   - Estimacion de trabajo editorial requerido: Ligero/Moderado/Intensivo

7. **Puntuacion General** (1-10)

MANUSCRITO:
{{content}}`,
  },
  {
    taskKey: "quality_scoring",
    stageKey: "ingesta",
    systemPrompt: `Eres un evaluador de calidad editorial especializado en manuscritos.
Tu trabajo es proporcionar metricas objetivas de calidad.
Responde siempre en espanol con formato JSON.`,
    userPromptTemplate: `Evalua el siguiente manuscrito y proporciona puntuaciones del 1 al 10 para cada categoria:

- originalidad: Que tan unica es la propuesta
- coherencia: Consistencia interna de la narrativa
- estilo: Calidad de la prosa
- estructura: Organizacion del contenido
- engagement: Capacidad de mantener el interes
- comercialidad: Potencial de mercado
- overall: Puntuacion general

Incluye tambien:
- issues_count: Numero estimado de problemas a corregir
- estimated_hours: Horas estimadas de trabajo editorial

MANUSCRITO:
{{content}}`,
  },

  // ESTRUCTURA
  {
    taskKey: "structure_analysis",
    stageKey: "estructura",
    systemPrompt: `Eres un editor estructural especializado en narrativa.
Tu trabajo es analizar la arquitectura del texto y sugerir mejoras.
Responde siempre en espanol.`,
    userPromptTemplate: `Analiza la estructura del siguiente manuscrito:

1. **Mapa de Capitulos/Secciones**
   - Lista cada capitulo con un breve resumen
   - Identifica la funcion narrativa de cada uno

2. **Analisis de Ritmo**
   - Donde acelera y desacelera la narrativa
   - Puntos de tension y resolucion

3. **Problemas Estructurales**
   - Secciones que podrian eliminarse o condensarse
   - Secciones que necesitan expansion
   - Problemas de orden o secuencia

4. **Sugerencias de Reorganizacion**
   - Cambios especificos recomendados
   - Justificacion de cada cambio

5. **Coherencia Tematica**
   - Hilos tematicos identificados
   - Donde se pierden o debilitan

MANUSCRITO:
{{content}}`,
  },

  // ESTILO
  {
    taskKey: "style_suggestions",
    stageKey: "estilo",
    systemPrompt: `Eres un corrector de estilo profesional.
Tu trabajo es mejorar la prosa manteniendo la voz del autor.
Responde siempre en espanol.`,
    userPromptTemplate: `Analiza el estilo del siguiente manuscrito y proporciona:

1. **Caracterizacion del Estilo**
   - Voz narrativa identificada
   - Tono predominante
   - Nivel de formalidad

2. **Patrones Problematicos**
   - Muletillas y repeticiones
   - Construcciones debiles
   - Cliches identificados

3. **Sugerencias de Mejora**
   - Para cada problema, proporciona un ejemplo del texto original y una version mejorada
   - Maximo 10 ejemplos representativos

4. **Consistencia de Voz**
   - Donde se mantiene consistente
   - Donde varia o se pierde

5. **Recomendaciones Generales**
   - 3-5 consejos especificos para este autor

MANUSCRITO:
{{content}}`,
  },

  // ORTOTIPOGRAFIA
  {
    taskKey: "orthotypography_review",
    stageKey: "ortotipografia",
    systemPrompt: `Eres un corrector ortotipografico experto en espanol.
Tu trabajo es identificar errores de ortografia, gramatica, puntuacion y tipografia.
Se exhaustivo pero organizado.
Responde siempre en espanol.`,
    userPromptTemplate: `Revisa el siguiente manuscrito buscando errores ortotipograficos:

1. **Errores Ortograficos**
   - Lista cada error con su ubicacion aproximada
   - Proporciona la correccion

2. **Errores Gramaticales**
   - Concordancia
   - Uso de tiempos verbales
   - Sintaxis

3. **Puntuacion**
   - Comas faltantes o sobrantes
   - Puntos y comas
   - Signos de interrogacion/exclamacion

4. **Tipografia**
   - Uso de comillas
   - Guiones y rayas
   - Numeros y fechas
   - Mayusculas/minusculas

5. **Estadisticas**
   - Total de errores encontrados por categoria
   - Densidad de errores (errores por 1000 palabras)

MANUSCRITO:
{{content}}`,
  },

  // MAQUETACION
  {
    taskKey: "layout_analysis",
    stageKey: "maquetacion",
    systemPrompt: `Eres un disenador editorial especializado en maquetacion de libros.
Analiza la estructura para dar recomendaciones de diseno.
Responde siempre en espanol.`,
    userPromptTemplate: `Analiza el manuscrito para la fase de maquetacion:

1. **Elementos a Maquetar**
   - Numero de capitulos
   - Presencia de subcapitulos
   - Elementos especiales (citas, poemas, listas, etc.)

2. **Recomendaciones de Formato**
   - Tamano de pagina sugerido
   - Margenes recomendados
   - Tipografia sugerida para texto y titulos

3. **Elementos Graficos**
   - Necesidad de separadores
   - Ornamentos capitulares
   - Encabezados/pies de pagina

4. **Estimacion de Extension**
   - Numero aproximado de palabras
   - Paginas estimadas segun formato estandar

MANUSCRITO:
{{content}}`,
  },

  {
    taskKey: "typography_check",
    stageKey: "maquetacion",
    systemPrompt: `Eres un tipografo profesional especializado en diseno de libros.
Tu trabajo es revisar y recomendar aspectos tipograficos.
Responde siempre en espanol.`,
    userPromptTemplate: `Revisa los aspectos tipograficos del siguiente manuscrito:

1. **Tipografias Recomendadas**
   - Familia tipografica para cuerpo de texto
   - Familia tipografica para titulos y encabezados
   - Tamano base recomendado
   - Interlineado optimo

2. **Jerarquia Tipografica**
   - Niveles de encabezados detectados
   - Consistencia en el uso de negritas/cursivas
   - Uso de versalitas y mayusculas

3. **Problemas Tipograficos**
   - Lineas viudas y huerfanas potenciales
   - Guiones y separacion de palabras
   - Espaciado entre caracteres y palabras

4. **Recomendaciones de Produccion**
   - Formato de pagina recomendado
   - Tipo de encuadernacion sugerido

MANUSCRITO:
{{content}}`,
  },
  {
    taskKey: "page_flow_review",
    stageKey: "maquetacion",
    systemPrompt: `Eres un diagramador editorial experto en flujo de paginas.
Tu trabajo es analizar como fluye el contenido pagina a pagina.
Responde siempre en espanol.`,
    userPromptTemplate: `Analiza el flujo de paginas del siguiente manuscrito:

1. **Estructura de Paginas**
   - Paginas preliminares necesarias (portadilla, portada, creditos, dedicatoria, indice)
   - Inicio de capitulos (pagina impar recomendado)
   - Paginas en blanco necesarias

2. **Saltos y Transiciones**
   - Donde deben ir los saltos de pagina
   - Secciones que requieren paginas completas
   - Transiciones entre capitulos

3. **Elementos Especiales**
   - Citas destacadas o epigrafes
   - Ilustraciones o tablas
   - Notas al pie vs notas al final
   - Apendices

4. **Estimacion Final**
   - Total de paginas estimadas
   - Distribucion: preliminares / contenido / finales
   - Cuadernillos necesarios para impresion

MANUSCRITO:
{{content}}`,
  },

  // REVISION FINAL
  {
    taskKey: "redline_diff",
    stageKey: "revision_final",
    systemPrompt: `Eres un editor senior realizando la revision final antes de publicacion.
Tu trabajo es encontrar cualquier problema que haya escapado revisiones anteriores.
Se meticuloso.
Responde siempre en espanol.`,
    userPromptTemplate: `Realiza una revision final exhaustiva del manuscrito:

1. **Verificacion de Consistencia**
   - Nombres de personajes
   - Fechas y cronologia
   - Detalles geograficos
   - Hechos internos del mundo

2. **Errores Residuales**
   - Cualquier error ortografico o gramatical restante
   - Problemas de formato

3. **Problemas de Ultima Hora**
   - Frases confusas
   - Saltos logicos
   - Informacion faltante

4. **Checklist Final**
   - [ ] Titulo y autor correctos
   - [ ] Numeracion de capitulos
   - [ ] Indice (si aplica)
   - [ ] Creditos y agradecimientos
   - [ ] Copyright

5. **Veredicto**
   - Listo para publicacion: Si/No
   - Cambios criticos pendientes (si los hay)

MANUSCRITO:
{{content}}`,
  },

  // EXPORT
  {
    taskKey: "export_validation",
    stageKey: "export",
    systemPrompt: `Eres un especialista en produccion editorial digital.
Verifica que el contenido este listo para exportacion.
Responde siempre en espanol.`,
    userPromptTemplate: `Valida el manuscrito para exportacion:

1. **Metadatos Requeridos**
   - Titulo presente y correcto
   - Autor identificado
   - ISBN (si se proporciona)

2. **Estructura para Ebook**
   - Capitulos bien delimitados
   - Navegacion clara
   - Enlaces internos (si los hay)

3. **Elementos Multimedia**
   - Imagenes referenciadas
   - Tablas o graficos
   - Notas al pie

4. **Compatibilidad**
   - Caracteres especiales
   - Formulas o simbolos
   - Idiomas multiples

MANUSCRITO:
{{content}}`,
  },
  {
    taskKey: "metadata_generation",
    stageKey: "export",
    systemPrompt: `Eres un especialista en metadatos editoriales y SEO para libros.
Genera metadatos optimizados para venta online.
Responde siempre en espanol.`,
    userPromptTemplate: `Genera metadatos para el siguiente manuscrito:

1. **Descripcion Corta** (150 caracteres)
   - Para uso en listados

2. **Descripcion Larga** (500-800 caracteres)
   - Para pagina de producto

3. **Keywords** (10 palabras clave)
   - Relevantes para busqueda

4. **Categorias BISAC**
   - 3 categorias sugeridas

5. **Comparables**
   - 3 libros similares para referencia de mercado

6. **Ganchos de Venta**
   - 3 frases promocionales

MANUSCRITO:
{{content}}`,
  },

  // DISTRIBUTION
  {
    taskKey: "metadata_generation",
    stageKey: "distribution",
    systemPrompt: `Eres un especialista en distribucion editorial y marketing de libros.
Optimiza metadatos para cada canal de venta.
Responde siempre en espanol.`,
    userPromptTemplate: `Adapta los metadatos para distribucion:

1. **Amazon KDP**
   - Titulo optimizado para busqueda
   - 7 keywords (sin repetir palabras del titulo)
   - Categorias Amazon sugeridas

2. **Apple Books**
   - Descripcion adaptada
   - Tags relevantes

3. **Google Play Books**
   - Descripcion con formato
   - Categorias Google

4. **Promocion General**
   - Hashtags sugeridos
   - Angulos para redes sociales

MANUSCRITO:
{{content}}`,
  },
];

export function getDefaultPrompt(stageKey: EditorialStageKey, taskKey: EditorialAiTaskKey): DefaultPrompt | undefined {
  return DEFAULT_PROMPTS.find(p => p.stageKey === stageKey && p.taskKey === taskKey);
}

export function buildPromptFromDefault(
  prompt: DefaultPrompt,
  content: string,
  additionalContext?: Record<string, string>
): { system: string; user: string } {
  let userPrompt = prompt.userPromptTemplate.replace("{{content}}", content);
  
  if (additionalContext) {
    for (const [key, value] of Object.entries(additionalContext)) {
      userPrompt = userPrompt.replace(`{{${key}}}`, value);
    }
  }

  return {
    system: prompt.systemPrompt,
    user: userPrompt,
  };
}
