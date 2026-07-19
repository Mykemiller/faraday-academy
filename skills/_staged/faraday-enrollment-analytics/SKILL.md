---
name: faraday-enrollment-analytics
description: "[STAGED — DO NOT ACTIVATE] Hermes — Enrollment & Revenue Analytics. Weekly commerce/conversion report. Activation trigger: at first course publish."
---

# faraday-enrollment-analytics — Hermes  ⏸️ STAGED (not firing)

**Activation status:** `staged`. **Trigger (verbatim from roster):** "at first course publish."
Do NOT schedule or wire this until Myke flips `academy_agent_staff.activation_status` to
`active` for Hermes.

**Mission:** Commerce and conversion. Weekly report every Friday 5 PM once live.
- **Tracks:** per-course purchases ($4.99/$9.99); certification candidacies and passes ($99);
  5,000-token grants issued (reconciled against the FAR-44 wallet); top/bottom Towers;
  completion rates; anomalies.
- **Inputs (when live):** LearnWorlds enrollment/revenue API; `token_transactions` /
  `academy_courses`; Stripe events.
- **Output:** weekly CFO-style snapshot.
- Replaces FAEA (updated for LearnWorlds API, no tiers, no free layer).

*Cadence: Weekly (Fri 5 PM). Roster: Notion `37c89a0c-1680-8158-9939-fd8ea096a49c`.*
