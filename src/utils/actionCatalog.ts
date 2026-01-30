// Layer 4 — Static advisory action catalog
// Templates only. No logic. No execution.

import type { Action } from "../types/action";

export const ACTION_CATALOG: Record<
    Action["signalType"],
    Omit<Action, "id" | "houseId" | "priority" | "reason">[]
> = {
    SUPPLY_RISK: [
        {
            signalType: "SUPPLY_RISK",
            title: "Pre-position material before shift",
            description: "Ensure required material is staged and available before production begins.",
            advisory: true,
        },
        {
            signalType: "SUPPLY_RISK",
            title: "Verify supplier availability",
            description: "Confirm yarn or raw material availability with the supplier.",
            advisory: true,
        },
    ],

    QUALITY_RISK: [
        {
            signalType: "QUALITY_RISK",
            title: "Inspect loom tension",
            description: "Check loom tension settings to prevent recurring thread breaks.",
            advisory: true,
        },
        {
            signalType: "QUALITY_RISK",
            title: "Review yarn quality batch",
            description: "Inspect the yarn batch for defects or inconsistencies.",
            advisory: true,
        },
    ],

    PLANNING_RISK: [
        {
            signalType: "PLANNING_RISK",
            title: "Release smaller batch orders",
            description: "Break down large orders into smaller batches to reduce idle time.",
            advisory: true,
        },
        {
            signalType: "PLANNING_RISK",
            title: "Align job card before shift",
            description: "Ensure job cards and work instructions are ready before the shift starts.",
            advisory: true,
        },
    ],
};
