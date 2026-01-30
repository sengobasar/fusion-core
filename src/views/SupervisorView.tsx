import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dbPromise } from "../db/db";
import { pairEvents } from "../utils/pairEvents";
import { groupWindows } from "../utils/groupWindows";
import { checkThresholds } from "../utils/checkThresholds";
import { checkOpenWindows } from "../utils/checkOpenWindows";

import HouseCard from "../components/HouseCard";
import { ISSUE_TO_ERP_LOSS } from "../erp/erpMapping";
import { DAILY_AVAILABLE_MINUTES } from "../config/capacity";

/* ================= TYPES ================= */

type EventRecord = {
  event_id: string;
  house_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
};

/* ================= VIEW ================= */

export default function SupervisorView() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [houseStats, setHouseStats] = useState<Record<string, any>>({});
  const [houseCardsData, setHouseCardsData] = useState<any[]>([]);
  const [openAlertCount, setOpenAlertCount] = useState(0);

  const [summary, setSummary] = useState({
    totalHouses: 0,
    activeInteractions: 0,
    longestInterruption: 0,
    mostFrequentIssue: "None",
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    const db = await dbPromise;
    const allEvents: EventRecord[] = await db.getAll("events");
    const allHouses = await db.getAll("houses");

    allEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const eventsByHouse: Record<string, EventRecord[]> = {};
    for (const e of allEvents) {
      if (!eventsByHouse[e.house_id]) eventsByHouse[e.house_id] = [];
      eventsByHouse[e.house_id].push(e);
    }

    const houseDowntime: Record<string, Record<string, number>> = {};
    const issueCounts: Record<string, number> = {};
    let maxDuration = 0;
    let currentlyInterruptedCount = 0;
    const cards: any[] = [];

    for (const house of allHouses) {
      const houseEvents = eventsByHouse[house.house_id] || [];

      const isInterrupted =
        houseEvents.length > 0 && houseEvents[0].event_type !== "RESUME";

      let status: "RUNNING" | "INTERRUPTED" | "INACTIVE" = "RUNNING";
      if (!house.active) status = "INACTIVE";
      else if (isInterrupted) status = "INTERRUPTED";

      if (house.active && isInterrupted) currentlyInterruptedCount++;

      const windows = pairEvents(houseEvents);
      const grouped = groupWindows(windows);
      houseDowntime[house.house_id] = grouped;

      /* ===== LAYER 3 ALERT GENERATION ===== */

      const thresholdAlerts = checkThresholds(house.house_id, windows);
      const openAlerts = checkOpenWindows(house.house_id, houseEvents);
      const allAlerts = [...thresholdAlerts, ...openAlerts];

      for (const alert of allAlerts) {
        const alertId = `${house.house_id}-${alert.type}-${alert.durationMinutes}`;

        const existing = await db.get("alerts", alertId);
        if (existing) continue;

        await db.put("alerts", {
          alert_id: alertId,
          house_id: alert.house_id,
          issue: alert.type,
          severity: alert.durationMinutes >= 5 ? "CRITICAL" : "WARNING",
          status: "OPEN",
          durationMinutes: alert.durationMinutes,
          startedAt: new Date().toISOString(),
        });
      }

      /* ===== END ALERT GENERATION ===== */

      for (const w of windows) {
        issueCounts[w.type] = (issueCounts[w.type] || 0) + 1;
        maxDuration = Math.max(maxDuration, w.durationMinutes);
      }

      const idleMinutes = Object.values(grouped).reduce(
        (a: number, b: number) => a + b,
        0
      );

      const workedMinutes = Math.max(
        0,
        DAILY_AVAILABLE_MINUTES - idleMinutes
      );

      const dominantIssue =
        Object.entries(grouped).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];

      cards.push({
        houseId: house.cost_center || house.house_id,
        cluster: house.ward || house.cluster_id,
        active: house.active,
        status,
        idleMinutes,
        workedMinutes,
        dominantIssue:
          dominantIssue ? ISSUE_TO_ERP_LOSS[dominantIssue] : "None",
      });
    }

    /* ===== OPEN ALERT COUNT FOR SUPERVISOR ===== */
    const allAlerts = await db.getAll("alerts");
    const openAlerts = allAlerts.filter(a => a.status === "OPEN");
    setOpenAlertCount(openAlerts.length);

    let topIssue = "None";
    let topCount = 0;
    for (const [issue, count] of Object.entries(issueCounts)) {
      if (count > topCount) {
        topCount = count;
        topIssue = issue;
      }
    }

    setSummary({
      totalHouses: allHouses.filter((h: any) => h.active).length,
      activeInteractions: currentlyInterruptedCount,
      longestInterruption: maxDuration,
      mostFrequentIssue: ISSUE_TO_ERP_LOSS[topIssue] ?? topIssue,
    });

    setHouseStats(houseDowntime);
    setHouseCardsData(cards);
    setEvents(allEvents);
  }

  /* ================= RENDER ================= */

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#1e293b",
      padding: "32px"
    }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>

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
            Production Control Tower
          </h1>
          <p style={{
            color: "#94a3b8",
            margin: 0,
            fontSize: "0.95rem"
          }}>
            Real-time system overview and operational status
          </p>
        </div>

        {/* ALERT BANNER */}
        {openAlertCount > 0 && (
          <div
            onClick={() => navigate("/alerts")}
            style={{
              marginBottom: "32px",
              padding: "20px 24px",
              borderRadius: "8px",
              backgroundColor: "#7f1d1d",
              border: "2px solid #ef4444",
              color: "#fecaca",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠</span>
              <span style={{ fontSize: "1.05rem" }}>
                {openAlertCount} Open Alert{openAlertCount > 1 ? "s" : ""} require immediate attention
              </span>
            </div>
            <span style={{
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontWeight: 700
            }}>
              View Alerts →
            </span>
          </div>
        )}

        {/* SYSTEM HEALTH SUMMARY */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "40px"
        }}>
          <div style={{
            backgroundColor: "#0f172a",
            padding: "28px",
            borderRadius: "8px",
            border: "1px solid #334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
              marginBottom: "12px"
            }}>
              Active Houses
            </div>
            <div style={{
              fontSize: "3rem",
              fontWeight: 700,
              color: "white",
              lineHeight: 1
            }}>
              {summary.totalHouses}
            </div>
          </div>

          <div style={{
            backgroundColor: "#0f172a",
            padding: "28px",
            borderRadius: "8px",
            border: `2px solid ${summary.activeInteractions > 0 ? "#ef4444" : "#16a34a"}`,
            boxShadow: summary.activeInteractions > 0
              ? "0 2px 12px rgba(239, 68, 68, 0.3)"
              : "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
              marginBottom: "12px"
            }}>
              Currently Interrupted
            </div>
            <div style={{
              fontSize: "3rem",
              fontWeight: 700,
              color: summary.activeInteractions > 0 ? "#ef4444" : "#22c55e",
              lineHeight: 1
            }}>
              {summary.activeInteractions}
            </div>
          </div>

          <div style={{
            backgroundColor: "#0f172a",
            padding: "28px",
            borderRadius: "8px",
            border: "1px solid #334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
              marginBottom: "12px"
            }}>
              Longest Interruption
            </div>
            <div style={{
              fontSize: "3rem",
              fontWeight: 700,
              color: summary.longestInterruption > 10 ? "#f59e0b" : "white",
              lineHeight: 1
            }}>
              {summary.longestInterruption}
              <span style={{ fontSize: "1.25rem", color: "#64748b", marginLeft: "6px" }}>min</span>
            </div>
          </div>

          <div style={{
            backgroundColor: "#0f172a",
            padding: "28px",
            borderRadius: "8px",
            border: "1px solid #334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
              marginBottom: "12px"
            }}>
              Most Frequent Issue
            </div>
            <div style={{
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "white",
              lineHeight: 1.3
            }}>
              {summary.mostFrequentIssue}
            </div>
          </div>
        </div>

        {/* HOUSE STATUS GRID */}
        <section style={{ marginBottom: "40px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #334155"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "white",
              margin: 0,
              letterSpacing: "0.5px"
            }}>
              Machine Status
            </h2>
            <span style={{
              fontSize: "0.85rem",
              color: "#64748b",
              fontWeight: 500
            }}>
              {houseCardsData.length} total units
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px"
          }}>
            {houseCardsData.map(h => (
              <HouseCard key={h.houseId} {...h} />
            ))}
          </div>
        </section>

        {/* DOWNTIME ANALYSIS */}
        <section style={{ marginBottom: "40px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #334155"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "white",
              margin: 0,
              letterSpacing: "0.5px"
            }}>
              Downtime Analysis (Today)
            </h2>
          </div>
          <div style={{
            backgroundColor: "#0f172a",
            padding: "28px",
            borderRadius: "8px",
            border: "1px solid #334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            {Object.entries(houseStats).length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#64748b"
              }}>
                No downtime data available
              </div>
            )}
            {Object.entries(houseStats).map(([hid, stats]: [string, any], idx) => {
              const total = (Object.values(stats) as number[]).reduce(
                (a: number, b: number) => a + b,
                0
              );

              return (
                <div
                  key={hid}
                  style={{
                    marginBottom: idx < Object.entries(houseStats).length - 1 ? "24px" : "0",
                    paddingBottom: idx < Object.entries(houseStats).length - 1 ? "24px" : "0",
                    borderBottom: idx < Object.entries(houseStats).length - 1 ? "1px solid #334155" : "none"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px"
                  }}>
                    <span style={{
                      fontWeight: 700,
                      color: "white",
                      fontSize: "1rem",
                      letterSpacing: "0.5px"
                    }}>
                      {hid}
                    </span>
                    <span style={{
                      color: "#94a3b8",
                      fontSize: "0.95rem",
                      fontWeight: 600
                    }}>
                      {total} min total
                    </span>
                  </div>
                  <div style={{
                    height: "28px",
                    backgroundColor: "#1e293b",
                    borderRadius: "6px",
                    overflow: "hidden",
                    display: "flex",
                    border: "1px solid #334155"
                  }}>
                    {Object.entries(stats).map(([type, mins]: [string, any]) => {
                      const width = Math.max(2, ((mins as number) / (total || 1)) * 100);
                      let color = "#64748b";
                      if (type === "NO_MATERIAL") color = "#ef4444";
                      if (type === "THREAD_BREAK") color = "#f59e0b";
                      if (type === "NO_ORDER") color = "#f97316";

                      return (
                        <div
                          key={type}
                          style={{
                            width: `${width}%`,
                            backgroundColor: color,
                            transition: "all 0.3s",
                            position: "relative"
                          }}
                          title={`${type}: ${mins} min`}
                        />
                      );
                    })}
                  </div>
                  {/* Legend for this house */}
                  <div style={{
                    display: "flex",
                    gap: "16px",
                    marginTop: "12px",
                    flexWrap: "wrap"
                  }}>
                    {Object.entries(stats).map(([type, mins]: [string, any]) => {
                      let color = "#64748b";
                      if (type === "NO_MATERIAL") color = "#ef4444";
                      if (type === "THREAD_BREAK") color = "#f59e0b";
                      if (type === "NO_ORDER") color = "#f97316";

                      return (
                        <div key={type} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.8rem"
                        }}>
                          <div style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: color,
                            borderRadius: "2px"
                          }} />
                          <span style={{ color: "#cbd5e1", fontWeight: 500 }}>
                            {ISSUE_TO_ERP_LOSS[type] || type}: {mins}min
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RECENT EVENT LOG */}
        <section>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #334155"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "white",
              margin: 0,
              letterSpacing: "0.5px"
            }}>
              Recent Activity
            </h2>
            <span style={{
              fontSize: "0.85rem",
              color: "#64748b",
              fontWeight: 500
            }}>
              Last 50 events
            </span>
          </div>
          <div style={{
            backgroundColor: "#0f172a",
            borderRadius: "8px",
            border: "1px solid #334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            maxHeight: "450px",
            overflowY: "auto"
          }}>
            <table style={{
              width: "100%",
              fontSize: "0.9rem",
              borderCollapse: "collapse"
            }}>
              <thead style={{
                backgroundColor: "#020617",
                position: "sticky",
                top: 0,
                zIndex: 1
              }}>
                <tr>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    borderBottom: "1px solid #334155"
                  }}>
                    Time
                  </th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    borderBottom: "1px solid #334155"
                  }}>
                    Machine
                  </th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    borderBottom: "1px solid #334155"
                  }}>
                    Event
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((e, idx) => (
                  <tr key={e.event_id} style={{
                    backgroundColor: idx % 2 === 0 ? "#0f172a" : "#1e293b",
                    transition: "background-color 0.15s"
                  }}>
                    <td style={{
                      padding: "14px 20px",
                      color: "#94a3b8",
                      borderBottom: "1px solid #334155",
                      fontSize: "0.85rem"
                    }}>
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{
                      padding: "14px 20px",
                      color: "white",
                      fontWeight: 600,
                      borderBottom: "1px solid #334155"
                    }}>
                      {e.house_id}
                    </td>
                    <td style={{
                      padding: "14px 20px",
                      color: "#cbd5e1",
                      borderBottom: "1px solid #334155"
                    }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        backgroundColor: e.event_type === "RESUME" ? "#166534" : "#7f1d1d",
                        color: e.event_type === "RESUME" ? "#bbf7d0" : "#fecaca",
                        fontWeight: 600
                      }}>
                        {e.event_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}