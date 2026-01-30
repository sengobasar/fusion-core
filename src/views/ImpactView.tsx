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
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#1e293b",
            padding: "40px"
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                {/* HEADER */}
                <div style={{ marginBottom: "40px" }}>
                    <h1 style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "white",
                        margin: 0,
                        marginBottom: "8px",
                        letterSpacing: "0.5px"
                    }}>
                        Operational Impact
                    </h1>
                    <p style={{
                        color: "#94a3b8",
                        margin: 0,
                        fontSize: "0.95rem"
                    }}>
                        {IMPACT_DISCLAIMER}
                    </p>
                </div>

                {!impact && (
                    <div style={{
                        backgroundColor: "#0f172a",
                        padding: "60px",
                        borderRadius: "12px",
                        textAlign: "center",
                        border: "1px solid #334155"
                    }}>
                        <p style={{
                            color: "#64748b",
                            fontSize: "1.1rem",
                            margin: 0
                        }}>
                            Loading impact analysis...
                        </p>
                    </div>
                )}

                {impact && (
                    <>
                        {/* KEY METRICS ROW */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "24px",
                            marginBottom: "40px"
                        }}>
                            <div style={{
                                backgroundColor: "#0f172a",
                                padding: "36px",
                                borderRadius: "12px",
                                border: "1px solid #334155",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                            }}>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "1.5px",
                                    fontWeight: 600,
                                    marginBottom: "16px"
                                }}>
                                    Total Downtime (Today)
                                </div>
                                <div style={{
                                    fontSize: "4rem",
                                    fontWeight: 700,
                                    color: "white",
                                    lineHeight: 1
                                }}>
                                    {totalDowntime}
                                    <span style={{
                                        fontSize: "2rem",
                                        color: "#64748b",
                                        marginLeft: "12px"
                                    }}>
                                        min
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: "#0f172a",
                                padding: "36px",
                                borderRadius: "12px",
                                border: "2px solid #ef4444",
                                boxShadow: "0 2px 12px rgba(239, 68, 68, 0.3)"
                            }}>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: "#ef4444",
                                    textTransform: "uppercase",
                                    letterSpacing: "1.5px",
                                    fontWeight: 600,
                                    marginBottom: "16px"
                                }}>
                                    Mandays Lost (Today)
                                </div>
                                <div style={{
                                    fontSize: "4rem",
                                    fontWeight: 700,
                                    color: "#ef4444",
                                    lineHeight: 1
                                }}>
                                    {impact.after.mandaysLost.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* COMPARISON SECTION */}
                        <div style={{
                            backgroundColor: "#0f172a",
                            padding: "40px",
                            borderRadius: "12px",
                            border: "1px solid #334155",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            marginBottom: "32px"
                        }}>
                            <div style={{
                                fontSize: "0.85rem",
                                color: "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "1.5px",
                                fontWeight: 600,
                                marginBottom: "40px"
                            }}>
                                Performance Comparison
                            </div>

                            {/* Before FloorSight */}
                            <div style={{ marginBottom: "40px" }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    marginBottom: "16px"
                                }}>
                                    <span style={{
                                        fontSize: "1rem",
                                        color: "#94a3b8",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>
                                        Before FloorSight
                                    </span>
                                    <span style={{
                                        fontSize: "2.25rem",
                                        fontWeight: 700,
                                        color: "#64748b"
                                    }}>
                                        {impact.before.lostMinutes}
                                        <span style={{ fontSize: "1.25rem", marginLeft: "6px" }}>min</span>
                                    </span>
                                </div>
                                <div style={{
                                    height: "32px",
                                    backgroundColor: "#1e293b",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    border: "1px solid #334155"
                                }}>
                                    <div style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "#64748b"
                                    }} />
                                </div>
                            </div>

                            {/* After FloorSight */}
                            <div>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    marginBottom: "16px"
                                }}>
                                    <span style={{
                                        fontSize: "1rem",
                                        color: "#94a3b8",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>
                                        After FloorSight
                                    </span>
                                    <span style={{
                                        fontSize: "2.25rem",
                                        fontWeight: 700,
                                        color: "#22c55e"
                                    }}>
                                        {impact.after.lostMinutes}
                                        <span style={{ fontSize: "1.25rem", marginLeft: "6px" }}>min</span>
                                    </span>
                                </div>
                                <div style={{
                                    height: "32px",
                                    backgroundColor: "#1e293b",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    border: "1px solid #334155"
                                }}>
                                    <div style={{
                                        width: `${Math.max(5, (impact.after.lostMinutes / impact.before.lostMinutes) * 100)}%`,
                                        height: "100%",
                                        backgroundColor: "#22c55e",
                                        boxShadow: "0 0 12px rgba(34, 197, 94, 0.4)"
                                    }} />
                                </div>
                            </div>

                            {/* Percentage Improvement */}
                            <div style={{
                                marginTop: "24px",
                                padding: "16px",
                                backgroundColor: "#166534",
                                borderRadius: "8px",
                                textAlign: "center"
                            }}>
                                <span style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    color: "#bbf7d0",
                                    letterSpacing: "0.5px"
                                }}>
                                    {(((impact.before.lostMinutes - impact.after.lostMinutes) / impact.before.lostMinutes) * 100).toFixed(1)}% Reduction in Downtime
                                </span>
                            </div>
                        </div>

                        {/* IMPROVEMENT METRICS */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "24px",
                            marginBottom: "40px"
                        }}>
                            <div style={{
                                backgroundColor: "#0f172a",
                                padding: "36px",
                                borderRadius: "12px",
                                border: "2px solid #22c55e",
                                boxShadow: "0 2px 12px rgba(34, 197, 94, 0.2)"
                            }}>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: "#22c55e",
                                    textTransform: "uppercase",
                                    letterSpacing: "1.5px",
                                    fontWeight: 600,
                                    marginBottom: "16px"
                                }}>
                                    Total Improvement
                                </div>
                                <div style={{
                                    fontSize: "3.5rem",
                                    fontWeight: 700,
                                    color: "#22c55e",
                                    lineHeight: 1,
                                    marginBottom: "12px"
                                }}>
                                    {impact.improvementMinutes}
                                    <span style={{ fontSize: "1.75rem", marginLeft: "8px" }}>min</span>
                                </div>
                                <div style={{
                                    fontSize: "1.1rem",
                                    color: "#cbd5e1",
                                    fontWeight: 600
                                }}>
                                    {impact.improvementMandays.toFixed(2)} mandays saved
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: "#0f172a",
                                padding: "36px",
                                borderRadius: "12px",
                                border: "1px solid #334155",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                            }}>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "1.5px",
                                    fontWeight: 600,
                                    marginBottom: "16px"
                                }}>
                                    Trend Direction
                                </div>
                                <div style={{
                                    fontSize: "3rem",
                                    fontWeight: 700,
                                    color: impact.direction === "UP" ? "#22c55e" : impact.direction === "DOWN" ? "#ef4444" : "#64748b",
                                    lineHeight: 1.2
                                }}>
                                    {impact.direction === "UP" ? "↑ Improving" : impact.direction === "DOWN" ? "↓ Worsening" : "→ Stable"}
                                </div>
                            </div>
                        </div>

                        {/* DISCLAIMER FOOTER */}
                        <div style={{
                            padding: "24px",
                            backgroundColor: "#422006",
                            border: "1px solid #78350f",
                            borderRadius: "8px"
                        }}>
                            <p style={{
                                fontSize: "0.85rem",
                                color: "#fde68a",
                                margin: 0,
                                fontWeight: 500,
                                lineHeight: 1.6
                            }}>
                                ⚠ Note: Baseline represents a fixed illustrative reference, not a measured historical log. These metrics are for operational visibility and should not be used for financial reporting.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}