// Layer 4 — Action definition
// Advisory only. No execution. No automation.

export type ActionPriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH";

export type Action = {
    id: string;
    signalType: "SUPPLY_RISK" | "QUALITY_RISK" | "PLANNING_RISK";
    houseId: string;
    priority: ActionPriority;
    title: string;
    description: string;
    reason: string;
    advisory: true;
};
