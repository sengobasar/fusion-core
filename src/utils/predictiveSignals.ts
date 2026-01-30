// Layer 6 — Predictive Signals (Rule-based, Explainable)
// ----------------------------------------------
// NO ML training
// NO automation
// NO execution
// Uses simple frequency + trend heuristics

import type { SignalType } from "../types/signal";

export type PredictiveSignal = {
    houseId: string;
    type: SignalType;
    likelihood: "LOW" | "MEDIUM" | "HIGH";
    basis: string; // human-readable explanation
};

/*
  Input shape: historical event counts per house
*/
type IssueCountMap = Record<string, Record<string, number>>;

/*
  Simple heuristic:
  - If same issue repeats frequently → higher likelihood
*/
export function buildPredictiveSignals(
    issueCountsByHouse: IssueCountMap
): PredictiveSignal[] {
    const predictions: PredictiveSignal[] = [];

    for (const [houseId, issues] of Object.entries(issueCountsByHouse)) {
        for (const [issue, count] of Object.entries(issues)) {
            let likelihood: PredictiveSignal["likelihood"] = "LOW";

            if (count >= 5) likelihood = "HIGH";
            else if (count >= 3) likelihood = "MEDIUM";

            if (likelihood === "LOW") continue;

            let type: SignalType = "PLANNING_RISK";
            if (issue === "NO_MATERIAL") type = "SUPPLY_RISK";
            if (issue === "THREAD_BREAK") type = "QUALITY_RISK";
            if (issue === "NO_ORDER") type = "PLANNING_RISK";

            predictions.push({
                houseId,
                type,
                likelihood,
                basis: `${issue} occurred ${count} times recently`,
            });
        }
    }

    return predictions;
}
