# BST — API contract v1 (draft)

> Status: **draft for the team to agree on day 2** (see `PLAN.md` §10). Once A/B and C/D both sign off, treat changes as a conversation, not a commit.

This is the seam between the four workstreams. **A (extraction) and B (rules) build behind it. C (patient UI) and D (doctor UI) build against it.** Every endpoint below ships first as a stub that returns the fixtures in §9, so the frontend never waits on the backend.

All data in this doc is synthetic. Never paste a real report or real patient detail into an example.

---

## 1. Ground rules

These follow from the plan. They are what makes "the model reads, the rules decide" true in code.

1. **Only the rules engine in `backend/rules/` creates a `Flag`.** No endpoint takes a severity from the client, and no model output ever becomes a severity.
2. **Nothing reaches the record unverified.** Extraction writes to the `Document` only. `Observation` and `Medication` rows exist only after the patient confirms on the verify screen, or types them in by hand.
3. **The reference range comes from the report.** `refLow` / `refHigh` are what the lab printed, carried through with `refSource: "report"`. The API never fills them from its own table (one exception, blood pressure, see §8).
4. **AI text is always labelled.** Any field written by a model is wrapped in an `AiText` object with `draft: true`. The UI renders those visibly differently. No exceptions.
5. **Unsupported markers are kept, not interpreted.** Anything other than the three supported markers is stored and shown with `supported: false` and never gets a flag.
6. **Small payloads.** Images are compressed client-side before upload (target under 500 KB). Responses send no images inline, only URLs.

---

## 2. Conventions

| Thing | Convention |
| --- | --- |
| Base path | `/api`, served by the backend in `backend/`. Its stack is not chosen yet. |
| Same origin | The frontend proxies `/api` to the backend, so the session cookies work without cross-origin setup. A Next.js rewrite in `frontend/next.config.ts` does this. |
| Format | JSON in and out, except the upload, which is `multipart/form-data` |
| IDs | Opaque strings with a type prefix: `doc_…`, `obs_…`, `med_…`, `flg_…`, `shr_…`, `not_…` |
| Times | ISO 8601 strings in UTC. The UI renders them in Africa/Lagos time. |
| Dates without a time | `YYYY-MM-DD` (e.g. `takenAt` when the report only prints a date) |
| Numbers | Plain JSON numbers, in the unit the report printed. No unit conversion in v1. |
| Errors | `{ "error": { "code": "SHARE_EXPIRED", "message": "This code has expired." } }` with a matching HTTP status |

### Who is calling

| Caller | How they're identified | Notes |
| --- | --- | --- |
| **Patient** | A session cookie set by picking a seeded persona. No login screen. | `POST /api/session` with `{ "personaId": "amara" }`. Cut real auth; it won't be seen on stage. |
| **Clinician** | A short-lived cookie issued when a share code is redeemed. No account. | The cookie carries the `ShareGrant` id. Every clinician call is limited to that grant's scope and expiry. |

A clinician call with no valid grant cookie gets `401 NO_GRANT`. A patient call with no persona cookie gets `401 NO_SESSION`.

---

## 3. Shared types

Written as TypeScript because that's what the app uses. This is the plan, not a file in the codebase yet. When the team agrees it, it moves into code. If the backend is also TypeScript, both sides import one shared file. If not, the backend mirrors these types, and any change lands in both in the same commit.

```ts
// ---- Markers -------------------------------------------------------------

/** The only markers BST interprets. See PLAN.md §14. */
type SupportedMarker =
  | "fbs"           // fasting blood sugar
  | "pcv"           // packed cell volume
  | "hb"            // haemoglobin
  | "bp_systolic"
  | "bp_diastolic";

// ---- AI output is always wrapped ----------------------------------------

interface AiText {
  text: string;
  draft: true;                  // literal true: the UI must label it
  lang: "en" | "pcm";           // pcm = Nigerian Pidgin
  generatedAt: string;
}

// ---- Documents and extraction --------------------------------------------

type DocumentKind = "lab" | "rx";
type DocumentStatus = "extracting" | "needs_review" | "verified" | "rejected" | "failed";

/** A region of the uploaded image, as fractions 0–1, for the crop on the verify screen. */
interface BBox { x: number; y: number; w: number; h: number }

interface ExtractedField<T> {
  value: T | null;
  confidence: number;           // 0–1, from the model
  needsReview: boolean;         // true when confidence < CONFIDENCE_THRESHOLD
  bbox: BBox | null;
}

interface ExtractedLabRow {
  rowId: string;
  label: ExtractedField<string>;          // as printed, e.g. "PCV", "F.B.S"
  marker: SupportedMarker | null;         // null = extracted but not interpreted
  value: ExtractedField<number | string>; // string for things like genotype "AS"
  unit: ExtractedField<string>;
  refLow: ExtractedField<number>;
  refHigh: ExtractedField<number>;
}

interface ExtractedRxRow {
  rowId: string;
  name: ExtractedField<string>;
  dose: ExtractedField<string>;           // "500 mg", kept as printed
  frequency: ExtractedField<string>;      // "twice daily", "BD"
  durationDays: ExtractedField<number>;
}

interface Document {
  id: string;
  kind: DocumentKind;
  status: DocumentStatus;
  fileUrl: string;
  uploadedAt: string;
  takenAt: ExtractedField<string> | null; // date printed on the report
  labName: ExtractedField<string> | null;
  rows: ExtractedLabRow[] | ExtractedRxRow[];
  failureReason?: string;                 // set when status = "failed"
}

// ---- The record ----------------------------------------------------------

type Source = "upload" | "manual";

interface Observation {
  id: string;
  documentId: string | null;              // null for manual entry
  source: Source;
  label: string;                          // as printed or as typed
  marker: SupportedMarker | null;
  supported: boolean;                     // marker !== null
  value: number | string;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  refSource: "report" | "guideline" | null; // see §8 for "guideline"
  takenAt: string;
  verifiedAt: string;
  correctedByPatient: boolean;            // true if any field was edited on verify
}

interface Medication {
  id: string;
  documentId: string | null;
  source: Source;
  name: string;
  rxnormCode: string | null;              // filled by B's lookup, never by the model
  dose: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
}

// ---- Rules output --------------------------------------------------------

type Severity = "info" | "warn" | "critical";

interface Flag {
  id: string;
  ruleId: string;                         // e.g. "range.high", "redflag.fbs", "ddi"
  severity: Severity;
  message: string;                        // written by the rule, never by a model
  observationIds: string[];
  medicationIds: string[];
  createdAt: string;
  review: FlagReview | null;              // set by the clinician on screen 7
}

interface FlagReview {
  action: "accepted" | "dismissed";
  reason: string | null;
  reviewedAt: string;
  grantId: string;                        // which share code the reviewer used
}

// ---- Consent -------------------------------------------------------------

type ShareScope = "all" | "labs_only" | "last_6_months";

interface ShareGrant {
  id: string;
  code: string;                           // "K7QM-2PX"; only returned to the patient
  scope: ShareScope;
  createdAt: string;
  expiresAt: string;
  claimedAt: string | null;               // bind on first claim
  clinicianName: string | null;           // typed by the clinician on redeem
  revokedAt: string | null;
}

interface AccessEvent {
  id: string;
  grantId: string;
  clinicianName: string | null;
  action: "opened_brief" | "reviewed_flag" | "added_note";
  at: string;
}

// ---- Notes (screen 7, and the async "consultation" in PLAN.md §5) --------

interface Note {
  id: string;
  author: "clinician" | "patient";
  authorName: string;
  body: string;
  createdAt: string;
  replyTo: string | null;                 // patient may reply once to a clinician note
}
```

**`CONFIDENCE_THRESHOLD`** starts at `0.85`. A owns the number. Below it, the field is highlighted on the verify screen and the patient must touch it before confirming.

---

## 4. Patient endpoints

Screens refer to `PLAN.md` §6.

| Method | Path | Screen | Owner | What it does |
| --- | --- | --- | --- | --- |
| `POST` | `/api/session` | — | C | Pick a seeded persona. Sets the patient cookie. |
| `GET` | `/api/home` | 1 | B | Everything the home screen needs in one call. |
| `POST` | `/api/documents` | 2 | A | Upload a lab report or prescription. Starts extraction. |
| `GET` | `/api/documents/:id` | 2 | A | Poll extraction status and get extracted rows. |
| `POST` | `/api/documents/:id/verify` | 2 | A → B | Confirm or correct rows. Writes the record and runs the rules. |
| `POST` | `/api/documents/:id/reject` | 2 | A | Discard a bad extraction. Nothing is written to the record. |
| `POST` | `/api/observations` | 2 | B | Manual entry. Blood pressure lives here. |
| `POST` | `/api/medications` | 2 | B | Manual entry of a medication. |
| `GET` | `/api/timeline?marker=fbs` | 3 | B | One marker's readings over time. |
| `GET` | `/api/observations/:id/explanation?lang=en` | 3 | A | Plain-language read of one reading. |
| `POST` | `/api/shares` | 4 | B | Create a share code. |
| `GET` | `/api/shares` | 4 | B | List the patient's codes with their access history. |
| `DELETE` | `/api/shares/:id` | 4 | B | Revoke a code now. |
| `GET` | `/api/notes` | 1 | B | Notes clinicians left, and the patient's replies. |
| `POST` | `/api/notes/:id/reply` | 1 | B | Reply once to a clinician note. *Should-have.* |

### 4.1 `GET /api/home`

```json
{
  "patient": { "name": "Amara Okafor", "age": 34, "sex": "F" },
  "redFlags": [
    {
      "id": "flg_01",
      "ruleId": "range.high",
      "severity": "warn",
      "message": "Fasting blood sugar 132 mg/dL is above the range your lab printed (70–110).",
      "observationIds": ["obs_07"],
      "medicationIds": [],
      "createdAt": "2026-08-10T09:14:00Z",
      "review": null
    }
  ],
  "nextMedication": { "medicationId": "med_02", "name": "Metformin", "dose": "500 mg", "dueAt": "2026-08-10T19:00:00Z" },
  "latest": [
    { "marker": "fbs", "value": 132, "unit": "mg/dL", "takenAt": "2026-08-09" },
    { "marker": "pcv", "value": 31, "unit": "%", "takenAt": "2026-08-09" }
  ],
  "unreadNotes": 1
}
```

`redFlags` holds only `warn` and `critical` flags with no clinician dismissal. `critical` drives the "seek care now" banner. Home is never empty: a persona with no data gets an empty `latest` array and the UI shows the upload prompt.

### 4.2 `POST /api/documents`

Request, as `multipart/form-data`:

| Field | Type | Notes |
| --- | --- | --- |
| `file` | image/jpeg, image/png, application/pdf | Compressed client-side. Max 5 MB; reject larger with `413 FILE_TOO_LARGE`. |
| `kind` | `"lab"` or `"rx"` | Chosen by the patient. Don't make the model guess. |

Response `202`:

```json
{ "id": "doc_14", "status": "extracting" }
```

Extraction runs after the response. The UI polls the next endpoint every 1.5 seconds and shows skeleton rows meanwhile. Polling instead of streaming keeps it simple and survives bad connections.

### 4.3 `GET /api/documents/:id`

Returns a `Document`. While `status` is `"extracting"`, `rows` is empty. When it is `"needs_review"`, the verify screen renders the rows beside the crop from each field's `bbox`.

```json
{
  "id": "doc_14",
  "kind": "lab",
  "status": "needs_review",
  "fileUrl": "/uploads/doc_14.jpg",
  "uploadedAt": "2026-08-10T09:12:41Z",
  "takenAt": { "value": "2026-08-09", "confidence": 0.97, "needsReview": false, "bbox": { "x": 0.62, "y": 0.08, "w": 0.2, "h": 0.03 } },
  "labName": { "value": "Example Diagnostics, Yaba", "confidence": 0.91, "needsReview": false, "bbox": null },
  "rows": [
    {
      "rowId": "r1",
      "label":   { "value": "F.B.S", "confidence": 0.95, "needsReview": false, "bbox": { "x": 0.08, "y": 0.31, "w": 0.15, "h": 0.03 } },
      "marker": "fbs",
      "value":   { "value": 132, "confidence": 0.78, "needsReview": true, "bbox": { "x": 0.45, "y": 0.31, "w": 0.08, "h": 0.03 } },
      "unit":    { "value": "mg/dL", "confidence": 0.93, "needsReview": false, "bbox": null },
      "refLow":  { "value": 70, "confidence": 0.9, "needsReview": false, "bbox": null },
      "refHigh": { "value": 110, "confidence": 0.9, "needsReview": false, "bbox": null }
    },
    {
      "rowId": "r2",
      "label":   { "value": "Genotype", "confidence": 0.98, "needsReview": false, "bbox": null },
      "marker": null,
      "value":   { "value": "AS", "confidence": 0.96, "needsReview": false, "bbox": null },
      "unit":    { "value": "", "confidence": 1, "needsReview": false, "bbox": null },
      "refLow":  { "value": null, "confidence": 1, "needsReview": false, "bbox": null },
      "refHigh": { "value": null, "confidence": 1, "needsReview": false, "bbox": null }
    }
  ]
}
```

Mapping a printed label like "F.B.S" to `marker: "fbs"` is a lookup table in B's code, not a model judgement. The model returns the label; B's alias table decides the marker.

### 4.4 `POST /api/documents/:id/verify`

The patient sends back every row, with corrections applied. Rows they removed are left out.

```json
{
  "takenAt": "2026-08-09",
  "rows": [
    { "rowId": "r1", "label": "F.B.S", "value": 132, "unit": "mg/dL", "refLow": 70, "refHigh": 110, "corrected": false },
    { "rowId": "r2", "label": "Genotype", "value": "AS", "unit": "", "refLow": null, "refHigh": null, "corrected": false }
  ]
}
```

Response `200`:

```json
{
  "document": { "id": "doc_14", "status": "verified" },
  "observations": [ /* Observation[] just written */ ],
  "medications": [],
  "flags": [ /* Flag[] the rules engine raised from this document */ ]
}
```

This is the moment the flag fires in the demo script. The handler writes the rows, calls `evaluate()` from `backend/rules/`, stores the flags and returns them in one response, so the UI can show the flag without a second request. Returns `409 ALREADY_VERIFIED` if called twice.

### 4.5 `POST /api/observations` — manual entry

Blood pressure is one reading with two numbers, so the request takes both and the server writes two observations.

```json
{ "kind": "bp", "systolic": 148, "diastolic": 95, "unit": "mmHg", "takenAt": "2026-08-10T07:30:00Z" }
```

Other manual entries use the generic shape:

```json
{ "kind": "generic", "label": "PCV", "value": 33, "unit": "%", "refLow": 36, "refHigh": 46, "takenAt": "2026-08-01" }
```

Response `201` has the same shape as verify: `{ observations, flags }`.

### 4.6 `GET /api/timeline?marker=fbs`

```json
{
  "marker": "fbs",
  "label": "Fasting blood sugar",
  "unit": "mg/dL",
  "points": [
    { "observationId": "obs_02", "value": 104, "takenAt": "2026-03-02", "refLow": 70, "refHigh": 110, "flagSeverity": null },
    { "observationId": "obs_05", "value": 118, "takenAt": "2026-05-20", "refLow": 70, "refHigh": 110, "flagSeverity": "warn" },
    { "observationId": "obs_07", "value": 132, "takenAt": "2026-08-09", "refLow": 70, "refHigh": 110, "flagSeverity": "warn" }
  ],
  "trend": { "ruleId": "trend.rising", "message": "Up 28 mg/dL over 5 months." },
  "mixedUnits": false
}
```

Each point carries its own range because two labs may print different ones. The chart shades the band per point. If readings come in different units, `mixedUnits` is `true` and the UI shows a note instead of drawing one line. There is no unit conversion in v1.

### 4.7 `GET /api/observations/:id/explanation?lang=en|pcm`

```json
{
  "observationId": "obs_07",
  "explanation": {
    "text": "Your fasting sugar was 132. Your lab says it should be between 70 and 110, so it's higher than they expect.",
    "draft": true,
    "lang": "en",
    "generatedAt": "2026-08-10T09:15:02Z"
  },
  "basedOn": { "flagId": "flg_01", "rangeSource": "report" }
}
```

The model is given the observation **and the flag the rules already raised**, and it only rephrases them. It is never asked "is this normal?" and it never adds advice. Any "what to do" line comes from the rule's own `message`. For an unsupported marker this endpoint returns `422 NOT_INTERPRETED` and the UI shows "Captured from your report. We don't interpret this one yet." Cache the result per observation and language so the demo never waits on it twice.

### 4.8 `POST /api/shares`

```json
{ "scope": "all", "expiresInHours": 24 }
```

`expiresInHours` may be `1`, `24` or `72`. Anything else gets `400`. Response `201` is a `ShareGrant` including the `code`. The UI shows it large and as a QR code of `/clinician?code=K7QM-2PX`.

### 4.9 `GET /api/shares`

```json
{
  "shares": [
    {
      "grant": { "id": "shr_03", "code": "K7QM-2PX", "scope": "all", "createdAt": "2026-08-10T09:20:00Z", "expiresAt": "2026-08-11T09:20:00Z", "claimedAt": "2026-08-10T09:22:10Z", "clinicianName": "Dr. Adeyemi", "revokedAt": null },
      "access": [
        { "id": "acc_1", "grantId": "shr_03", "clinicianName": "Dr. Adeyemi", "action": "opened_brief", "at": "2026-08-10T09:22:11Z" }
      ]
    }
  ]
}
```

This powers "Dr. Adeyemi viewed your labs on 10 Aug at 10:22."

---

## 5. Clinician endpoints

| Method | Path | Screen | Owner | What it does |
| --- | --- | --- | --- | --- |
| `POST` | `/api/shares/redeem` | 5 | B | Trade a code for a grant cookie. |
| `GET` | `/api/brief` | 6 | B (+A for summary) | The one-page brief, filtered to the grant's scope. |
| `GET` | `/api/brief/summary` | 6 | A | The AI draft summary, fetched separately so the brief renders without waiting. |
| `POST` | `/api/flags/:id/review` | 7 | B | Accept or dismiss a flag with a reason. |
| `POST` | `/api/notes` | 7 | B | Leave a clinical note on the record. |

### 5.1 `POST /api/shares/redeem`

```json
{ "code": "K7QM-2PX", "clinicianName": "Dr. Adeyemi" }
```

Codes are matched case-insensitively and with the dash optional, because they get read aloud.

| Outcome | Status | Body |
| --- | --- | --- |
| Valid and unclaimed, or claimed by this same browser | `200` | `{ "grantId": "shr_03", "scope": "all", "expiresAt": "…", "patientName": "Amara Okafor" }` and the grant cookie is set |
| Unknown code | `404` | `INVALID_CODE` |
| Expired | `410` | `SHARE_EXPIRED` |
| Revoked | `410` | `SHARE_REVOKED` |
| Already claimed by someone else | `409` | `SHARE_CLAIMED` |
| 5 failed attempts from one IP in 15 minutes | `429` | `TOO_MANY_ATTEMPTS` |

These are the three defences from `PLAN.md` §7: short expiry, rate limit, and bind on first claim. `clinicianName` is self-declared. The UI labels it that way and the plan does not verify doctors; see the telemedicine argument in §5 of the plan.

### 5.2 `GET /api/brief`

Every call writes an `opened_brief` access event.

```json
{
  "patient": { "name": "Amara Okafor", "age": 34, "sex": "F", "conditions": ["Type 2 diabetes"], "allergies": ["Sulfa drugs"] },
  "grant": { "scope": "all", "expiresAt": "2026-08-11T09:20:00Z" },
  "flags": [ /* Flag[], critical first, includes reviewed ones */ ],
  "medications": [ /* Medication[] active now */ ],
  "trends": [
    { "marker": "fbs", "latest": 132, "unit": "mg/dL", "direction": "up", "points": 3 },
    { "marker": "pcv", "latest": 31, "unit": "%", "direction": "down", "points": 3 },
    { "marker": "bp_systolic", "latest": 148, "unit": "mmHg", "direction": "flat", "points": 4 }
  ],
  "recentDocuments": [
    { "id": "doc_14", "kind": "lab", "labName": "Example Diagnostics, Yaba", "takenAt": "2026-08-09", "fileUrl": "/uploads/doc_14.jpg" }
  ],
  "notes": [ /* Note[] */ ]
}
```

Every number in the brief links back to its observation, and every observation links to its document. That is how the doctor gets "every number links back to the source document" from `PLAN.md` §2. `recentDocuments` holds at most three. Scope filtering happens on the server; the client never receives data outside the grant.

### 5.3 `GET /api/brief/summary`

```json
{
  "summary": {
    "text": "34-year-old woman with type 2 diabetes. Fasting sugar has risen across three readings since March, most recently 132 mg/dL. PCV has fallen to 31%. On metformin 500 mg twice daily. One flag pending review.",
    "draft": true,
    "lang": "en",
    "generatedAt": "2026-08-10T09:22:12Z"
  },
  "inputs": ["obs_02", "obs_05", "obs_07", "obs_09", "med_02", "flg_01"]
}
```

The model sees **only the structured fields** listed in `inputs`, never the document images. Listing them lets the UI show what the summary was built from.

### 5.4 `POST /api/flags/:id/review`

```json
{ "action": "dismissed", "reason": "Known and being managed." }
```

Returns the updated `Flag`. A dismissed flag stays on the brief, greyed, and drops off the patient's home banner. The rules engine never deletes a flag.

### 5.5 `POST /api/notes`

```json
{ "body": "Repeat FBS in 4 weeks. Bring the result to your next visit." }
```

Returns the `Note`. The patient sees it on home and may reply once.

---

## 6. Status and error codes

| HTTP | Code | When |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Missing or malformed field. `message` names it. |
| 401 | `NO_SESSION` / `NO_GRANT` | Missing patient cookie or clinician grant. |
| 403 | `OUT_OF_SCOPE` | Clinician asked for data outside the grant's scope. |
| 404 | `NOT_FOUND` / `INVALID_CODE` | — |
| 409 | `ALREADY_VERIFIED` / `SHARE_CLAIMED` | — |
| 410 | `SHARE_EXPIRED` / `SHARE_REVOKED` | — |
| 413 | `FILE_TOO_LARGE` | Upload over 5 MB. |
| 422 | `NOT_INTERPRETED` | Explanation asked for an unsupported marker. |
| 429 | `TOO_MANY_ATTEMPTS` | Share code rate limit. |
| 502 | `EXTRACTION_FAILED` | Model call failed. The document goes to `"failed"` and the UI offers manual entry. |

---

## 7. Who owns what

| Workstream | Implements | Consumes |
| --- | --- | --- |
| **A — Extraction** | Upload, document status, verify handler's write step, explanation, summary | `backend/rules/` alias table for marker mapping |
| **B — Rules + data** | `backend/rules/`, home, timeline, manual entry, shares, redeem, brief, flags, notes, fixtures | Verified rows from A |
| **C — Patient UI** | Screens 1–4 | Every patient endpoint |
| **D — Doctor UI** | Screens 5–7 | Every clinician endpoint |

The verify handler is the one place A and B meet in a single request. A writes the observations, then calls B's `evaluate()`. Agree that function's signature first; the stub in `backend/rules/index.ts` is the starting point.

---

## 8. Decisions this contract needs from the team

1. **Blood pressure has no printed range.** It comes from manual entry, so there is no lab range to compare against, and the plan says the app never asserts its own. Options:
   - **(Recommended)** Use thresholds from one named, published hypertension guideline, store them as `refSource: "guideline"`, and show "Thresholds from [guideline name], not from your doctor" in the UI. That cites an authority rather than claiming one. Ask the medical student contact to sanity-check the numbers if one turns up.
   - Show blood pressure as a chart with no flags at all. Safe, but the demo loses a flag on the second input path.
2. **Should-have endpoints.** Flag review, notes and replies are should-haves in `PLAN.md` §5. Stub them on day 2 anyway so the shape is fixed, but don't build them until week 3 is calm.
3. **Confidence threshold.** `0.85` is a guess. A should tune it on the real redacted reports in week 1.

---

## 9. Stubs and fixtures

The backend doesn't exist yet, so the stubs live on the frontend side. The frontend's API client has one switch. In mock mode it returns fixtures from `frontend/fixtures/`, keyed by persona, instead of calling the network. Same response shapes, synthetic data, no database. When an endpoint goes live on the backend, flip that endpoint to the network. B owns the fixtures and builds them from the three seeded personas in `PERSONAS.md`.

Rules for fixtures:

- **Every fixture validates against the types in §3.** If the types change, the fixtures change in the same commit.
- **Stubs simulate the slow parts.** `GET /api/documents/:id` returns `"extracting"` for the first two polls, so C builds the loading state for real.
- **One fixture per error path the demo could hit:** expired code, claimed code, failed extraction. Those are the states that break live demos. `PERSONAS.md` assigns each one to a persona.
- **Fixtures never contain a flag the rules engine wouldn't raise.** Until the engine runs, B writes the expected flags by hand, then replaces them with real engine output once it exists.
