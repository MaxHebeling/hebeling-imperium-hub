# AI Agent Instructions — Hebeling OS

## Stack

- Next.js (App Router)
- TypeScript
- Supabase
- Tailwind
- shadcn/ui
- Vercel

## Systems inside Hebeling OS

- iKingdom
- Reino Editorial AI Engine
- Author Portal
- Staff Dashboard

## Core Rules

1. Never break Author Portal routes.
2. Reuse Editorial Core Engine logic.
3. Prefer Server Components.
4. Maintain strict TypeScript types.
5. Do not duplicate editorial pipeline logic.
6. All permissions must respect Supabase RLS.
7. UI must be mobile-first.
8. Avoid unnecessary dependencies.

## Editorial Pipeline

Stages:

1. Ingesta
2. Estructura
3. Estilo
4. Ortotipografía
5. Maquetación
6. Revisión Final
