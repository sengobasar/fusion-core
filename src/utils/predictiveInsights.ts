// Layer 6 — Predictive Insights (Human-readable)
// ----------------------------------------------
// Converts predictive signals into explainable text
// No scoring, no automation

import type { PredictiveSignal } from "./predictiveSignals";

export type PredictiveInsight = {
    houseId: string;
    message: string;
    confidence: "LOW" | "MEDIUM" | "HIGH";
};

export function buildPredictiveInsights(
    signals: PredictiveSignal[]
): PredictiveInsight[] {
    return signals.map((s) => {
        let message = "";

        if (s.type === "SUPPLY_RISK") {
            message = "Material delay likely in upcoming shift";
        }

        if (s.type === "QUALITY_RISK") {
            message = "Thread break risk likely to repeat";
        }

        if (s.type === "PLANNING_RISK") {
            message = "Order planning gaps may continue";
        }

        return {
            houseId: s.houseId,
            message: `${message} (${s.basis})`,
            confidence: s.likelihood,
        };
    });
}
