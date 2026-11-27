# BST frontend

The Next.js app (App Router, TypeScript) for both views: patient and clinician.

The plan lives at the repo root in `PLAN.md`. The API this app talks to is described in `API.md`, also at the root.

## Run

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

## Layout

| Path | What it is |
| --- | --- |
| `app/` | Next.js App Router. One placeholder page per screen in `PLAN.md` §6. |

There is no clinical logic here. Every flag, range check and urgency call comes from the backend's rules engine. The frontend displays what it is given.

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
