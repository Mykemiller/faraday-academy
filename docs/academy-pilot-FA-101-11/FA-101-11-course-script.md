# FA-101-11 — The New Risk: Why Community Opposition Blocks Data Centers

> **Course ID:** FA-101-11 · **Domain:** 11 — Community Relations *(Passion Domain)* · **Level:** 101 — Foundations · **Tier:** Free · **Duration:** ~45 min · **Format:** Video + Reading + Quiz
> **Approval Status:** 🟡 Draft — Awaiting Review *(co-authored rewrite, pilot of the content pipeline)*
> **Sourcing:** Every factual claim is tagged `[S#]` and traced to a source artifact in [`FA-101-11-citation-trail.md`](./FA-101-11-citation-trail.md). Claims that could not be sourced are marked **⚑ UNSOURCED** in the citation trail, not softened into the script.

---

## Why This Course Exists

For a decade, the question that decided a data center project was *"Can you get the power?"* In 2026, a second question has become just as decisive: *"Will the community let you build it?"*

Local opposition is no longer a nuisance to manage at the end of a project — it is a primary risk that can stop a multibillion-dollar campus before the first foundation is poured. In the first three months of 2026, opponents blocked or delayed at least 75 U.S. data center projects worth roughly **$130 billion** — a single quarter that roughly matched *all of 2025* on both dollar value and project count `[S3]`. Seven in ten Americans now say they oppose an AI data center being built in their local area `[S1]`.

This course gives you the first-principles foundation to understand *why* communities oppose data centers, *how* an opposition campaign actually moves through the approval system, and *what* separates the projects that get approved from the ones that get killed. No policy or legal background required. The lens throughout is the investor's and the operator's: community risk is now an underwriting variable, not a public-relations afterthought.

---

## Learning Outcomes

By the end of this course, you will be able to:

1. Explain why community consent has become a leading risk to data center development — on par with power and capital.
2. Describe the lifecycle of a community opposition campaign, from petition to legal challenge, and identify where an operator can intervene.
3. Explain what a Community Benefit Agreement (CBA) is and why it correlates with approval success.
4. Read a zoning-hearing or moratorium headline and understand its signal for investors and operators.

---

## Module Outline

| # | Module Title | Format | Duration |
|---|---|---|---|
| 1 | The Anatomy of Opposition: Who Opposes and Why | Video + Reading | 10 min |
| 2 | The Approval Chain: From Application to Certificate of Occupancy | Video + Infographic | 10 min |
| 3 | Community Benefit Agreements: What They Are and Why They Matter | Interactive + Reading | 15 min |
| 4 | Case Study: Frederick County, Maryland — Anatomy of a Contested Approval | Case Exercise | 10 min |

---

## Module 1 — The Anatomy of Opposition: Who Opposes and Why

Start with the scale, because it reframes everything that follows. Community opposition is not a fringe reaction — it is now the mainstream public position. In a Gallup poll conducted March 2–18, 2026, **71% of Americans said they oppose the construction of an AI data center in their area, including 48% who are strongly opposed** `[S1]`. For comparison, in the same survey only 53% opposed a nuclear energy plant nearby — so Americans are now *more* likely to resist a data center than a nuclear reactor `[S1]`.

That public sentiment has organized. According to Data Center Watch, a project tracker, the number of active opposition groups more than doubled to **833 across 49 states** `[S3]`. This is not a single movement with a single grievance. It is a coalition, and the operator who wants to read community risk has to see the distinct actors inside it.

**Who opposes — the four recurring actor types:**

1. **Property owners and residents.** The most common opposition base. Their concerns are proximity-driven: noise from cooling and generators, viewshed, traffic, and property values. This is the source of the *"not in my backyard"* (**NIMBY**) dynamic — residents who might not oppose data centers in the abstract but object to *this* one, *here*. Treating it as *merely* NIMBYism is a strategic error, because their concerns are what elected officials respond to.
2. **Environmental and resource advocates.** Focused on water and energy consumption. In the Gallup data, about half of opponents cited excessive resource use as their reason; *within* that group, roughly 18% specifically named water and 18% named energy, and a further 16% cited pollution (including noise) `[S1]`. (These are overlapping subsets of the concern, not additive shares.)
3. **Fiscal and tax-incentive skeptics.** Opponents — frequently fiscally conservative — who object to the **tax abatements** (multi-year local tax breaks used to attract a project), arguing the public gives up revenue without proportional local benefit `[S3]`.
4. **Labor.** A genuinely mixed actor. Building-trades unions often *support* projects that guarantee construction jobs, while some community-labor groups remain skeptical `[S19]`.

**Why the coalition is so effective:** it is bipartisan. Republican officials tend to raise tax-incentive and grid-strain concerns; Democrats tend to emphasize environmental and resource impacts — but both arrive at the same place, which is why opposition has spread across red and blue jurisdictions alike and why a federal moratorium bill drew sponsors as different as Sen. Bernie Sanders and Rep. Alexandria Ocasio-Cortez `[S3]`.

> **Key signal to remember:** When you see a new opposition group form around a proposed campus, don't ask only "how loud are they?" Ask "which of the four types are they, and is their coalition bipartisan?" A single-issue property-owner group is a manageable risk. A bipartisan coalition fusing tax, water, and property concerns is a project-killer.

---

## Module 2 — The Approval Chain: From Application to Certificate of Occupancy

A data center is not approved in a single vote. It moves through a chain of decision points, and opposition can stop it — or extract concessions — at every link. Understanding the chain tells you *when* community risk is highest and *where* an operator still has room to act.

**The approval chain, simplified:**

1. **Site control & application.** The developer secures land (often optioned quietly) and files a **rezoning** application (a request to change what the land is legally allowed to be used for) or a **special-use permit** (permission for a specific use the current zoning doesn't automatically allow). Many localities do not even have a modern zoning definition for "data center," which itself becomes a fight `[S8]`.
2. **Planning commission / staff review.** The technical review by county/city planning staff. This is where conditions — **setbacks** (how far a building must sit from property lines), noise limits, water-use terms — get attached.
3. **The public hearing.** The pivotal, visible moment. This is where hundreds of residents can pack a room and change an elected body's vote. In September 2025, Google withdrew its rezoning request for a ~468-acre, ~$1 billion campus in Franklin Township, Indianapolis, pre-empting a City-County Council vote it was expected to lose, after residents (organized as "Protect Franklin Township," 8,000+ petition signatures) packed the hearing and its overflow rooms `[S18]`.
4. **The governing-body vote.** County commission or city council. A rezoning can be approved, denied, or approved with binding conditions (this is where a CBA — Module 3 — is often attached).
5. **Build permits & Certificate of Occupancy.** Even after approval, the project needs construction permits and, finally, a **Certificate of Occupancy** — the local sign-off that the finished building may legally operate. The chain isn't done until that is issued.

**The escalation layer — where opposition goes when it loses the vote.** This is the branch most newcomers miss. Steps 1–5 are the path when a project *wins*; when opponents lose at the council (step 4), they don't necessarily stop — they escalate onto a parallel track:
   - **Referendum** — forcing the council's zoning decision onto the ballot for voters to approve or overturn (petition-driven, reactive to a decision already made). A related tool, the **ballot initiative**, lets citizens put their *own* proposed rule to a vote.
   - **Moratorium** — a temporary or permanent pause on new data center approvals. Local moratoria have become common enough that legal scholars now publish guidance for municipalities on how to structure them `[S17]`.
   - **Legal challenge** — litigation over the zoning decision itself, which can run for years.

**The Opposition Lifecycle** (the Faraday framing): *Petition → Zoning hearing → Moratorium bill → Ballot initiative → Legal challenge* `[S19]`. Each stage has different intelligence value and a different intervention point. The earlier an operator engages, the more options remain; by the litigation stage, the outcome is largely out of the operator's hands.

> **Investment signal:** A project that has cleared its governing-body vote is *not* de-risked if the jurisdiction allows referenda or has an active moratorium movement. In 2026, moratorium proposals were introduced in **14 states** in a single quarter `[S3]`. Read the escalation layer before you treat an approval as final.

---

## Module 3 — Community Benefit Agreements: What They Are and Why They Matter

If Modules 1 and 2 explain the risk, Module 3 explains the primary tool operators use to manage it.

**What a CBA is:** A Community Benefit Agreement is a negotiated agreement — sometimes legally binding, sometimes voluntary — between a developer and a community, specifying concrete commitments in exchange for community support or non-opposition `[S19]`. Policy researchers increasingly argue CBAs are *necessary* for data centers specifically because the industry's local footprint (land, water, power, tax abatement) is large while its permanent-job count is small — a mismatch that fuels opposition `[S13]`.

**What goes inside a strong CBA:**

- **Local hiring targets, in writing.** Workforce provisions typically set local-hiring goals — often in the range of **30–50% of construction labor hours** from a defined geography — written into the agreement rather than promised verbally `[S14]`.
- **Workforce development.** Apprenticeships, internships, and school partnerships that build a local pipeline into the trades `[S14]`.
- **Direct community investment and transparency.** Payments toward local priorities, plus public reporting on economic and environmental outcomes `[S13]`.
- **Enforcement.** The feature that separates a real CBA from a press release: missing the targets should trigger fines or civil action, not just an apology `[S16]`.

**A concrete example — Lancaster, Pennsylvania.** A data center agreement in Lancaster committed the developer and the city to a local hiring plan with percentage goals for an expected **2,000 construction jobs and 350 permanent jobs**, alongside **$20 million** in payments toward local causes and a commitment to source **100% renewable energy** — terms described as atypically strong for the region `[S11]`. **The operator lesson isn't "a CBA guarantees a win."** Even this comparatively generous package drew public questions about whether the promised benefits were real and enforceable `[S11]`. That *is* the lesson: a CBA is necessary but not sufficient — its terms, and their credibility, get scrutinized. A vague or unenforceable one can inflame opposition rather than defuse it.

**Why it matters for approval:** The set of proactive commitments in a well-built CBA — local hiring, tax-revenue transparency, independent environmental monitoring, aesthetic mitigation — is what Faraday calls the *Good Neighbor Playbook*, and it is broadly associated with approval success `[S19]` (though we are not aware of a published study quantifying by *how much* — treat it as directional, not measured). The causal logic is simple: a CBA converts the abstract fear ("they'll take our water and give us nothing") into a specific, enforceable ledger the community can point to.

> **Key signal to remember:** When you evaluate a project's community risk, ask whether there is a CBA — and then ask whether it has *teeth*. A CBA with enforceable local-hiring targets and clawbacks is a de-risking asset. A vague "commitment to being a good neighbor" with no enforcement is a warning sign, not a mitigant.

---

## Module 4 — Case Study: Frederick County, Maryland — Anatomy of a Contested Approval

> **A note on this case, and on how Faraday sources its teaching material.** An earlier internal draft of this course titled this module *"Frederick, Maryland — The First Major Moratorium Victory."* When we verified the record, that framing did not hold: Frederick's story is not a clean opposition victory, and there is no basis for the "first" superlative. The accurate story is more useful anyway, because it shows both the *power* and the *limits* of community opposition. We corrected it rather than repeat it. `[S5][S6][S7]` *(See the citation trail for the full flag.)*

**The setup.** Frederick County sits at the edge of Northern Virginia's "data center alley," and residents feared their county would become its next extension `[S5]`. Rather than approve campuses piecemeal across the county, the County Council took an unusual approach: it created a **Critical Digital Infrastructure Overlay Zone (CDI-OZ)** — a roughly **2,600-acre** district north of Adamstown intended to *concentrate* data center development in one location and prevent it from sprawling countywide, adopted by ordinance in late 2025 `[S5][S7]`.

**The opposition.** Opponents rejected the overlay and turned to the escalation layer from Module 2: a **referendum** to put the zoning decision to voters. They cleared a high bar, collecting signatures well beyond the threshold — about **21,000** were validated by the county board of elections in April 2026 `[S7]`.

**The outcome — and the twist.** The referendum never reached the ballot. The courts intervened on procedural grounds, and in June 2026 the **Maryland Supreme Court** upheld the decision keeping the referendum off the general-election ballot — in part because the petition's black-and-white maps of the overlay zone were ruled indistinguishable to voters `[S6]`. Opposition had mobilized tens of thousands of signatures and *still* did not get its vote. Yet the pressure was not without effect: following the court decision, the county announced a **pause on new data center development** and moved to **limit** future development `[S6][S7]`.

**What this case teaches:**

- **Opposition is powerful but not decisive on its own.** Tens of thousands of signatures were not enough to force a referendum. Process and procedure matter as much as public sentiment.
- **The overlay zone was a "concentrate, don't scatter" compromise** — a template other counties are watching. Containment can be a middle path between "approve everywhere" and "ban everything."
- **"Resolved" is a dangerous word.** Faraday's internal Community Resistance Monitor had logged Frederick as *Resolved (Q1 2026)* `[S19]`; the public record shows active litigation and new restrictions continuing into mid-2026 `[S6]`. Always check the primary record before calling a market settled.

> **Investment signal:** The Frederick outcome shows why the escalation layer must be priced even after a favorable vote — and why a jurisdiction's *procedural* rules (does it allow referenda? what are the petition requirements?) are part of community-risk underwriting, not a footnote.

---

## The One Thing to Remember

> **If you remember one thing from this course:** *community consent is now an underwriting variable, not a public-relations afterthought.* A project's power, capital, and land can all be in place and it can still be stopped — or forced to give back millions in benefits — by the people who live next to it. Price the community the way you price the grid connection: early, specifically, and before you call the deal done.

---

## Assessment

**10-question multiple-choice quiz.** Pass score: 70%. Badge awarded on completion.

*Sample questions:*
- In the March 2026 Gallup poll, roughly what share of Americans said they oppose an AI data center in their area? *(Answer: ~71%)* `[S1]`
- Which stage of the Opposition Lifecycle typically comes *after* a project loses its governing-body vote? *(Answer: referendum / moratorium / legal challenge — the escalation layer)*
- What single feature most distinguishes an enforceable Community Benefit Agreement from a public-relations promise? *(Answer: enforcement — fines/clawbacks for missing targets)*
- In the Frederick County case, why did the residents' referendum ultimately not reach voters? *(Answer: the courts kept it off the ballot on procedural grounds)*

---

## Daily Challenge Integration

> 💡 **Trigger:** Offered when a subscriber misses 2+ Community Relations Daily Challenge questions in a 7-day window.
> **Offer copy:** *"The fastest-growing risk to data center projects isn't power — it's the community next door. Your free Community Relations intro lesson breaks down why. 45 minutes, costs nothing."*
> **If declined:** Do not resurface for 30 days.

---

## What Comes Next

Completing this course unlocks **FA-201-11 — Municipal Engagement: Strategies That Work and Strategies That Fail** (Monthly tier), where you'll move from *understanding* opposition to *acting* on it: stakeholder mapping, the Good Neighbor Playbook in depth, and case studies of engagement done well and done badly.

---

> **Faraday Academy** · FA-101-11 · Community Relations (Domain 11) · Foundations Level · Status: 🟡 Draft — Awaiting Review
> *Co-authored via the `doc-coauthoring` skill as the content-pipeline pilot. Full source trail: [`FA-101-11-citation-trail.md`](./FA-101-11-citation-trail.md).*
