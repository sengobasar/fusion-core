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

    /* ================= DERIVED DATA ================= */
    const signalsByHouse: Record<string, PredictiveSignal[]> = {};
    for (const signal of signals) {
        if (!signalsByHouse[signal.houseId]) {
            signalsByHouse[signal.houseId] = [];
        }
        signalsByHouse[signal.houseId].push(signal);
    }

    const highRiskCount = signals.filter(s => s.strength === "HIGH").length;
    const mediumRiskCount = signals.filter(s => s.strength === "MEDIUM").length;
    const lowRiskCount = signals.filter(s => s.strength === "LOW").length;

    /* ================= RENDER ================= */

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#0f172a",
            padding: "32px"
        }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

                {/* HEADER */}
                <div style={{ marginBottom: "32px" }}>
                    <h1 style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "white",
                        margin: 0,
                        marginBottom: "8px",
                        letterSpacing: "0.5px"
                    }}>
                        Early Warning System
                    </h1>
                    <p style={{
                        color: "#94a3b8",
                        margin: 0,
                        fontSize: "0.95rem"
                    }}>
                        Risk signals based on recent patterns. These are not predictions, but indicators to support proactive decision-making.
                    </p>
                </div>

                {/* SUMMARY STRIP */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    marginBottom: "32px"
                }}>
                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            High Priority Watch
                        </div>
                        <div style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#ef4444"
                        }}>
                            {highRiskCount}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Monitor Closely
                        </div>
                        <div style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#f59e0b"
                        }}>
                            {mediumRiskCount}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Low Concern
                        </div>
                        <div style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#64748b"
                        }}>
                            {lowRiskCount}
                        </div>
                    </div>
                </div>

                {/* HORIZONTAL LINE SEPARATOR */}
                <div style={{
                    height: "1px",
                    backgroundColor: "#334155",
                    marginBottom: "32px"
                }} />

                {/* EMPTY STATE */}
                {signals.length === 0 && (
                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "60px 32px",
                        borderRadius: "8px",
                        textAlign: "center",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "2.5rem",
                            marginBottom: "16px"
                        }}>
                            ✓
                        </div>
                        <p style={{
                            color: "#64748b",
                            fontSize: "1.1rem",
                            margin: 0
                        }}>
                            No emerging risks detected at the moment
                        </p>
                    </div>
                )}

                {/* SIGNALS GROUPED BY HOUSE */}
                {Object.keys(signalsByHouse).length > 0 && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "32px"
                    }}>
                        {Object.entries(signalsByHouse).map(([houseId, houseSignals]) => (
                            <div key={houseId}>
                                {/* HOUSE HEADER */}
                                <div style={{
                                    marginBottom: "16px",
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid #334155"
                                }}>
                                    <h2 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        color: "white",
                                        margin: 0,
                                        letterSpacing: "0.5px"
                                    }}>
                                        Area: {houseId}
                                    </h2>
                                    <div style={{
                                        fontSize: "0.85rem",
                                        color: "#64748b",
                                        marginTop: "4px"
                                    }}>
                                        {houseSignals.length} risk signal{houseSignals.length !== 1 ? 's' : ''} detected
                                    </div>
                                </div>

                                {/* SIGNALS FOR THIS HOUSE */}
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px"
                                }}>
                                    {houseSignals.map((signal, idx) => {
                                        const isHigh = signal.strength === "HIGH";
                                        const isMedium = signal.strength === "MEDIUM";


                                        const borderColor = isHigh ? "#ef4444" : isMedium ? "#f59e0b" : "#64748b";
                                        const bgColor = isHigh ? "#7f1d1d" : isMedium ? "#78350f" : "#1e293b";
                                        const textColor = isHigh ? "#fecaca" : isMedium ? "#fde68a" : "#94a3b8";
                                        const labelText = isHigh ? "HIGH PRIORITY" : isMedium ? "MONITOR" : "WATCH";

                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    backgroundColor: "#1e293b",
                                                    border: `1px solid ${borderColor}`,
                                                    borderRadius: "8px",
                                                    padding: "20px",
                                                    paddingLeft: "24px",
                                                    borderLeft: `6px solid ${borderColor}`
                                                }}
                                            >
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    marginBottom: "12px"
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        {/* RISK BADGE */}
                                                        <div style={{
                                                            display: "inline-block",
                                                            padding: "4px 12px",
                                                            borderRadius: "4px",
                                                            backgroundColor: bgColor,
                                                            color: textColor,
                                                            fontSize: "0.7rem",
                                                            fontWeight: 700,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "1px",
                                                            marginBottom: "12px"
                                                        }}>
                                                            {labelText}
                                                        </div>

                                                        {/* TITLE */}
                                                        <h3 style={{
                                                            margin: 0,
                                                            fontSize: "1.25rem",
                                                            fontWeight: 700,
                                                            color: "white",
                                                            marginBottom: "8px"
                                                        }}>
                                                            Potential Risk: {signal.issue}
                                                        </h3>

                                                        {/* EVIDENCE */}
                                                        <div style={{
                                                            fontSize: "0.9rem",
                                                            color: "#cbd5e1",
                                                            lineHeight: 1.6
                                                        }}>
                                                            {signal.evidence}
                                                        </div>
                                                    </div>

                                                    {/* CONFIDENCE INDICATOR */}
                                                    <div style={{
                                                        padding: "8px 16px",
                                                        borderRadius: "6px",
                                                        backgroundColor: "#0f172a",
                                                        border: `1px solid ${borderColor}`,
                                                        marginLeft: "20px"
                                                    }}>
                                                        <div style={{
                                                            fontSize: "0.7rem",
                                                            color: "#64748b",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "1px",
                                                            marginBottom: "4px"
                                                        }}>
                                                            Signal
                                                        </div>
                                                        <div style={{
                                                            fontSize: "1rem",
                                                            fontWeight: 700,
                                                            color: textColor
                                                        }}>
                                                            {signal.strength}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* DISCLAIMER FOOTER */}
                <div style={{
                    marginTop: "40px",
                    padding: "20px",
                    backgroundColor: "#422006",
                    border: "1px solid #78350f",
                    borderRadius: "8px"
                }}>
                    <p style={{
                        fontSize: "0.8rem",
                        color: "#fde68a",
                        margin: 0,
                        fontWeight: 500
                    }}>
                        ⚠ Advisory: These signals are derived from recent incident patterns and are intended as early warnings only. They do not constitute predictions or guarantees of future events.
                    </p>
                </div>
            </div>
        </div>
    );
}