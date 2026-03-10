# Phase 3 — Editorial Staff Dashboard

## Objective

Create the internal dashboard used by the editorial team to manage book projects.

## Routes

Staff interface should include:

/staff/dashboard  
/staff/books  
/staff/books/[projectId]

## Core Features

The staff must be able to:

- view all editorial projects
- see pipeline progress
- upload files
- leave comments
- approve stages
- assign staff members
- track editorial activity

## UI Requirements

- mobile-first design
- Tailwind + shadcn components
- professional editorial interface
- clear pipeline visualization

## Data Model

The dashboard must reuse the existing editorial engine:

- editorial_projects
- editorial_stages
- editorial_files
- editorial_comments
- editorial_exports

Progress must use the existing pipeline helpers.

## Security

Only authenticated staff members should access `/staff/*`.

Authors must never access the staff dashboard.

## Important

Do not break Author Portal routes or existing editorial pipeline logic.
