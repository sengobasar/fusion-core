import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { pairEvents } from "../utils/pairEvents";
import { groupWindows } from "../utils/groupWindows";
import {
    buildImpactComparison,
    IMPACT_DISCLAIMER,
} from "../utils/impactFormula";
import { DAILY_AVAILABLE_MINUTES } from "../config/capacity";

/* ================= TYPES ================= */

type EventRecord = {
    event_id: string;
    house_id: string;
    event_type: string;
    timestamp: string;
};

/* ================= VIEW ================= */

export default function ImpactView() {
    const [impact, setImpact] = useState<any>(null);
    const [totalDowntime, setTotalDowntime] = useState(0);

    useEffect(() => {
        loadImpact();
    }, []);

    async function loadImpact() {
        const db = await dbPromise;
        const events: EventRecord[] = await db.getAll("events");

        const eventsByHouse: Record<string, EventRecord[]> = {};
        for (const e of events) {
            if (!eventsByHouse[e.house_id]) eventsByHouse[e.house_id] = [];
            eventsByHouse[e.house_id].push(e);
        }

        let totalLostMinutes = 0;

        for (const houseId of Object.keys(eventsByHouse)) {
            const windows = pairEvents(eventsByHouse[houseId]);
            const grouped = groupWindows(windows);
            totalLostMinutes += Object.values(grouped).reduce(
                (a: number, b: number) => a + b,
                0
            );
        }

        setTotalDowntime(totalLostMinutes);

        const comparison = buildImpactComparison(
            totalLostMinutes,
            DAILY_AVAILABLE_MINUTES
        );

        setImpact(comparison);
    }

    /* ================= RENDER ================= */

    return (
        <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
            <h2>Operational Impact</h2>

            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                {IMPACT_DISCLAIMER}
            </p>

            {!impact && <p>Loading impact analysis...</p>}

            {impact && (
                <div
                    className="card"
                    style={{
                        marginTop: "24px",
                        padding: "24px",
                        display: "grid",
                        gap: "20px",
                    }}
                >
                    {/* ===== KEY METRICS ===== */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                        }}
                    >
                        <Metric
                            label="Total Downtime (Today)"
                            value={`${totalDowntime} min`}
                        />
                        <Metric
                            label="Mandays Lost (Today)"
                            value={impact.after.mandaysLost.toFixed(2)}
                        />
                    </div>

                    <hr />

                    {/* ===== VISUAL COMPARISON ===== */}
                    <div>
                        <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                            Downtime Comparison
                        </div>

                        <Bar
                            label="Before FloorSight"
                            value={impact.before.lostMinutes}
                            max={impact.before.lostMinutes}
                            color="#94a3b8"
                        />

                        <Bar
                            label="After FloorSight"
                            value={impact.after.lostMinutes}
                            max={impact.before.lostMinutes}
                            color="#22c55e"
                        />
                    </div>

                    <hr />

                    {/* ===== SUMMARY ===== */}
                    <Metric
                        label="Improvement"
                        value={`${impact.improvementMinutes} min (${impact.improvementMandays.toFixed(
                            2
                        )} mandays)`}
                    />

                    <Metric
                        label="Trend"
                        value={
                            impact.direction === "UP"
                                ? "↑ Improving"
                                : impact.direction === "DOWN"
                                    ? "↓ Worsening"
                                    : "→ Stable"
                        }
                        highlight={impact.direction}
                    />

                    {/* ===== CONTEXT NOTE ===== */}
                    <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                        Baseline represents a fixed illustrative reference, not a measured
                        historical log.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ================= UI HELPERS ================= */

function Metric({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string;
    highlight?: "UP" | "DOWN" | "NEUTRAL";
}) {
    let color = "#0f172a";
    if (highlight === "UP") color = "#16a34a";
    if (highlight === "DOWN") color = "#dc2626";

    return (
        <div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color }}>
                {value}
            </div>
        </div>
    );
}

function Bar({
    label,
    value,
    max,
    color,
}: {
    label: string;
    value: number;
    max: number;
    color: string;
}) {
    const width = Math.max(2, (value / max) * 100);

    return (
        <div style={{ marginTop: "8px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                }}
            >
                <span>{label}</span>
                <span>{value} min</span>
            </div>

            <div
                style={{
                    height: "14px",
                    background: "#e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${width}%`,
                        height: "100%",
                        background: color,
                    }}
                />
            </div>
        </div>
    );
}
