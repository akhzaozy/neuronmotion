# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the self-screener.** A layperson in Indonesia who suspects something is off with their own movement, or who is monitoring a family member, and who does not have easy access to a neurologist. They arrive on a phone or a laptop with a standard webcam, in an ordinary room, with no extra hardware and often on a limited connection. Their job is: *find out whether this is worth seeing a doctor about, and track whether it is getting worse.*

**Secondary: the health worker (nakes).** A verified clinician using the `/doctor` portal to review connected patients' screening results across sessions and export a report. Real but not the surface future design optimizes for first.

**Third: administrators** (`ADMIN` role exists in the schema) for account and verification management. Not a designed surface yet.

## Product Purpose

NeuronMotion is a browser-based screening tool for neurological movement disorders. It detects body and hand keypoints from a standard camera, extracts movement biomarkers, converts them into a risk score with plain-language interpretation, and keeps a history so change over time is visible.

Success is a user in a place with no neurologist getting an honest, understandable signal about their movement, and either being reassured or being pushed toward a real clinical follow-up.

It is explicitly **not a diagnostic tool** — this is stated in the product itself (`/bantuan`, `/demo`) and every future surface must preserve that framing.

## Positioning

Screening runs **client-side**: pose and hand inference happen in the browser via `@mediapipe/tasks-vision` (WASM/WebGL). Video never leaves the device — only derived keypoints and biomarker values do. That is the mechanism a neighboring product cannot casually copy: privacy and low latency are structural, not a policy promise, and it works without a server GPU, which is what makes it deployable in low-access regions at all.

No install, no app store, no sensor, no wearable. A camera and a browser.

## Operating Context

- **The scene:** a home or a small clinic room, uncontrolled lighting, a phone propped up or a laptop lid, the user standing back far enough to be in frame, following a timed instruction, often alone with no one to help hold the device.
- **Patient flow:** landing → login/register → choose test → pre-screening questionnaire → on-screen instruction → camera capture → biomarker results → risk score → history and trend.
- **Doctor flow:** `/doctor` → connected patient list → per-patient detail across sessions → printable/exportable report (`ReportTemplate`, `ReportPrintHost`).
- **Supporting surfaces already built:** `/edukasi`, `/bantuan`, `/profil`, `/riwayat`, `/demo`, plus doctor-side variants of edukasi, bantuan, and profil.
- **Movement tests measured:** tremor, finger tapping, gait, arm swing, range of motion, postural stability (sway).
- Users may be older, may have the tremor or reduced dexterity the product is measuring, and may be operating the device one-handed or at arm's length. Interaction targets and timing must assume that.

## Capabilities and Constraints

- **Stack (existing):** Next.js 16 + React 19 + TypeScript in `webapp/`, CSS Modules per route, `framer-motion`, `lucide-react`. Express + Prisma API in `server/`. There is also a legacy Vite/React tree in `src/` — `webapp/` is the live frontend.
- **Bilingual now:** `id` and `en`, hand-rolled dictionary in `webapp/src/lib/i18n.tsx`. Indonesian is the default and the source language; every new string needs both keys. A pre-render script sets `lang` before paint to avoid a flash.
- **Theming:** `webapp/src/lib/theme.tsx` — theme switching is a real, shipped capability, not a future idea.
- **Auth and roles:** JWT + bcrypt; `role` is a string defaulting to `PATIENT`, with `DOCTOR` (carrying `licenseNumber`) and `ADMIN`. Doctor access to patient data is consent/relationship-based by design.
- **Undecided:** the risk model is currently rule-based on literature thresholds; the ML classifier and clinical validation described in the README are roadmap, not shipped. Distance calibration is optional and approximate. Do not design UI that implies either is finished.
- **House style:** no em dashes in source (`npm run lint:dash` enforces it).
- **Note:** `LAPORAN.md` in the repo root describes a different project (a mining safety platform) and is not NeuronMotion truth. Ignore it.

## Brand Commitments

- Name: **NeuronMotion**. Existing mark at `webapp/src/components/Logo.tsx` and `webapp/src/app/icon.svg`.
- Fonts already committed and self-hosted, in `webapp/src/app/fonts/`: **Gabarito** (headings), **Hanken Grotesk** (UI/body), and **JetBrains Mono** (numeric/technical readouts). Plus Jakarta Sans was used until the Ruang Periksa Terang redesign and was dropped at the team's request; its file may still be present but nothing imports it.
- Built by **Last Dance Teams**; project lead Muhammad Akhza Fachrozy.
- Voice: Indonesian-first, plain, calm, clinically careful. It explains what a number means rather than asserting a verdict.

## Evidence on Hand

- Training dataset: `dataset/NeuronMotion-Dataset-Training.csv` / `.xlsx`, with sources in `dataset/REFERENSI.md`.
- Original UI mockups referenced by the README: `NeuronMotion - Landing.dc.html`, `NeuronMotion - Skrining.dc.html`.
- Seed data in `prisma/seed.js`.
- **Absent, and must not be fabricated:** clinical validation results, sensitivity/specificity figures, partner hospitals or clinics, real patient testimonials, user counts, regulatory approval, pricing. This is a competition/demo build. Demo data may be plausible, but no surface may state or imply a clinical claim the project has not earned.

## Product Principles

1. **The camera stream stays on the device.** Any feature that would upload raw video contradicts the product's reason to exist.
2. **Screening, never diagnosis.** Every result surface carries its interpretation and its limits together; the disclaimer is part of the design, not a footer afterthought.
3. **Explain the number.** A biomarker is shown with what it means, its normal range, and where that range comes from — that transparency is also the product's education strategy.
4. **Assume the worst room and the worst connection.** Low bandwidth, mid-range phone, uneven light, no helper present. Graceful degradation over richness.
5. **Assume the user's hands may be unsteady.** The condition being measured is also the condition operating the interface.
6. **Indonesian first.** Copy is authored in Indonesian and translated to English, not the reverse.

## Accessibility & Inclusion

- Users may present with tremor, reduced range of motion, or gait instability. Generous hit targets, forgiving timing, no interaction that requires precision or speed.
- Older users are a real segment: readable defaults, high contrast, no reliance on subtle color shifts alone.
- Instructions during capture must work when the user is standing several feet from the screen and cannot easily read small text or reach the device.
- Regulatory context: Indonesian health-data rules (UU PDP) — explicit consent, right to deletion. Account deletion copy already exists in i18n.
