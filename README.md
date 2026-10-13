# BST

A photo of a lab report or prescription goes in. Structured, verified health data comes out, explained in plain language for the patient and handed to the doctor as a one-page clinical brief.

The plan lives in `PLAN.md`. This directory also holds the Next.js app skeleton.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Layout

| Path | What it is |
| --- | --- |
| `app/` | Next.js App Router. One placeholder page per screen in `PLAN.md` §6. |
| `lib/rules/` | The deterministic rules engine. No model calls, ever. |

## Routes

| Route | Screen (PLAN.md §6) |
| --- | --- |
| `/` | 1. Home |
| `/upload` | 2. Upload & verify |
| `/timeline` | 3. Timeline |
| `/share` | 4. Share |
| `/clinician` | 5. Enter code / patient list |
| `/clinician/[code]` | 6. Brief |
| `/clinician/[code]/verify` | 7. Verify & note |
