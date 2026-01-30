// Layer 4 — Build advisory actions from signals
// Pure translator. No side effects. No execution.

import type { Signal } from "../types/signal";
import type { Action } from "../types/action";
import { ACTION_CATALOG } from "./actionCatalog";

/*
  Build actions from signals
*/
export function buildActions(signals: Signal[]): Action[] {
    const actions: Action[] = [];

    for (const signal of signals) {
        const templates = ACTION_CATALOG[signal.type] ?? [];

        for (const template of templates) {
            actions.push({
                id: crypto.randomUUID(),          // local-only identifier
                signalType: signal.type,
                houseId: signal.houseId,
                priority: signal.severity,        // direct mapping
                title: template.title,
                description: template.description,
                reason: signal.reason,
                advisory: true,
            });
        }
    }

    return actions;
}
