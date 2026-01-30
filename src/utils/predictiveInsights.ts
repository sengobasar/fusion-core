// src/utils/predictiveInsights.ts

import type { PredictiveSignal } from "./predictiveSignals";

export type PredictiveInsight = {
    houseId: string;
    message: string;
    confidence: "LOW" | "MEDIUM" | "HIGH";
};

/*
  This layer converts predictive signals into
  human-readable early warnings.
  Still rule-based, explainable, non-automated.
*/

export function buildPredictiveInsights(
    signals: PredictiveSignal[]
): PredictiveInsight[] {
    return signals.map((signal) => {
        let message = "";

        switch (signal.issue) {
            case "SUPPLY":
                message =
                    "Supply interruptions may repeat in the next shift unless material availability is stabilized.";
                break;

            case "QUALITY":
                message =
                    "Quality-related stoppages may increase if loom setup or yarn quality is not reviewed.";
                break;

            case "PLANNING":
                message =
                    "Idle time due to order gaps may continue unless production planning is adjusted.";
                break;
        }

        return {
            houseId: signal.houseId,
            message,
            confidence: signal.strength,
        };
    });
}
