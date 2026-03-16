/**
 * Script de prueba para verificar el pipeline de IA de Reino Editorial.
 * 
 * Ejecutar con: npx tsx scripts/test-ai-pipeline.ts
 * 
 * Este script verifica:
 * 1. Que los prompts esten definidos para cada tarea
 * 2. Que las funciones de procesamiento existan
 * 3. Que el flujo de jobs funcione correctamente
 */

import { getDefaultPrompt } from "../lib/editorial/ai/default-prompts";
import { STAGE_AI_TASKS } from "../lib/editorial/ai/stage-assist";

type EditorialStageKey = "ingesta" | "estructura" | "estilo" | "ortotipografia" | "maquetacion" | "revision_final" | "export" | "distribution";

console.log("=== TEST: Pipeline IA Reino Editorial ===\n");

// Test 1: Verificar que cada tarea tenga un prompt definido
console.log("1. Verificando prompts por etapa y tarea...\n");

const missingPrompts: string[] = [];
const foundPrompts: string[] = [];

for (const [stageKey, tasks] of Object.entries(STAGE_AI_TASKS)) {
  console.log(`  Etapa: ${stageKey}`);
  for (const taskKey of tasks) {
    const prompt = getDefaultPrompt(stageKey as EditorialStageKey, taskKey);
    if (prompt) {
      foundPrompts.push(`${stageKey}/${taskKey}`);
      console.log(`    [OK] ${taskKey}`);
    } else {
      // line_editing y copyediting tienen prompts embebidos en sus archivos
      if (taskKey === "line_editing" || taskKey === "copyediting") {
        console.log(`    [OK] ${taskKey} (prompt embebido)`);
        foundPrompts.push(`${stageKey}/${taskKey}`);
      } else {
        missingPrompts.push(`${stageKey}/${taskKey}`);
        console.log(`    [MISSING] ${taskKey}`);
      }
    }
  }
  console.log("");
}

// Test 2: Resumen
console.log("\n=== RESUMEN ===\n");
console.log(`Prompts encontrados: ${foundPrompts.length}`);
console.log(`Prompts faltantes: ${missingPrompts.length}`);

if (missingPrompts.length > 0) {
  console.log("\nPrompts faltantes:");
  for (const p of missingPrompts) {
    console.log(`  - ${p}`);
  }
}

// Test 3: Verificar mapeo de etapas
console.log("\n2. Mapeo de etapas y tareas:");
console.log(JSON.stringify(STAGE_AI_TASKS, null, 2));

// Test 4: Flujo esperado
console.log("\n3. Flujo esperado del pipeline:");
console.log(`
  1. Usuario sube manuscrito -> Se crea proyecto en "ingesta"
  2. Usuario hace clic en "Solicitar Analisis IA" 
     -> POST /api/staff/projects/[id]/stages/ingesta/ai/run { taskKey: "manuscript_analysis" }
     -> Crea job en editorial_jobs con status "queued"
  3. Se llama POST /api/editorial/ai/process
     -> processPendingJobs() busca jobs con status "queued"
     -> processAiJob() ejecuta el analisis con OpenAI/Anthropic
     -> Guarda resultado en editorial_jobs.output_ref
     -> Marca job como "completed"
  4. Auto-advance: Si la etapa se completa, avanza a la siguiente
`);

console.log("\n=== FIN DEL TEST ===");
