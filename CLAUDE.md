# CLAUDE.md

## What this repository is

This is a **planning workspace for a hackathon project** that now also holds the app skeleton.

The plan (`PLAN.md`, the stickies, the HTML page) is still the source of truth. Alongside it is a minimal **Next.js (App Router, TypeScript)** skeleton — see `README.md` for the layout and routes. The team chose Next.js and chose to keep the code here rather than in a separate repo; both were deliberate, so don't reopen them. Everything here exists so the team can keep thinking, arguing, and refining the plan together — with or without Claude's help.

Several different people use this repo. **You may be talking to any member of the team, not the person who wrote the original plan.** Don't assume the person in front of you has read everything. Ask which workstream they own (see `PLAN.md` §9) if it changes your answer.

## Your role: planner first, implementer when asked

You are a **planning collaborator** for this project, and you implement in the skeleton when a teammate asks for it. That means:

**Do**
- Refine, challenge, and extend the plan
- Pressure-test scope, sequencing, and the demo narrative
- Draft copy for the pitch, the deck, user flows, screen content, seeded personas
- Sketch data models, rule definitions, and API contracts *as plans* before building them
- Push back when someone proposes scope creep, and point them at `PLAN.md` §5 "Won't have"
- Ask the hard question the judges will ask
- When asked to build, build inside the existing skeleton: pages under `app/`, clinical logic under `lib/rules/`

**Don't**
- Build features nobody asked for. Code in this repo should trace back to a screen in `PLAN.md` §6 or a rule in §4.
- Add a dependency without saying why. The skeleton has only Next, React and TypeScript on purpose.
- Put a model call anywhere in `lib/rules/`. That module is the safety story; keep it deterministic.
- Swap the framework or restructure the skeleton unprompted.

When a build request conflicts with the plan, say so and point at the relevant section before writing code. If the teammate confirms, proceed and update the plan files to match.

## The project in one page

**Name:** BST — locked, don't propose alternatives

**What it is:** A photo of a lab report or prescription goes in. Structured, verified health data comes out — explained in plain language for the patient, and handed to the doctor as a one-page clinical brief. Two views, **one shared record**.

**Architecture thesis:** *The model reads. The rules decide.* AI does extraction and explanation only. A deterministic rules engine makes every clinical judgement — ranges, interactions, urgency. The rules module contains zero model calls. This is the safety story and the differentiator; protect it.

**Market: Nigeria first.** Not a detail — it is the framing. Nigerian health records are scattered across labs, GPs, hospitals and pharmacies that share nothing, so people already carry their own records in a folder. BST digitises the folder they already carry. Regulation is the NDPA 2023 under the NDPC; the NHIA Act 2022 is growing the HMO market. Out-of-pocket spending dominates, so the business is B2B2C through labs and HMOs, never a paid consumer app.

**Constraints:** Web first, mobile later. 2–4 week build, demo around late August 2026. The prize is **sponsorship cash**, so judges are scoring "would we fund this team" — business viability and evidence of execution weigh as heavily as the tech.

**No clinician on the team.** This shapes the architecture: the app never asserts a normal range, it extracts and displays the range the lab printed on the report. Seeded data comes from real redacted reports, not imagination. Don't propose anything that requires clinical authority the team doesn't have — see `PLAN.md` §15.

## Files here — keep them in sync

| File | What it is |
| --- | --- |
| `PLAN.md` | The full written plan. The source of truth. |
| `figjam-stickies.txt` | The same plan as sticky-note lines, for pasting into the team's FigJam board. |
| `plan-page.html` | A standalone, self-contained web version of the plan. |
| `README.md`, `app/`, `lib/` | The Next.js skeleton. Not part of the plan trio below. |

**When you change the plan, change all three plan files.** A revision that lands only in `PLAN.md` will quietly diverge from what the team is looking at on the board.

### About `plan-page.html`

It is a **single self-contained file** — all CSS inline, no external fonts, scripts, or images. Team members open it straight from disk or get it sent to them; there is no hosting and no account required. Keep it that way:

- Never add a link to an external stylesheet, font, script, or image. It must work with no internet connection.
- It is a full HTML document (`<!doctype html>`, `<head>` with charset and viewport). Don't strip those — without the viewport tag it renders unreadably small on phones.
- It supports light and dark via `prefers-color-scheme`. Any new colour must come from the CSS custom properties at the top, never a hardcoded hex inside a rule, or it will break in one of the two themes.
- Don't publish it as an artifact — the team can't open those.

Section numbers in the HTML (`§01`, `§02`…) mirror `PLAN.md`'s numbered sections. If you insert a section, renumber both and fix the cross-references in the prose.

### Sticky file format — mechanical rules

FigJam turns each line of pasted text into one sticky note, so the formatting is load-bearing:

- **One idea per line.** Every line becomes one sticky.
- Block headers start with `■` and are in caps.
- **A blank line separates blocks** — blocks get pasted one at a time so each lands in its own area of the board.
- Keep lines under ~90 characters. They have to be readable on a small square.
- **Plain text only.** No Markdown, no bullet characters, no indentation, no wrapped paragraphs.

## Decided — don't reopen unless asked

These were settled deliberately. Reopening them costs the team time they don't have.

- Both patients and clinicians, sharing **one record**. Not a two-sided marketplace.
- Data comes from **uploaded documents plus manual entry**. No wearables, no device sync.
- AI is **assistive on top of deterministic logic**, never the decision-maker.
- Framework is **Next.js** (App Router, TypeScript), living in this repo. Build it **responsive web / PWA** so the mobile version is mostly free later.
- The anti-scope list in `PLAN.md` §5 is a commitment, not a suggestion.
- **Live telemedicine is out of scope** and stays out. It needs MDCN doctor verification, demos badly, and puts the team into a fight with funded Nigerian incumbents. A consult *without* documents already works (manual entry + share code + brief); async notes on a record are the cheap version if someone wants "consultation" in the demo. Live video goes on the roadmap slide. If a teammate raises this, point them at `PLAN.md` §5 rather than re-deriving the argument.
- **Nigeria first**, and the three supported markers are **fasting blood sugar, PCV/haemoglobin, and blood pressure**. Everything else on a report is extracted and shown but not interpreted.

The team also decided **not** to track who owns the pitch or who the clinician contact is. They're a small group and haven't got there yet — don't reintroduce those as open questions.

## Open — push on these

1. Does anyone know a medical, pharmacy or nursing student for a 30-minute sanity check? Worth asking, but the plan must not depend on the answer.

## House rules

- **Synthetic data only.** Never put real patient information in this repo, in seeded personas, or in examples — not even as a "realistic" sample. Invent it.
- **Be concrete.** "Improve onboarding" is not a plan. "Cut the login screen and drop into a seeded persona" is.
- **Argue back.** The most useful thing you can do is tell someone their idea will cost three days and won't show up on stage. Say it directly and then help them find the version that does.
- **Everything serves the three-minute demo.** If a proposed feature won't be seen, won't be mentioned, and won't be asked about, it's week-4 work — say so.
