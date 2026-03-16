# Reino Editorial — Campaign Infrastructure Guide

## Overview
This document contains the complete campaign infrastructure setup for Reino Editorial (editorialreino.com), including tracking configuration, campaign structures, audiences, and external platform setup instructions.

---

## 1. Audit Results

| Component | Status | Details |
|-----------|--------|---------|
| Google Analytics 4 | Installed | ID: `G-V77XN1L4NM` (exclusive Reino Editorial) |
| Google Tag Manager | Installed | ID: `GTM-MNTCBQ8Q` (Reino Editorial container) |
| Meta Pixel | Created | ID: `2009923259732455` (Reino Editorial Pixel) |
| Google Ads Account | Created | ID: `647-298-0045` (needs payment method) |
| Meta Business Manager | Configured | Business ID: `916910247586739` (iKingdom account) |
| Landing Page `/publica-tu-libro` | Created | Optimized for ad campaigns |
| Lead Capture API | Created | `POST /api/editorial/leads` |
| Email Automation | Created | Confirmation + Welcome + Manuscript invitation |
| Conversion Tracking | Code ready | Needs GTM/Ads IDs |

---

## 2. Environment Variables to Configure

Add these to your Vercel project (or `.env.local`):

```env
# Google Tag Manager (Reino Editorial container)
NEXT_PUBLIC_GTM_ID=GTM-MNTCBQ8Q

# Google Analytics 4 (Reino Editorial exclusive)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-V77XN1L4NM

# Meta Pixel (Reino Editorial Pixel)
NEXT_PUBLIC_META_PIXEL_ID=2009923259732455

# Email notifications
EDITORIAL_NOTIFICATION_EMAIL=contacto@editorialreino.com
INTERNAL_NOTIFICATION_EMAIL=max@hebeling.io
```

---

## 3. Google Ads — Campaign Structure

### Campaign 1: Publicar un Libro
- **Type**: Search + Performance Max
- **Objective**: Lead generation
- **Keywords**: publicar mi libro, publicar un libro, editorial para publicar, cómo publicar un libro, editorial cristiana
- **Landing Page**: `editorialreino.com/publica-tu-libro`
- **Budget suggestion**: $15-25/day
- **Locations**: México, Estados Unidos, Colombia, Argentina, España

### Campaign 2: Servicios Editoriales
- **Type**: Search + Display
- **Objective**: Lead generation
- **Keywords**: servicios editoriales, edición de libros, corrección de textos, maquetación de libros, diseño editorial
- **Landing Page**: `editorialreino.com/publica-tu-libro`
- **Budget suggestion**: $10-20/day
- **Locations**: México, Estados Unidos, Colombia, Argentina, España

### Campaign 3: Corrección de Manuscritos
- **Type**: Search
- **Objective**: Lead generation
- **Keywords**: corrección de manuscritos, corrección ortográfica profesional, editor de textos, corrector de estilo, revisión de manuscrito
- **Landing Page**: `editorialreino.com/publica-tu-libro`
- **Budget suggestion**: $10-15/day
- **Locations**: México, Estados Unidos, Colombia, Argentina, España

### Conversion Actions to Create in Google Ads:
1. **Formulario enviado** — Track `form_submit` event
2. **Lead generado** — Track `lead` event
3. **Contacto** — Track `contact` event
4. **Solicitud de información** — Track `button_click` event

---

## 4. Meta Ads — Campaign Structure

### Audience 1: Escritores
- **Interests**: escritura creativa, escritores, literatura, novelas, autores independientes
- **Age**: 25-65
- **Locations**: México, Estados Unidos, Colombia, Argentina, España

### Audience 2: Autores Cristianos
- **Interests**: libros cristianos, teología, biblia, iglesia, ministerio cristiano, escritura cristiana
- **Age**: 28-65
- **Locations**: México, Estados Unidos, Colombia, Argentina, España

### Audience 3: Pastores y Líderes
- **Interests**: liderazgo cristiano, pastor, ministerio, iglesia evangélica, discipulado, predicación
- **Age**: 30-65
- **Locations**: México, Estados Unidos, Colombia, Argentina, España

### Audience 4: Personas que Quieren Publicar un Libro
- **Interests**: auto-publicación, Amazon Kindle, Kindle Direct Publishing, escritura, publicar un libro
- **Age**: 25-55
- **Locations**: México, Estados Unidos, Colombia, Argentina, España

### Meta Pixel Events Configured:
- `PageView` — Automatic on every page load
- `Lead` — Fired on form submission
- `Contact` — Fired on CTA button clicks
- `FormSubmission` (custom) — Fired on lead form submit

---

## 5. Audience Keywords (for both platforms)

| Category | Keywords |
|----------|----------|
| Writing | escritura, escritores, autores, escritura creativa |
| Publishing | auto publicación, publicar libro, editorial, Kindle, Amazon KDP |
| Books | libros, literatura, novela, poesía, ensayo |
| Christian | teología, liderazgo cristiano, biblia, iglesia, ministerio |
| Services | corrección de textos, edición, maquetación, diseño editorial |

---

## 6. Target Locations

| Country | Language | Priority |
|---------|----------|----------|
| México | Spanish | High |
| Estados Unidos | Spanish/English | High |
| Argentina | Spanish | Medium |
| Colombia | Spanish | Medium |
| España | Spanish | Medium |

---

## 7. Lead Capture System

### API Endpoint
```
POST /api/editorial/leads
```

### Required Fields
- `full_name` (string)
- `email` (string)

### Optional Fields
- `whatsapp` (string, with country code)
- `country` (string)
- `project_description` (string)
- `main_service` (string, manuscript type)
- `source` (string, defaults to "website")
- `brand` (string, defaults to "editorial-reino")
- `origin_page` (string)
- `form_type` (string)

### Email Flow
1. **Instant**: Internal notification → max@hebeling.io + editorial email
2. **Instant**: Confirmation email → Lead's email (with lead code)
3. **After confirmation**: Welcome email → Lead's email (with manuscript submission invite)

### Where Leads Are Stored
- **Supabase**: `leads` table with `brand = 'editorial-reino'`
- **CRM**: Accessible at hub.hebeling.io/app/crm

---

## 8. External Platform Setup Checklist

### Google Ads Account (ID: 647-298-0045)
- [x] Create Google Ads account at ads.google.com
- [x] Set country: México
- [x] Set currency: MXN
- [x] Set timezone: America/Tijuana
- [ ] **Add payment method** (credit card required)
- [ ] Grant admin access to collaborators
- [x] Link GA4 property (G-V77XN1L4NM)

### Google Tag Manager (ID: GTM-MNTCBQ8Q)
- [x] Create GTM account at tagmanager.google.com
- [x] Create container named "Reino Editorial"
- [x] GTM ID: `GTM-MNTCBQ8Q`
- [ ] Add to Vercel env as `NEXT_PUBLIC_GTM_ID=GTM-MNTCBQ8Q`
- [ ] Inside GTM, create tags for:
  - Google Ads Conversion Tracking
  - GA4 Event tags (form_submit, lead, contact, button_click)
- [ ] Publish container

### Google Analytics 4 (ID: G-V77XN1L4NM)
- [x] GA4 installed: G-V77XN1L4NM (exclusive Reino Editorial)
- [ ] Verify events are being tracked in GA4 → Events
- [x] Created key event: `lead`
- [ ] Create additional custom conversions for: form_submit, contact
- [x] Linked to Google Ads account (647-298-0045)

### Meta Business Manager (Business ID: 916910247586739)
- [x] Access Business Manager at business.facebook.com
- [ ] Add Facebook Page: Reino Editorial
- [ ] Verify domain: editorialreino.com
- [x] Ad Account exists (ID: 1274272724591969)
- [x] Created Meta Pixel: "Reino Editorial Pixel" (ID: `2009923259732455`)
- [ ] Add to Vercel env as `NEXT_PUBLIC_META_PIXEL_ID=2009923259732455`
- [ ] Verify pixel fires using Meta Pixel Helper extension

---

## 9. Tracking Event Reference

| Event Name | Platform | Trigger |
|-----------|----------|---------|
| `page_view` | GA4 | Automatic (every page) |
| `form_submit` | GA4 | Lead form submission |
| `lead` | GA4 | Lead form submission |
| `contact` | GA4 | CTA button click |
| `button_click` | GA4 | Any tracked CTA |
| `PageView` | Meta | Automatic (every page) |
| `Lead` | Meta | Lead form submission |
| `Contact` | Meta | CTA button click |

---

## 10. Testing Checklist

- [ ] Visit `/publica-tu-libro` and verify page loads
- [ ] Submit test lead and verify:
  - Lead appears in Supabase `leads` table
  - Internal notification email received
  - Confirmation email received by lead
  - Welcome email received by lead
- [ ] Open browser DevTools → Network → verify gtag.js loads
- [ ] Install Meta Pixel Helper extension → verify pixel fires
- [ ] Check GA4 Realtime → verify events appear
- [ ] Test on mobile device for responsive layout
