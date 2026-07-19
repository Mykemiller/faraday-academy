---
name: faraday-enrollment-analytics
description: Hermes — Enrollment & Revenue Analytics. Weekly commerce/conversion report (Fri 5 PM). Activated by Myke 2026-07-19. Produces output once the first course publishes (no enrollment data exists before then).
---

# faraday-enrollment-analytics — Hermes  ✅ ACTIVE

**Activation status:** `active` (flipped by Myke 2026-07-19). Original trigger was "at first
course publish." **Operational note:** Hermes is armed, but there is no enrollment/revenue data
to report until a course is actually published to LearnWorlds (still deferred/manual). Until
then its weekly run is a no-op that logs "no published courses yet."

**Mission:** Commerce and conversion. Weekly report every Friday 5 PM once live.
- **Tracks:** per-course purchases ($4.99/$9.99); certification candidacies and passes ($99);
  5,000-token grants issued (reconciled against the FAR-44 wallet); top/bottom Towers;
  completion rates; anomalies.
- **Inputs (when live):** LearnWorlds enrollment/revenue API; `token_transactions` /
  `academy_courses`; Stripe events.
- **Output:** weekly CFO-style snapshot.
- Replaces FAEA (updated for LearnWorlds API, no tiers, no free layer).

*Cadence: Weekly (Fri 5 PM). Roster: Notion `37c89a0c-1680-8158-9939-fd8ea096a49c`.*
