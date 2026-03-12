'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Lightbulb,
  BookOpen,
} from 'lucide-react';

export type AiFindingSeverity = 'critical' | 'warning' | 'info' | 'suggestion';
export type AiFindingCategory =
  | 'structural'
  | 'style'
  | 'formatting'
  | 'theological'
  | 'copyediting';
export type AiFindingStatus = 'normal' | 'resolved' | 'pending' | 'rejected';

interface EditorialAiFindingProps {
  title: string;
  severity: AiFindingSeverity;
  category: AiFindingCategory;
  description: string;
  suggestion: string;
  chapterRef?: string;
  status?: AiFindingStatus;
  onResolve?: () => void;
  onReject?: () => void;
}

const severityConfig = {
  critical: {
    color: 'bg-red-500/10 border-red-500/30 text-red-400',
    badgeColor: 'bg-red-500/20 text-red-400',
    icon: AlertCircle,
  },
  warning: {
    color: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-400',
    icon: AlertCircle,
  },
  info: {
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    icon: Lightbulb,
  },
  suggestion: {
    color: 'bg-green-500/10 border-green-500/30 text-green-400',
    badgeColor: 'bg-green-500/20 text-green-400',
    icon: Lightbulb,
  },
};

const categoryConfig: Record<AiFindingCategory, { label: string; icon: React.ReactNode }> = {
  structural: { label: 'Estructura', icon: <BookOpen className="w-3.5 h-3.5" /> },
  style: { label: 'Estilo', icon: null },
  formatting: { label: 'Formato', icon: null },
  theological: { label: 'Teología', icon: null },
  copyediting: { label: 'Edición', icon: null },
};

const statusConfig = {
  normal: { label: 'Pendiente', color: 'bg-gray-500/20 text-gray-400' },
  resolved: { label: 'Resuelto', color: 'bg-green-500/20 text-green-400' },
  pending: { label: 'En revisión', color: 'bg-yellow-500/20 text-yellow-400' },
  rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-400' },
};

export function EditorialAiFinding({
  title,
  severity,
  category,
  description,
  suggestion,
  chapterRef,
  status = 'normal',
  onResolve,
  onReject,
}: EditorialAiFindingProps) {
  const config = severityConfig[severity];
  const IconComponent = config.icon;
  const categoryInfo = categoryConfig[category];
  const statusInfo = statusConfig[status];

  // Hide resolved findings by default
  if (status === 'resolved') {
    return null;
  }

  return (
    <Card className={`border ${config.color} backdrop-blur-sm transition-all duration-200 hover:border-opacity-100`}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 mt-1 ${config.color.split(' ')[2]}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight text-foreground">
                {title}
              </h3>
              {chapterRef && (
                <p className="text-xs text-muted-foreground mt-1">
                  Capítulo: <span className="font-mono">{chapterRef}</span>
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex-shrink-0 flex gap-2">
            <Badge variant="outline" className={`text-xs ${categoryInfo && categoryInfo.label ? config.badgeColor : ''}`}>
              {categoryInfo.label}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${statusInfo.color}`}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Suggestion */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-400 mb-1">Sugerencia</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {suggestion}
          </p>
        </div>

        {/* Actions */}
        {status === 'normal' && (onResolve || onReject) && (
          <div className="flex gap-2 pt-2 border-t border-white/5">
            {onResolve && (
              <button
                onClick={onResolve}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resuelto
              </button>
            )}
            {onReject && (
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rechazar
              </button>
            )}
          </div>
        )}

        {/* Status indicator for resolved/rejected */}
        {(status === 'resolved' || status === 'rejected') && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            {status === 'resolved' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-xs text-green-400">Resuelto</p>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-xs text-red-400">Rechazado</p>
              </>
            )}
          </div>
        )}

        {/* Pending indicator */}
        {status === 'pending' && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
            <p className="text-xs text-yellow-400">En revisión</p>
          </div>
        )}
      </div>
    </Card>
  );
}
