// Layer 5 — Impact & Explainability
// ---------------------------------
// This file defines HOW impact is explained.
// It does NOT fetch data, does NOT automate anything,
// and does NOT compute real money.
//
// All values are illustrative and deterministic.
// Units are time and mandays (not currency).

/*
  Basic snapshot of operational loss
*/
export type ImpactSnapshot = {
    lostMinutes: number;     // total downtime
    mandaysLost: number;     // lostMinutes / DAILY_AVAILABLE_MINUTES
};

/*
  Before / After comparison
*/
export type ImpactComparison = {
    before: ImpactSnapshot;
    after: ImpactSnapshot;

    improvementMinutes: number;
    improvementMandays: number;

    direction: "UP" | "DOWN" | "NEUTRAL";
};

/*
  ---- DEMO ASSUMPTIONS (STATIC) ----
  These represent a factory BEFORE FloorSight.
  They are NOT measured values.
*/
export const BEFORE_FLOORSIGHT: ImpactSnapshot = {
    lostMinutes: 320,        // example historical daily downtime
    mandaysLost: 320 / 480,  // assumes 8h shift (illustrative)
};

/*
  Helper to build comparison
  (still deterministic, still read-only)
*/
export function buildImpactComparison(
    afterLostMinutes: number,
    dailyAvailableMinutes = 480
): ImpactComparison {
    const after: ImpactSnapshot = {
        lostMinutes: afterLostMinutes,
        mandaysLost: afterLostMinutes / dailyAvailableMinutes,
    };

    const improvementMinutes =
        BEFORE_FLOORSIGHT.lostMinutes - after.lostMinutes;

    const improvementMandays =
        BEFORE_FLOORSIGHT.mandaysLost - after.mandaysLost;

    let direction: ImpactComparison["direction"] = "NEUTRAL";
    if (improvementMinutes > 0) direction = "UP";
    if (improvementMinutes < 0) direction = "DOWN";

    return {
        before: BEFORE_FLOORSIGHT,
        after,
        improvementMinutes,
        improvementMandays,
        direction,
    };
}

/*
  ---- IMPORTANT LABEL (for UI) ----
  Must be shown wherever this is used.
*/
export const IMPACT_DISCLAIMER =
    "Illustrative impact based on time and mandays. No financial automation.";
