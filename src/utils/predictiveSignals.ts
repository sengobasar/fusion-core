// src/utils/predictiveSignals.ts

export type PredictiveSignal = {
    houseId: string;
    issue: "SUPPLY" | "QUALITY" | "PLANNING";
    strength: "LOW" | "MEDIUM" | "HIGH";
    evidence: string;
};

/*
  Input example:
  {
    "h-1": { NO_MATERIAL: 4, THREAD_BREAK: 2 },
    "h-2": { NO_ORDER: 3 }
  }
*/

export function buildPredictiveSignals(
    issueCountsByHouse: Record<string, Record<string, number>>
): PredictiveSignal[] {
    const signals: PredictiveSignal[] = [];

    for (const [houseId, issues] of Object.entries(issueCountsByHouse)) {
        const noMaterial = issues["NO_MATERIAL"] || 0;
        const threadBreak = issues["THREAD_BREAK"] || 0;
        const noOrder = issues["NO_ORDER"] || 0;

        // ---- SUPPLY RISK ----
        if (noMaterial >= 2) {
            signals.push({
                houseId,
                issue: "SUPPLY",
                strength: noMaterial >= 4 ? "HIGH" : "MEDIUM",
                evidence: `NO_MATERIAL occurred ${noMaterial} times recently`,
            });
        }

        // ---- QUALITY RISK ----
        if (threadBreak >= 2) {
            signals.push({
                houseId,
                issue: "QUALITY",
                strength: threadBreak >= 4 ? "HIGH" : "MEDIUM",
                evidence: `THREAD_BREAK occurred ${threadBreak} times recently`,
            });
        }

        // ---- PLANNING RISK ----
        if (noOrder >= 2) {
            signals.push({
                houseId,
                issue: "PLANNING",
                strength: noOrder >= 4 ? "HIGH" : "MEDIUM",
                evidence: `NO_ORDER occurred ${noOrder} times recently`,
            });
        }
    }

    return signals;
}
