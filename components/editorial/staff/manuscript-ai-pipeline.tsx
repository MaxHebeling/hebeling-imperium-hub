"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Download,
} from "lucide-react";

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
}

interface AiSuggestion {
  id: string;
  severity: "critical" | "warning" | "info";
  original_text: string;
  suggested_text: string;
  applied: boolean;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "upload",
    label: "Upload Manuscript",
    description: "Preparing your manuscript",
    status: "completed",
    progress: 100,
  },
  {
    id: "ai-editing",
    label: "AI Editing",
    description: "AI analyzing content structure",
    status: "processing",
    progress: 65,
  },
  {
    id: "ai-corrections",
    label: "AI Corrections",
    description: "Generating corrections",
    status: "pending",
    progress: 0,
  },
  {
    id: "apply-revisions",
    label: "Apply Revisions",
    description: "Applying selected changes",
    status: "pending",
    progress: 0,
  },
  {
    id: "generate-manuscript",
    label: "Generate Edited Manuscript",
    description: "Creating final output",
    status: "pending",
    progress: 0,
  },
];

const AI_SUGGESTIONS: AiSuggestion[] = [
  {
    id: "1",
    severity: "critical",
    original_text: "The book have good ideas",
    suggested_text: "The book has good ideas",
    applied: false,
  },
  {
    id: "2",
    severity: "warning",
    original_text: "He went to the store yesterday, and bought milk",
    suggested_text: "He went to the store yesterday and bought milk",
    applied: false,
  },
  {
    id: "3",
    severity: "info",
    original_text: "The character walked through the dark, mysterious forest",
    suggested_text: "The character walked through the dark, mysterious forest (consider: too many adjectives)",
    applied: true,
  },
  {
    id: "4",
    severity: "critical",
    original_text: "The building's facade was amazing",
    suggested_text: "The building's facade was striking (stronger verb)",
    applied: false,
  },
  {
    id: "5",
    severity: "info",
    original_text: "The team worked hard on the project for 3 months",
    suggested_text: "Consider: specify the team size or provide more context",
    applied: false,
  },
];

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-700 border-red-500/20";
    case "warning":
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    case "info":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="w-4 h-4" />;
    case "warning":
      return <AlertCircle className="w-4 h-4" />;
    case "info":
      return <Zap className="w-4 h-4" />;
    default:
      return <CheckCircle2 className="w-4 h-4" />;
  }
}

function getStepStatusColor(
  status: string
): { bg: string; text: string; border: string } {
  switch (status) {
    case "completed":
      return {
        bg: "bg-green-500/10",
        text: "text-green-700",
        border: "border-green-500/30",
      };
    case "processing":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-700",
        border: "border-blue-500/30",
      };
    case "error":
      return {
        bg: "bg-red-500/10",
        text: "text-red-700",
        border: "border-red-500/30",
      };
    default:
      return {
        bg: "bg-gray-500/10",
        text: "text-gray-700",
        border: "border-gray-500/30",
      };
  }
}

function getStepIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "processing":
      return (
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      );
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-400" />;
  }
}

export function ManuscriptAiPipeline() {
  const [steps, setSteps] = useState<PipelineStep[]>(PIPELINE_STEPS);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>(AI_SUGGESTIONS);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    new Set()
  );

  const toggleSuggestion = (id: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSuggestions(newSelected);
  };

  const toggleApplyAll = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(suggestions.map((s) => s.id)));
    }
  };

  const criticalCount = suggestions.filter(
    (s) => s.severity === "critical"
  ).length;
  const warningCount = suggestions.filter(
    (s) => s.severity === "warning"
  ).length;
  const infoCount = suggestions.filter((s) => s.severity === "info").length;
  const appliedCount = suggestions.filter((s) => s.applied).length;

  const overallProgress = Math.round(
    (steps.reduce((acc, step) => acc + step.progress, 0) / steps.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header Card with CTA */}
      <Card className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Generar Libro Automático
              </h2>
              <p className="text-slate-300">
                Procesa tu manuscrito con IA para correcciones automáticas
              </p>
            </div>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Iniciar Procesamiento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Progreso General</CardTitle>
            <span className="text-2xl font-bold text-blue-600">
              {overallProgress}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Pipeline Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline de Procesamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const colors = getStepStatusColor(step.status);
              return (
                <div key={step.id}>
                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <div className="mt-0.5">{getStepIcon(step.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-foreground">
                          {step.label}
                        </h4>
                        {step.status === "processing" && (
                          <Badge variant="outline" className="text-xs">
                            {step.progress}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {step.description}
                      </p>
                      {step.status === "processing" && (
                        <Progress value={step.progress} className="h-1.5" />
                      )}
                      {step.status === "completed" && (
                        <Progress value={100} className="h-1.5" />
                      )}
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-0.5 h-4 bg-gradient-to-b from-slate-300 to-transparent" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg mb-2">
                Sugerencias de IA
              </CardTitle>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Badge variant="destructive" className="text-xs">
                    {criticalCount} Crítico
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {warningCount} Advertencia
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {infoCount} Info
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-xs">{appliedCount} Aplicado</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleApplyAll}
              className="gap-2"
            >
              <Checkbox
                checked={selectedSuggestions.size === suggestions.length}
                onChange={() => {}}
                className="w-4 h-4"
              />
              {selectedSuggestions.size === suggestions.length
                ? "Deseleccionar todo"
                : "Seleccionar todo"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedSuggestions.size === suggestions.length
                      }
                      onChange={toggleApplyAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    Severidad
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    Texto Original
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    Texto Sugerido
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion) => (
                  <TableRow
                    key={suggestion.id}
                    className="border-border/50 hover:bg-muted/50"
                  >
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedSuggestions.has(suggestion.id)}
                        onChange={() => toggleSuggestion(suggestion.id)}
                        disabled={suggestion.applied}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${getSeverityColor(
                          suggestion.severity
                        )}`}
                      >
                        {getSeverityIcon(suggestion.severity)}
                        {suggestion.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      "{suggestion.original_text}"
                    </TableCell>
                    <TableCell className="text-sm font-mono text-green-700 dark:text-green-400 max-w-xs truncate">
                      "{suggestion.suggested_text}"
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Descartar cambios
        </Button>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <Download className="w-4 h-4" />
          Aplicar cambios y generar nueva versión
        </Button>
      </div>
    </div>
  );
}
