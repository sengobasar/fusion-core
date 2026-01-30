import { useEffect, useState } from "react";
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
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [houseStats, setHouseStats] = useState<Record<string, any>>({});
  const [houseCardsData, setHouseCardsData] = useState<any[]>([]);

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

      /* ===== ADDITION: LAYER 3 ALERT GENERATION ===== */

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

      /* ===== END ADDITION ===== */

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
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Production Overview</h2>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <MetricCard label="Active Houses" value={summary.totalHouses} />
        <MetricCard label="Currently Interrupted" value={summary.activeInteractions} />
        <MetricCard label="Longest Interruption" value={`${summary.longestInterruption} min`} />
        <MetricCard label="Most Frequent Issue" value={summary.mostFrequentIssue} />
      </section>

      <h3>House Status</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        {houseCardsData.map(h => (
          <HouseCard key={h.houseId} {...h} />
        ))}
      </div>

      <section style={{ marginTop: "32px" }}>
        <h3>Downtime Analysis (Today)</h3>
        <div className="card" style={{ padding: "16px" }}>
          {Object.entries(houseStats).map(([hid, stats]: [string, any]) => {
            const total = (Object.values(stats) as number[]).reduce(
              (a: number, b: number) => a + b,
              0
            );

            return (
              <div key={hid} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{hid}</strong>
                  <span>{total} min total</span>
                </div>
                <div
                  style={{
                    height: "20px",
                    background: "#f1f5f9",
                    borderRadius: "4px",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  {Object.entries(stats).map(([type, mins]: [string, any]) => {
                    const width = Math.max(
                      2,
                      ((mins as number) / (total || 1)) * 100
                    );
                    let color = "#94a3b8";
                    if (type === "NO_MATERIAL") color = "#ef4444";
                    if (type === "THREAD_BREAK") color = "#f59e0b";
                    if (type === "NO_ORDER") color = "#f97316";

                    return (
                      <div
                        key={type}
                        style={{ width: `${width}%`, background: color }}
                        title={`${type}: ${mins} min`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: "32px" }}>
        <h3>Recent Event Log</h3>
        <div className="card" style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table style={{ width: "100%", fontSize: "0.875rem" }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>House</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map((e) => (
                <tr key={e.event_id}>
                  <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td>{e.house_id}</td>
                  <td>{e.event_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <div className="text-sm" style={{ opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
