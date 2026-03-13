# AGENTS.md
# Hebeling OS — Agent Rules
# System Owner: Max Hebeling

## 1. Source of Truth

The official architecture of the system is defined in:

HEBELING_OS_MASTER_ARCHITECTURE_BLUEPRINT.md

All implementation must follow this document.

Agents must not invent new architecture or modify the design.

---

## 2. System Priority

The first system to be completed is:

REINO EDITORIAL ENGINE AI

No other platform should be implemented before this one is fully operational.

Priority order:

1. Reino Editorial Engine AI
2. Author Portal
3. Editorial Staff Dashboard
4. Editorial AI Engine
5. Mobile App for Authors
6. Remaining Hebeling OS platforms

---

## 3. Development Principles

Agents must:

- Respect the architecture blueprint
- Reuse existing code
- Maintain type safety
- Keep modular architecture
- Avoid duplication
- Write production-ready code

---

## 4. Language Requirements

The entire system must support:

Spanish
English

All UI text must be translatable.

---

## 5. Editorial AI Requirements

The editorial AI engine must support:

- manuscript ingestion
- structural analysis
- readability analysis
- coherence analysis
- editorial suggestions
- issue detection
- quality scoring

AI responses must return **structured JSON**.

---

## 6. Pipeline Requirements

The editorial pipeline must follow this exact structure:

INGESTA
AI ANALYSIS
STRUCTURAL EDITING
LINE EDITING
COPYEDITING
LAYOUT
COVER DESIGN
FINAL PROOF
PUBLICATION

Stages must be stored in the database and visible in dashboards.

---

## 7. Manuscript Versioning

Every manuscript upload must create a new version.

Each AI analysis must be linked to a specific manuscript version.

---

## 8. Findings System

AI analysis must produce findings with:

- severity
- message
- location
- suggestion

Findings must be reviewable by human editors.

---

## 9. Human Review Layer

Editors must be able to:

- accept findings
- reject findings
- mark as resolved
- apply manual corrections

---

## 10. Author Transparency

Authors must be able to see:

- current editorial stage
- progress
- comments
- files

Progress visibility can be delayed to control perceived workflow speed.

---

## 11. Code Validation

After each phase agents must:

- run typecheck
- run lint
- verify imports
- verify database schema
- verify API endpoints

---

## 12. Security

Roles must be enforced.

Roles include:

superadmin
staff
editor
author
client

---

## 13. Forbidden Actions

Agents must NOT:

- rewrite the architecture
- introduce new frameworks
- remove working modules
- create mock-only implementations

All work must be production ready.

---

## 14. Output Format

After each implementation block agents must return:

- summary
- modified files
- validation steps
- next phase
