// Layer 3 — Signal definition
// Pure structure. No logic. No UI.

export type SignalType =
    | "SUPPLY_RISK"
    | "QUALITY_RISK"
    | "PLANNING_RISK";

export type SignalSeverity =
    | "LOW"
    | "MEDIUM"
    | "HIGH";

export type Signal = {
    houseId: string;
    type: SignalType;
    severity: SignalSeverity;
    durationMinutes: number;
    reason: string;
};
