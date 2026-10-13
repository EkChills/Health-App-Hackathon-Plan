/**
 * Rules engine.
 *
 * "The model reads. The rules decide."
 *
 * This module makes every clinical judgement (ranges, interactions,
 * urgency) deterministically. It must contain ZERO model calls and must be
 * testable with plain fixtures. See PLAN.md §4 and the Appendix.
 *
 * The app never asserts its own normal range. It compares a value against
 * the reference range the lab printed on the report (ref_low / ref_high on
 * the Observation).
 */

export type Severity = "info" | "warn" | "critical";

export interface Observation {
  code: string;
  label: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
}

export interface Flag {
  ruleId: string;
  severity: Severity;
  message: string;
}

export function evaluate(_observations: Observation[]): Flag[] {
  // TODO: implement range, interaction and urgency rules.
  return [];
}
