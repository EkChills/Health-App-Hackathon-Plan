# BST — Hackathon Plan v1

> *Name locked. Markers locked: fasting blood sugar, PCV/haemoglobin, blood pressure.*

**One line:** BST turns a photo of a lab report or prescription into structured, verified health data — explains it to the patient in plain language, and hands the doctor a one-page brief.

**Architecture thesis (say this exact line to the judges):**
> **The model reads. The rules decide.**

AI does extraction and explanation. A deterministic engine does every judgement that matters — what's out of range, what interacts, what's urgent. That split is your credibility, your safety story, and your differentiation from the six other "AI health chatbot" teams in the room.

---

## Context: Nigeria first

Everything below assumes a Nigerian patient, a Nigerian lab, and a Nigerian clinic. That is not a limitation — it is the strongest thing about the pitch.

**The insight to lead with.** A Nigerian patient's records are scattered across a private lab, a GP, a teaching hospital, and a pharmacy that share nothing with each other. So people already carry their own records — a folder, a plastic bag of printouts, photos in a WhatsApp chat. **BST is not asking anyone to change their behaviour. It is digitising the folder they already carry.** A patient-owned record isn't a design compromise here; it is how Nigerian healthcare already works. Say that on stage.

**Regulation — one slide, verify the details before you present.**
- **Nigeria Data Protection Act 2023**, regulated by the **NDPC**. Health data is sensitive personal data and needs explicit consent — which is exactly what §7's ShareGrant gives you.
- **NHIA Act 2022** made health insurance mandatory and expanded the HMO market. That's a policy tailwind worth naming: your future customers are growing because of legislation.
- Confirm current wording yourself before the demo. A judge who works in the sector will know it better than a summary does, and getting it slightly wrong costs more than not mentioning it.

**Who pays, in Nigeria specifically.** Out-of-pocket spending dominates Nigerian healthcare, so a paid consumer app is not the business — patients will not pay. Sell B2B2C:
1. **Private diagnostic lab chains** — Synlab, Clinix, Afriglobal, Union Diagnostics and similar. They already print reports nobody can read. White-label BST as their results portal.
2. **HMOs** — Reliance Health, Hygeia, Avon, AXA Mansard. Fewer duplicate tests, better chronic adherence.
3. **Private clinics and hospitals**, per seat.

**Who you'll be compared to — have the answer ready.**
- **Helium Health** owns the hospital EHR layer. It is sold to *facilities* and the *institution* owns the record.
- **Healthtracka** does at-home testing with digital results delivery.
- Your position: **patient-owned and cross-facility.** Helium makes one hospital's records digital. BST makes one *person's* records portable across the four places they actually go. Verify both companies' current status before naming them on stage.

**What this changes in the build.**
- Android-dominant, and data costs real money. **Compress images client-side before upload**, keep payloads small, and tolerate a bad connection. This is a genuine engineering requirement, not a nicety.
- Markers: **fasting blood sugar, PCV/haemoglobin, blood pressure** (see §14).
- Seeded personas get Nigerian names, Nigerian lab formats — PCV, genotype, MP, widal — and Naira anywhere money appears.
- Test your extraction on **real Nigerian lab printouts**, not American samples. The layouts are different and that difference will break your OCR on stage.
- **Nigerian Pidgin as a plain-language mode.** It costs almost nothing — it's a variation on the explanation prompt you're already writing — and it will land harder with a Nigerian panel than any other feature on this list. Strongly consider making it part of the demo.

---

## 1. Why this wins the room

The prize is sponsorship, not a trophy. That means judges are scoring **"would we fund this team"**, which weights three things above cleverness:

| What they're really asking | How this plan answers it |
| --- | --- |
| Is the problem real? | Every patient already has lab reports they can't read, and every doctor wastes the first 5 minutes of a consult reconstructing history. Neither is speculative. |
| Can this team ship? | A deployed public URL by day 3, not day 20. Working software beats a beautiful deck. |
| Is there a business? | Diagnostic labs, clinics, and HMOs all have budget and a reason to pay. See §12. |

The demo climax is the **handoff**: patient uploads a crumpled lab photo → 10 seconds later there's a clean trend and a plain-language read → they tap Share → the doctor's screen fills with a clinical brief. Two views, one record. That 40 seconds is the whole pitch.

---

## 2. Users

Two roles, **one shared record**. This is not a two-sided marketplace — resist that.

**Patient (primary)** — has documents, doesn't understand them, forgets what they were told, arrives at appointments unprepared.
Job: *"Tell me what this result means and what I should do."*

**Clinician (secondary, but the credibility half)** — inherits a patient with no usable history.
Job: *"Give me this person's story in 30 seconds, and don't make me trust an AI to do it."*

Design the doctor view as **skeptical-user-first**: every AI-generated sentence is visibly labelled a draft, and every number links back to the source document it was read from.

---

## 3. Core loop

```
  UPLOAD              EXTRACT              DECIDE               ACT
  ┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐
  │ photo  │ ───────▶ │  AI    │ ───────▶ │ rules  │ ───────▶ │ patient│
  │ or PDF │          │ reads  │          │ engine │          │ + doc  │
  │ or typed          │ → JSON │          │ flags  │          │ views  │
  └────────┘          └────────┘          └────────┘          └────────┘
                          │                                        │
                    human verifies                          share grant
                    before it's saved                       (consent)
```

**The verify step is non-negotiable.** Extracted values appear next to a crop of the source document, and the patient confirms. It costs you one screen and buys you the answer to "what if the AI is wrong?"

---

## 4. The AI / rules split

Write this table on the pitch slide verbatim. It's your strongest 20 seconds.

### AI does (assistive only)
- Vision extraction: document image → structured JSON (test name, value, unit, reference range, date; or drug, dose, frequency, duration)
- Plain-language explanation of an already-flagged value
- Drafting the doctor's narrative summary **from structured fields only**
- Confidence score per extracted field; anything below threshold is forced to human review

### Rules do (deterministic, auditable, no model)
| Rule family | What it does | Source of truth |
| --- | --- | --- |
| Reference range | Flags high / low / critical per marker, age- and sex-adjusted | Range table you seed |
| Trend | Rate of change across readings; flags sustained drift | Your own math |
| Interaction | Drug–drug interaction check | openFDA / RxNorm / DDInter |
| Duplicate therapy | Two drugs, same class | Drug class map |
| Dose sanity | Above max daily dose | Static dose table |
| Red flag | Critical values → "seek care now" banner | Explicit, hardcoded, reviewed by a human |
| Adherence | Doses logged vs. prescribed | Arithmetic |

**Hard rule for the team:** the model never decides urgency, never diagnoses, never suggests a dose. If a judge asks "what if the AI hallucinates?", the answer is *"then a number is wrong and the user sees it next to the source image — but the clinical judgement was never the model's to make."*

---

## 5. Scope

### Must have — this is the demo
1. Upload a lab report (image or PDF) → extraction → verify screen → saved
2. Upload a prescription → medication list with interaction flags
3. Patient home: red flags, active meds, "what to do"
4. Patient timeline: one marker charted over ≥3 readings
5. Share grant: patient generates a time-limited code/link
6. Doctor brief: one page, structured, with the AI summary marked as draft
7. Manual entry fallback for everything (your safety net on stage)
8. Seeded personas with clinically plausible history

### Should have — if week 3 is calm
9. Audit log ("Dr. Adeyemi viewed your record on 4 Mar") — cheap, big trust win
10. Doctor can accept / dismiss a flag and add a note
11. Plain-language toggle: "explain like I'm not a doctor"
12. Export brief as PDF

### Won't have — say this out loud so nobody drifts
No telemedicine or video. No wearables or device sync. No chat interface. No payments. No native app. No real patient data, ever. No appointment booking. No symptom checker.

### "But what about a normal doctor consultation, without a report?"

This will come up repeatedly. Split it into three things, because two of them are already done and one is a different product.

**Already supported — a consult with no documents at all.** A patient with zero uploads still has a record: manually entered blood pressure, a symptom note, a medication list typed in by hand. The share code works the same way, and the doctor brief renders from whatever exists. Manual entry is a must-have precisely so the app is useful before anyone uploads anything. **Nothing extra to build.**

**Cheap to add — asynchronous notes on the record.** The doctor already writes a note on screen 7. Let the patient see it, and reply once. That is a consultation in a thin, defensible sense: advice attached to a record, in writing, with an audit trail. Roughly half a day, since the note already exists as an object. If the team wants "consultation" in the demo, **this is the version to build.**

**Out of scope — live telemedicine.** Video or realtime chat with a doctor is a separate product, not a feature:

- It needs WebRTC, scheduling, doctor availability, payments, and dispute handling. That is your entire three weeks.
- It needs **doctor identity verification**. You cannot connect Nigerian patients to people claiming to be doctors without checking MDCN registration. A judge from the sector will ask this in the first thirty seconds, and "we'd add that later" is a bad answer when the risk is someone acting on advice from an unverified stranger.
- **It does not demo well.** Everyone in that room has seen a video call. Nobody will be impressed by yours, and if the venue wifi is bad it fails live.
- **Nigeria already has funded telemedicine players.** Reliance Health and others own that lane. A three-week prototype competing on telemedicine loses; a three-week prototype that makes records portable is in an open lane. Building telemedicine actively weakens the pitch by moving you into a fight you cannot win.

**The resolution:** put live consultation on the **roadmap slide**, not in the build. Your friends get their idea acknowledged, judges see that you know where the product goes next, and it costs zero engineering days. "Here's what we'd build with the sponsorship" is a slide you need anyway — this is what goes on it.

---

## 6. Screens

**Patient (4)**
1. **Home** — answers "what should I do today?" Red-flag banner, next medication, upload button. Never an empty dashboard.
2. **Upload & verify** — drop zone → extracted fields beside the document crop → confirm or correct.
3. **Timeline** — markers over time, out-of-range band shaded, latest point emphasized. Tap a point for the plain-language read.
4. **Share** — pick what to share, set an expiry, get a code.

**Clinician (3)**
5. **Enter code / patient list**
6. **Brief** — problem list, meds + interaction flags, key trends, last 3 documents, AI draft summary in a visibly distinct block.
7. **Verify & note** — accept/dismiss flags, add a clinical note.

Demo-critical: **2, 3, 4, 6.** If you're behind, 1, 5, and 7 can be thin.

---

## 7. Consent and the share code

This is the least obvious piece of the design and it does the most work. Understand it before you build it.

### The problem

A patient walks into a clinic. The doctor has never met them and has no account connected to them. **How does that doctor see the record for the next twenty minutes without the patient handing over their password?**

Every obvious answer is bad:

- **Email a PDF** — static, no trends, no flags, and the data now sits in a stranger's inbox forever with no way to take it back.
- **Give the doctor a login** — requires you to pre-register every clinic in the country before the app is useful. Dead on arrival.
- **Patient logs in on the doctor's computer** — hands over the whole account, permanently, on someone else's machine.

### The mechanism

Same idea as a Google Doc share link with an expiry, or a guest wifi password.

```
Patient's phone                       Doctor's screen
───────────────                       ───────────────
Tap "Share"
   ↓
Choose scope:   ● Everything
                ○ Labs only
                ○ Last 6 months
   ↓
Choose expiry:  24 hours
   ↓
┌───────────┐
│ K7QM-2PX  │ ── read aloud, or shown as a QR ──▶  [ Enter patient code ]
└───────────┘                                              ↓
                                                    Record opens.
                                                    Dies in 24 hours.
```

It is one row — the `ShareGrant` in §8. Every time the doctor opens the record you write a line to `AuditLog`, and the patient later sees *"Dr. Adeyemi viewed your labs on 4 Mar at 10:12."*

### Why it earns its place

1. **The app works on day one.** A code works for a walk-in clinic, a referral, a second opinion in another city, an emergency room. No pre-existing relationship, no clinic onboarding, no admin. That is the actual shape of how people see doctors.
2. **It is the consent story, made physical.** Most teams answer "how do you handle privacy?" with "we encrypt everything." You get to answer: the patient chooses who sees it, chooses how much, sets an expiry, can revoke it, and sees every access afterward. Demonstrable beats claimed, and it is about four hours of work.
3. **It is the demo transition.** You need a believable reason to move from the patient screen to the doctor screen on stage. "Amara reads the code to her doctor" is that reason. Without it you are alt-tabbing between two windows and hoping nobody wonders how the doctor got in.
4. **The patient stays in control of the record.** In a hospital system the institution owns the record. Here the patient owns it and lends it out. That is a real positioning line for the pitch.

### Implementation note

A short code alone is brute-forceable. Three cheap defenses:

- **Short expiry** — hours, not weeks
- **Rate-limit** attempts, lock after ~5 failures
- **Bind on first claim** — once one clinician redeems the code it stops working for anyone else

Mention this unprompted if a technical judge is in the room. It reads as a team that thought past the happy path.

---

## 8. Data model

```
User            id, role(patient|clinician), name, email
PatientProfile  user_id, dob, sex, conditions[], allergies[]
Document        patient_id, file_url, kind(lab|rx), uploaded_at,
                status(pending|verified|rejected), raw_extraction, confidence
Observation     patient_id, document_id, code, label, value, unit,
                ref_low, ref_high, taken_at, verified_by
Medication      patient_id, document_id, name, rxnorm_code, dose, frequency,
                start_date, end_date
Flag            patient_id, rule_id, severity(info|warn|critical),
                message, observation_id?, medication_id?, created_at
ShareGrant      patient_id, clinician_id?, code, scope, expires_at, revoked_at
AuditLog        actor_id, patient_id, action, target, at
```

`ShareGrant` and `AuditLog` are the two tables that make a judge think you've thought about consent — see §7 for why they matter more than their size suggests. A couple of hours of work each. Build them.

---

## 9. Timeline (3-week version — compress or pad to fit)

**Days 1–2 — Decide and deploy**
Lock the wedge. Wireframe 7 screens on paper. Write the 3 seeded personas with real clinical arcs. Ship a hello-world to a **public URL** — this is the single most important day-2 deliverable, because deployment problems always surface late and always cost more than you budget.

**Week 1 — The spine**
Upload → extraction → verify → persist. Rules engine v1: reference ranges + red flags. One marker charting end-to-end. By Friday, one document should go in and come out as a flagged, charted observation.

**Week 2 — The handoff**
Share grant + consent flow. Doctor brief. Interaction and duplicate-therapy checks. Prescription extraction. Audit log.

**Week 3 — Make it survive contact**
Polish empty states and error states. Make the seed data clinically plausible — see §15 for how to do that without a clinician on the team. Write and rehearse the script five times. Record the fallback video. **Freeze the code 48 hours before the demo** and spend that time only on the pitch.

---

## 10. Workstreams

Four parallel tracks so nobody blocks anybody:

- **A — Extraction pipeline:** upload handling, model calls, JSON schema, confidence scoring, verify API
- **B — Rules engine + data:** range tables, drug data, flag generation, seed personas
- **C — Patient UI:** home, upload/verify, timeline, share
- **D — Doctor UI + pitch:** brief, notes, and the deck / script / demo video

Agree the **API contract between A/B and C/D on day 2** and stub it, so the frontend never waits on the backend.

---

## 11. Demo script (3 minutes)

| Time | Beat |
| --- | --- |
| 0:00–0:15 | **Hook.** Hold up a real lab report. "Everyone in this room has received one of these. Almost nobody in this room can read one." |
| 0:15–0:45 | **Problem.** Patient side: results they can't interpret. Doctor side: 5 minutes of every consult spent reconstructing history. |
| 0:45–2:15 | **Demo.** Upload → extraction → **verify screen** (dwell here, this is the trust moment) → flag fires → plain-language explanation → timeline showing the trend → Share → *switch to second screen* → doctor's brief. |
| 2:15–2:45 | **How.** "The model reads. The rules decide." Show the split table. Name the safety design. |
| 2:45–3:00 | **Ask.** Market number, who pays, what you'd do with the sponsorship in 6 months. |

Two people: one narrates, one drives. Never the same person. Rehearse the switch to the doctor screen — that transition is where live demos die.

---

## 12. Business answer (they're deciding whether to fund you)

**Who pays, in order of how easy they are to sell:**
1. **Diagnostic labs** — they already print reports nobody understands. White-label BST as their patient portal. They pay per report to look modern and reduce "what does this mean?" phone calls.
2. **Clinics** — per-seat, justified by minutes saved per consult.
3. **HMOs / insurers** — reduced duplicate testing and better chronic-disease adherence are line items they already track.
4. **Employers** with health benefits.

Bring **one real statistic** about your market. One credible number outperforms a paragraph of adjectives. And if you can get **one quote from one real doctor or patient**, put it on a slide — it's the cheapest credibility in the entire pitch.

---

## 13. Risks and fallbacks

| Risk | Fallback |
| --- | --- |
| Live OCR fails on a photo | Demo with one pre-tested document; keep manual entry visible as a feature, not an apology |
| Model latency kills the pacing | Skeleton loaders + streaming; rehearse talking over the wait |
| Venue wifi dies | Local build running on the laptop + recorded video on a USB stick |
| Seeded data looks fake | Build personas from real redacted reports, not from imagination — see §15 |
| Judge asks about regulation | One slide: synthetic data only during build; consent via ShareGrant; encryption at rest; audit log; named regime for production |
| Someone starts building a chatbot at 2am | Point at §5 "Won't have" |

---

## 14. Which markers do you support?

A **marker** is one measurable thing on a report — PCV, fasting blood sugar, genotype. A Nigerian lab printout carries 25–40 of them.

"Supporting a marker **properly**" means you can do more than display the number. Per marker you need every name labs print it under, the units and their conversions, the normal range, where the danger lines sit, plain-language copy for high and for low, and what to advise. That is real work, and it is the part where being wrong can hurt someone. **You cannot do forty of these in three weeks.**

So: **support three completely.** Every other value on the report gets extracted and displayed faithfully but not interpreted — *"Captured from your report. We don't interpret this one yet."* Honest, deliberate-looking, and judges read it as discipline rather than a gap.

**The Nigerian shortcut:** Nigerian lab reports **print the reference range on the page**, right next to the result. So don't build a range table — **extract the range from the document itself** and compare the value against the range that lab printed. You never claim clinical authority, you never source ranges you can't verify, and you get age- and sex-appropriate ranges for free because the lab already applied them.

**The three to pick:**

| Marker | Why | Input path |
| --- | --- | --- |
| **Fasting blood sugar** | Ubiquitous, cheap, constantly ordered; diabetes climbing fast | Uploaded lab report |
| **PCV / haemoglobin** | Anaemia is everywhere, and PCV is the term Nigerian labs actually print | Uploaded lab report |
| **Blood pressure** | Very high hypertension prevalence — and it is *not* on a lab report | Manual entry |

Blood pressure earning its place through manual entry is deliberate: it exercises your second input path live on stage. Malaria and genotype are more culturally recognisable but they're one-off results — nothing to plot on a timeline.

---

## 15. Working without a clinician

You don't have a doctor on the team. That is a real constraint, not a fatal one — but it must change how you build, because inventing plausible-looking clinical data is exactly what a judge with a medical background will catch.

**Design around it rather than pretending otherwise:**

1. **Take reference ranges from the source document** (see §14). This is the big one. It removes your need for clinical authority almost entirely.
2. **Build seeded personas from real, redacted reports.** Every one of you has old test results at home, or family who do. Blank out the names, keep the numbers and the layout. You get clinically real values *and* authentic Nigerian lab formats to test extraction against — which you need anyway.
3. **Label the provenance in the UI.** "Reference range as printed on your report." That single line turns the weakness into a visible design principle.
4. **A pharmacist, nurse, or medical student is enough**, and is far easier to find than a doctor — Nigerian universities are full of medical students, and one of them is somebody's cousin. Thirty minutes over WhatsApp is all you need. Keep looking, but don't block on it.
5. **Say it out loud in the pitch if asked.** "We have no clinician on the team, so we designed the system not to need one — we never assert a normal range, we show the one the lab printed." That is a far better answer than a shaky claim of clinical rigour.

---

## Appendix — tech notes (deliberately light)

**Stack: Next.js (App Router, TypeScript)**, in this repo. A skeleton is already in place with one placeholder route per screen in §6 and the rules engine stub in `lib/rules/` — see `README.md`. Build it **responsive web / PWA** rather than desktop-only, so the mobile version later is mostly free rather than a rewrite. The only two architectural decisions that will hurt you later if you get them wrong:

1. **Store the structured `Observation` rows, not just the model's raw output.** Everything — charts, flags, briefs — reads from structured data. The raw extraction is an audit artifact, not the source of truth.
2. **Put the rules engine in its own module with no model calls inside it.** It should be testable with plain fixtures. That's what makes "the rules decide" true rather than a slogan.
