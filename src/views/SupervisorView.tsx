import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { pairEvents } from "../utils/pairEvents";
import { groupWindows } from "../utils/groupWindows";

type EventRecord = {
  event_id: string;
  house_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
};

export default function SupervisorView() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [downtimeByHouse, setDowntimeByHouse] = useState<
    Record<string, Record<string, number>>
  >({});

  useEffect(() => {
    async function loadEvents() {
      const db = await dbPromise;
      const allEvents: EventRecord[] = await db.getAll("events");

      setEvents(allEvents);

      // 🔹 GROUP EVENTS BY HOUSE (CRITICAL FIX)
      const eventsByHouse: Record<string, EventRecord[]> = {};

      for (const e of allEvents) {
        const hid = e.house_id.toUpperCase();
        if (!eventsByHouse[hid]) eventsByHouse[hid] = [];
        eventsByHouse[hid].push(e);
      }

      // 🔹 COMPUTE DOWNTIME PER HOUSE
      const result: Record<string, Record<string, number>> = {};

      for (const houseId in eventsByHouse) {
        const windows = pairEvents(eventsByHouse[houseId]);
        const grouped = groupWindows(windows);
        result[houseId] = grouped;
      }

      setDowntimeByHouse(result);
    }

    loadEvents();
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <h2>Supervisor Panel</h2>

      {/* RAW EVENT LOG */}
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

      {/* PER-HOUSE DOWNTIME */}
      <h3 style={{ marginTop: "24px" }}>Downtime Summary (Per House)</h3>

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
    </div>
  );
}
