import type { EditorialPipelineStageKey } from "../types/editorial";
import type { JourneyStageConfig } from "./types";

/**
 * The 12-day editorial journey configuration.
 * Maps each editorial stage to a day, title, messages, and artifact hints.
 */
export const JOURNEY_STAGES: JourneyStageConfig[] = [
  {
    stageKey: "ingesta",
    day: 1,
    title: "Recepcion del Manuscrito",
    clientTitle: "Manuscrito Recibido",
    description: "Tu manuscrito ha sido recibido y registrado en nuestro sistema editorial.",
    activeMessage: "Nuestro equipo esta revisando tu manuscrito para preparar el proceso editorial.",
    completedMessage: "Manuscrito registrado exitosamente. Todo listo para comenzar.",
    artifactHint: "Confirmacion de recepcion",
    icon: "BookOpen",
  },
  {
    stageKey: "estructura",
    day: 3,
    title: "Analisis Estructural",
    clientTitle: "Analisis de Estructura",
    description: "Analizamos la estructura narrativa, los capitulos y el flujo de tu obra.",
    activeMessage: "Nuestros editores estan analizando la estructura y el arco narrativo de tu libro.",
    completedMessage: "El analisis estructural ha sido completado. Tu obra tiene una base solida.",
    artifactHint: "Reporte de estructura narrativa",
    icon: "LayoutList",
  },
  {
    stageKey: "estilo",
    day: 5,
    title: "Correccion de Estilo",
    clientTitle: "Edicion de Estilo",
    description: "Refinamos el estilo literario, la voz narrativa y la coherencia del texto.",
    activeMessage: "Trabajamos en pulir el estilo y la voz unica de tu obra.",
    completedMessage: "La correccion de estilo ha finalizado. Tu voz literaria brilla.",
    artifactHint: "Comparacion antes/despues del texto",
    icon: "Pen",
  },
  {
    stageKey: "ortotipografia",
    day: 6,
    title: "Correccion Ortotipografica",
    clientTitle: "Revision Ortotipografica",
    description: "Revisamos ortografia, tipografia, puntuacion y formato del texto.",
    activeMessage: "Revision exhaustiva de ortografia y tipografia profesional en proceso.",
    completedMessage: "Correccion ortotipografica completada. Texto impecable.",
    artifactHint: "Reporte de correcciones aplicadas",
    icon: "SpellCheck",
  },
  {
    stageKey: "maquetacion",
    day: 8,
    title: "Diseno Interior",
    clientTitle: "Maquetacion del Libro",
    description: "Disenamos el interior de tu libro con tipografia y layout profesional.",
    activeMessage: "Nuestros disenadores crean el interior de tu libro con layout editorial profesional.",
    completedMessage: "El diseno interior esta listo. Tu libro tiene una presentacion profesional.",
    artifactHint: "Vista previa de paginas interiores",
    icon: "Layout",
  },
  {
    stageKey: "revision_final",
    day: 10,
    title: "Revision Final",
    clientTitle: "Prueba Final",
    description: "Ultima revision exhaustiva antes de la publicacion.",
    activeMessage: "Tu libro esta en la revision final exhaustiva. Verificamos cada detalle.",
    completedMessage: "Revision final aprobada. Tu libro esta perfecto.",
    artifactHint: "Vista previa del PDF final",
    icon: "CheckCircle",
  },
  {
    stageKey: "export",
    day: 11,
    title: "Preparacion de Archivos",
    clientTitle: "Archivos Finales",
    description: "Generamos todos los archivos necesarios para la publicacion.",
    activeMessage: "Preparando los archivos finales de tu libro para publicacion.",
    completedMessage: "Archivos finales generados. Todo listo para publicar.",
    artifactHint: "Vista previa de la portada y mockup",
    icon: "FileOutput",
  },
  {
    stageKey: "distribution",
    day: 12,
    title: "Listo para Publicar",
    clientTitle: "Publicacion",
    description: "Tu libro esta listo para ser publicado y distribuido.",
    activeMessage: "Configurando la distribucion de tu obra en las plataformas seleccionadas.",
    completedMessage: "!Tu libro esta listo para el mundo! Felicidades, autor.",
    artifactHint: "Mockup del libro publicado",
    icon: "Rocket",
  },
];

/** Map from stage key to journey config for quick lookup. */
export const JOURNEY_STAGE_MAP: Record<EditorialPipelineStageKey, JourneyStageConfig> =
  Object.fromEntries(JOURNEY_STAGES.map((s) => [s.stageKey, s])) as Record<
    EditorialPipelineStageKey,
    JourneyStageConfig
  >;

/** Total days in the editorial journey. */
export const JOURNEY_TOTAL_DAYS = 12;
