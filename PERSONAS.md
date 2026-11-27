# BST — Seeded personas v1 (draft)

> Status: **draft.** Every name, lab, value and document here is invented. The numbers are placeholders shaped like real Nigerian reports. Before week 3 they get checked against the team's real redacted reports, as described in §5.

Three patients, one doctor. Each persona carries a different part of the demo, so between them they exercise every screen in `PLAN.md` §6, both input paths, and every error state the demo could hit.

| | Amara | Babatunde | Efe |
| --- | --- | --- | --- |
| **Job in the demo** | The stage persona. The whole three-minute script runs on her. | Proves the app works with **no documents at all**. | Proves BST **captures everything but only interprets three markers**. |
| **Input path** | Uploads and manual entry | Manual entry only | Uploads, including one that fails |
| **Marker arc** | Fasting blood sugar rising, PCV falling | Blood pressure falling on treatment | Haemoglobin falling |
| **Rules it fires** | Range, trend, duplicate therapy | Trend (and range, once BP thresholds are decided) | Range, trend |
| **Error state it owns** | Share code already claimed | Share code expired | Extraction failed |

---

## 1. How dates work

Every date is written as an offset from **demo day, `D`**. `D−82` means 82 days before the demo. The fixtures compute real dates from today, so the timeline never looks stale however often the demo date moves.

The examples in `API.md` use fixed dates in August 2026. Those are only illustrations of the shapes.

All three personas use the same unit for each marker, so `mixedUnits` is never triggered in the demo.

---

## 2. Amara Okafor — the stage persona

| Field | Value |
| --- | --- |
| Persona id | `amara` |
| Age, sex | 34, F |
| Lives | Yaba, Lagos |
| Works | Secondary school teacher |
| Conditions (as she entered them) | Type 2 diabetes |
| Allergies (as she entered them) | Sulfa drugs |
| Language | English |

**Her story in one line.** Her fasting sugar has crept up across three reports, her PCV has drifted below her lab's range, and she has ended up on two medicines that both contain paracetamol without noticing.

### Documents

| When | Kind | Source | What's on it |
| --- | --- | --- | --- |
| `D−160` | Lab | Example Diagnostics, Yaba | FBS, PCV, genotype, malaria parasite |
| `D−82` | Lab | Example Diagnostics, Yaba | FBS, PCV |
| `D−80` | Prescription | Fictional GP clinic, Yaba | Metformin |
| `D−2` | Prescription | Fictional GP clinic, Yaba | Paracetamol |
| **Live on stage** | **Lab** | **Example Diagnostics, Yaba** | **FBS, PCV. This is the printout held up in the hook.** |

### Readings

| When | Label as printed | Value | Unit | Range as printed | Supported |
| --- | --- | --- | --- | --- | --- |
| `D−160` | F.B.S | 104 | mg/dL | 70–110 | Yes |
| `D−160` | PCV | 36 | % | 36–46 | Yes |
| `D−160` | Genotype | AA | | | No |
| `D−160` | M.P | Not seen | | | No |
| `D−82` | F.B.S | 118 | mg/dL | 70–110 | Yes |
| `D−82` | PCV | 33 | % | 36–46 | Yes |
| **Live** | **F.B.S** | **132** | **mg/dL** | **70–110** | **Yes** |
| **Live** | **PCV** | **31** | **%** | **36–46** | **Yes** |

Blood pressure, typed in by hand:

| When | Systolic | Diastolic | Unit |
| --- | --- | --- | --- |
| `D−60` | 146 | 94 | mmHg |
| `D−40` | 150 | 96 | mmHg |
| `D−20` | 147 | 93 | mmHg |
| `D−5` | 148 | 95 | mmHg |

On the live report, set the FBS value in a slightly faded or smudged print. It should extract with low confidence, so the verify screen highlights it and the narrator can dwell on that moment as the script asks.

### Medications

| Name | Dose and frequency as written | From | Active |
| --- | --- | --- | --- |
| Metformin | 500 mg, twice daily | Prescription `D−80` | `D−80` onward |
| Paracetamol | 1 g, three times daily for 5 days | Prescription `D−2` | `D−2` to `D+3` |
| Panadol Extra | 2 tablets as needed | Typed in by hand `D−1` | `D−1` onward |

### Flags the rules engine should raise

| Rule | Severity | Message | Seeded or live |
| --- | --- | --- | --- |
| `range.high` | warn | Fasting blood sugar 118 mg/dL is above the range your lab printed (70–110). | Seeded |
| `range.low` | warn | PCV 33% is below the range your lab printed (36–46). | Seeded |
| `duplicate` | warn | Paracetamol appears in two of your active medicines: Paracetamol and Panadol Extra. | Seeded |
| `range.high` | warn | Fasting blood sugar 132 mg/dL is above the range your lab printed (70–110). | **Fires live** |
| `range.low` | warn | PCV 31% is below the range your lab printed (36–46). | **Fires live** |
| `trend.rising` | info | Fasting blood sugar is up 28 mg/dL across 3 readings. | **Fires live** |
| `trend.falling` | info | PCV is down 5 points across 3 readings. | **Fires live** |

The duplicate-therapy flag is a pure ingredient match: Panadol Extra contains paracetamol. That needs no clinical judgement, which is why it was picked over a drug–drug interaction. If the team wants an interaction flag on stage too, pick a pair and confirm it in DDInter or openFDA first. Do not take a pair from this doc or from a model.

### Sharing and the doctor

| Code | State | Use |
| --- | --- | --- |
| Generated live | New | The demo handoff. Amara reads it to Dr. Adeyemi. |
| `R4TN-8WD` | Claimed at `D−30` by "Dr. Nwosu" | The **already claimed** error. Redeeming it again returns `SHARE_CLAIMED`. |

---

## 3. Babatunde Adewale — the no-documents persona

| Field | Value |
| --- | --- |
| Persona id | `babatunde` |
| Age, sex | 58, M |
| Lives | Bodija, Ibadan |
| Works | Retired civil servant |
| Conditions (as he entered them) | Hypertension |
| Allergies | None known |
| Language | English |

**His story in one line.** He has never uploaded anything. He types his blood pressure in every week from a home monitor, and his medicine by hand, and the doctor brief still works.

This persona is the answer to "what about a consultation without a report?" from `PLAN.md` §5. If a judge asks, switch to Babatunde and open his brief.

### Readings

All typed in by hand. No documents.

| When | Systolic | Diastolic | Unit |
| --- | --- | --- | --- |
| `D−42` | 164 | 102 | mmHg |
| `D−35` | 158 | 98 | mmHg |
| `D−28` | 155 | 97 | mmHg |
| `D−21` | 150 | 94 | mmHg |
| `D−14` | 146 | 92 | mmHg |
| `D−7` | 144 | 90 | mmHg |
| `D−1` | 141 | 89 | mmHg |

### Medications

| Name | Dose and frequency as typed | Active |
| --- | --- | --- |
| Amlodipine | 10 mg, once daily | `D−45` onward |

### Flags the rules engine should raise

| Rule | Severity | Message |
| --- | --- | --- |
| `trend.falling` | info | Systolic blood pressure is down 23 mmHg across 7 readings. |
| `range.*` | **depends on §6, decision 1** | Blood pressure has no printed range. Which readings flag, if any, depends on where the thresholds come from. |

### Sharing and the doctor

| Code | State | Use |
| --- | --- | --- |
| `H2LC-9QF` | Created `D−10` for 24 hours, claimed by "Dr. Okonkwo", now expired | The **expired** error. Redeeming it returns `SHARE_EXPIRED`. |

Notes left through that code before it expired:

| Who | Note |
| --- | --- |
| Dr. Okonkwo | Continue amlodipine 10 mg daily. Keep recording your BP weekly and bring the readings to your next visit. |
| Babatunde (his one reply) | Thank you doctor. I will keep recording it. |

That gives the notes and reply fixtures real content without building them on stage.

---

## 4. Efe Ogheneovo — the "we capture everything" persona

| Field | Value |
| --- | --- |
| Persona id | `efe` |
| Age, sex | 26, F |
| Lives | D-Line, Port Harcourt |
| Works | Postgraduate student |
| Conditions | None entered |
| Allergies | None known |
| Language | **Nigerian Pidgin** |

**Her story in one line.** Her lab prints haemoglobin rather than PCV, her reports carry results BST deliberately doesn't interpret, and one of her photos is too blurry to read.

### Documents

| When | Kind | Source | What's on it |
| --- | --- | --- | --- |
| `D−190` | Lab | Kestrel Medical Laboratory, Port Harcourt | Hb, genotype, malaria parasite |
| `D−100` | Lab | Kestrel Medical Laboratory, Port Harcourt | Hb, malaria parasite, Widal |
| `D−100` | Prescription | Fictional clinic, Port Harcourt | Antimalarial |
| `D−25` | Lab | Kestrel Medical Laboratory, Port Harcourt | Hb |
| `D−25` | Prescription | Fictional clinic, Port Harcourt | Iron and folic acid |
| `D−6` | Lab | Blurry photo | **Extraction fails.** Status `failed`, and the UI offers manual entry. |

### Readings

| When | Label as printed | Value | Unit | Range as printed | Supported |
| --- | --- | --- | --- | --- | --- |
| `D−190` | Haemoglobin (Hb) | 12.4 | g/dL | 11.5–16.5 | Yes |
| `D−190` | Genotype | AS | | | No |
| `D−190` | Malaria Parasite | Not seen | | | No |
| `D−100` | Haemoglobin (Hb) | 11.1 | g/dL | 11.5–16.5 | Yes |
| `D−100` | Malaria Parasite | + (seen) | | | No |
| `D−100` | Widal: S. typhi O | 1/80 | | | No |
| `D−100` | Widal: S. typhi H | 1/160 | | | No |
| `D−25` | Haemoglobin (Hb) | 9.8 | g/dL | 11.5–16.5 | Yes |

Her unsupported results are the point. A positive malaria result and a Widal titre are things a Nigerian patient cares about. BST shows them faithfully and says "Captured from your report. We don't interpret this one yet." That restraint is the discipline `PLAN.md` §14 wants judges to see.

### Medications

| Name | Dose and frequency as written | From | Active |
| --- | --- | --- | --- |
| Artemether-lumefantrine | 80/480 mg, twice daily for 3 days | Prescription `D−100` | `D−100` to `D−97` |
| Ferrous sulphate | 200 mg, twice daily | Prescription `D−25` | `D−25` onward |
| Folic acid | 5 mg, once daily | Prescription `D−25` | `D−25` onward |

These are recorded as the prescription printed them. BST never suggests a dose.

### Flags the rules engine should raise

| Rule | Severity | Message |
| --- | --- | --- |
| `range.low` | warn | Haemoglobin 11.1 g/dL is below the range your lab printed (11.5–16.5). |
| `range.low` | warn | Haemoglobin 9.8 g/dL is below the range your lab printed (11.5–16.5). |
| `trend.falling` | info | Haemoglobin is down 2.6 g/dL across 3 readings. |

Nothing fires on genotype, malaria or Widal. That is correct behaviour, not a gap.

### The Pidgin explanation

For the `D−25` haemoglobin reading, the draft explanation might read:

> Your Hb na 9.8. Your lab talk say e suppose dey between 11.5 and 16.5, so e don go down pass wetin dem expect.

**A native Pidgin speaker on the team must rewrite this before it goes anywhere near the demo.** Like the English version, it only restates the rule's flag and adds no advice.

### Sharing

| Code | State | Use |
| --- | --- | --- |
| `M8VX-3JD` | Created `D−40`, revoked `D−38` before anyone used it | The **revoked** error. Redeeming it returns `SHARE_REVOKED`. |

---

## 5. Making the numbers credible

`PLAN.md` §15 says seed data should come from real redacted reports. The house rules say nothing real goes in this repo. Both hold if the real reports are used to **check** this file, not to fill it.

1. **Keep real redacted reports out of the repo.** Put them in the team's private drive, never in Git.
2. **Use them to check four things:** how labs spell each marker, which units they print, the reference ranges they print, and how the page is laid out.
3. **Copy printed ranges freely.** A range a lab prints is a fact about that lab, not about a patient. Replace the ranges above with ones copied from a real report.
4. **Keep patient values invented.** Adjust them so they sit plausibly against the real ranges, but never copy a real person's results.
5. **Make the printouts.** Amara's live report and every seeded document need a printable synthetic version in the same layout as a real Nigerian report. Extraction has to be tested against those exact printouts, since they are what goes in front of the camera on stage.
6. **Check the names.** Make sure no persona, lab or doctor name matches a real business, a public figure, or anyone the team knows.

If the medical student contact turns up, these three personas are what to show them in the thirty minutes.

---

## 6. Decisions the personas expose

1. **Blood pressure thresholds.** Already open in `API.md` §8. Babatunde's range flags and Amara's blood pressure flags both wait on it. His trend flag works either way.
2. **"Seek care now" needs critical thresholds the team can't set.** The red-flag banner on the home screen needs a line where a value becomes critical. Labs print a normal range, not a danger line, so the "range from the report" approach doesn't cover it. None of the personas has a `critical` flag until the team decides. The options mirror blood pressure: cite one named, published source for each of the three markers, or leave the banner out of the demo and keep every flag at `warn`. Checking whether any of the real reports mark critical values on the page is worth doing first.
3. **Which persona the app opens on.** Recommended: Amara, with Babatunde and Efe one tap away on a persona switcher. Judges should never see a login screen.
