import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { pairEvents } from "../utils/pairEvents";
import { groupWindows } from "../utils/groupWindows";
import { checkThresholds } from "../utils/checkThresholds";
import { checkOpenWindows } from "../utils/checkOpenWindows";

type EventRecord = {
  event_id: string;
  house_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
};

type Alert = {
  house_id: string;
  type: string;
  reason: string;
  durationMinutes: number;
};

export default function SupervisorView() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [downtimeByHouse, setDowntimeByHouse] = useState<
    Record<string, Record<string, number>>
  >({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let interval: number;

    async function loadAndAnalyze() {
      const db = await dbPromise;
      const allEvents: EventRecord[] = await db.getAll("events");
      setEvents(allEvents);

      // 🔹 GROUP EVENTS BY HOUSE
      const eventsByHouse: Record<string, EventRecord[]> = {};

      for (const e of allEvents) {
        const hid = e.house_id.toUpperCase();
        if (!eventsByHouse[hid]) eventsByHouse[hid] = [];
        eventsByHouse[hid].push(e);
      }

      const downtimeResult: Record<string, Record<string, number>> = {};
      const alertResult: Alert[] = [];

      // 🔹 ANALYZE PER HOUSE
      for (const houseId in eventsByHouse) {
        const houseEvents = eventsByHouse[houseId];

        // Completed windows
        const windows = pairEvents(houseEvents);
        downtimeResult[houseId] = groupWindows(windows);

        // Completed-window alerts
        alertResult.push(
          ...checkThresholds(houseId, windows)
        );

        // 🔴 OPEN-WINDOW ALERTS (NO RESUME)
        alertResult.push(
          ...checkOpenWindows(houseId, houseEvents)
        );
      }

      setDowntimeByHouse(downtimeResult);
      setAlerts(alertResult);
    }

    // Initial load
    loadAndAnalyze();

    // 🔁 RECHECK EVERY MINUTE (CRITICAL FOR OPEN WINDOWS)
    interval = window.setInterval(loadAndAnalyze, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <h2>Supervisor Panel</h2>

      {/* ================= RAW EVENTS ================= */}
      <h3>Event Log</h3>
      {events.length === 0 && <p>No events yet.</p>}
      {events.map((e) => (
        <div
          key={e.event_id}
          style={{ padding: "6px 0", borderBottom: "1px solid #ccc" }}
        >
          <strong>{e.house_id}</strong> → {e.event_type} →{" "}
          <small>{e.timestamp}</small>
        </div>
      ))}

      {/* ================= DOWNTIME ================= */}
      <h3 style={{ marginTop: "24px" }}>
        Downtime Summary (Per House)
      </h3>

      {Object.keys(downtimeByHouse).length === 0 && (
        <p>No completed downtime windows yet.</p>
      )}

      {Object.entries(downtimeByHouse).map(([houseId, summary]) => (
        <div key={houseId} style={{ marginBottom: "16px" }}>
          <strong>{houseId}</strong>

          {Object.keys(summary).length === 0 && (
            <div style={{ marginLeft: "12px" }}>
              No completed downtime yet.
            </div>
          )}

          {Object.entries(summary).map(([type, minutes]) => (
            <div key={type} style={{ marginLeft: "12px" }}>
              {type} → {minutes} min
            </div>
          ))}
        </div>
      ))}

      {/* ================= ALERTS ================= */}
      <h3 style={{ marginTop: "24px" }}>Alerts</h3>

      {alerts.length === 0 && (
        <p>No alerts detected.</p>
      )}

      {alerts.map((a, idx) => (
        <div
          key={idx}
          style={{
            padding: "8px",
            marginBottom: "8px",
            border: "1px solid #f5c2c2",
            background: "#fff5f5",
          }}
        >
          <strong>{a.house_id}</strong> → {a.type}
          <br />
          {a.reason} ({a.durationMinutes} min)
        </div>
      ))}
    </div>
  );
}
