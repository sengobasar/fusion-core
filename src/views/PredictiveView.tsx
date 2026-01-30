import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import {
    buildPredictiveSignals,
    type PredictiveSignal,
} from "../utils/predictiveSignals";

/* ================= VIEW ================= */

export default function PredictiveView() {
    const [signals, setSignals] = useState<PredictiveSignal[]>([]);

    useEffect(() => {
        loadPredictiveInsights();
    }, []);

    async function loadPredictiveInsights() {
        const db = await dbPromise;

        // Read alerts (already structured signals of issues)
        const alerts = await db.getAll("alerts");

        // Build issue frequency per house
        const issueCountsByHouse: Record<string, Record<string, number>> = {};

        for (const a of alerts) {
            if (!issueCountsByHouse[a.house_id]) {
                issueCountsByHouse[a.house_id] = {};
            }
            issueCountsByHouse[a.house_id][a.issue] =
                (issueCountsByHouse[a.house_id][a.issue] || 0) + 1;
        }

        const predictiveSignals = buildPredictiveSignals(issueCountsByHouse);
        setSignals(predictiveSignals);
    }

    /* ================= RENDER ================= */

    return (
        <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
            <h2>Predictive Insights</h2>

            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                Early warnings based on recent patterns. These are not predictions,
                but risk signals to help proactive decision-making.
            </p>

            {signals.length === 0 && (
                <p style={{ opacity: 0.6, marginTop: "16px" }}>
                    No emerging risks detected at the moment.
                </p>
            )}

            <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
                {signals.map((s, i) => (
                    <div
                        key={i}
                        className="card"
                        style={{
                            padding: "16px",
                            borderLeft: `6px solid ${s.strength === "HIGH"
                                ? "#ef4444"
                                : s.strength === "MEDIUM"
                                    ? "#f59e0b"
                                    : "#94a3b8"
                                }`,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>
                                {s.houseId} — {s.issue} risk
                            </strong>

                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color:
                                        s.strength === "HIGH"
                                            ? "#ef4444"
                                            : s.strength === "MEDIUM"
                                                ? "#f59e0b"
                                                : "#64748b",
                                }}
                            >
                                {s.strength}
                            </span>
                        </div>

                        <div style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                            {s.evidence}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
