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
  const [grouped, setGrouped] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadEvents() {
      const db = await dbPromise;
      const allEvents: EventRecord[] = await db.getAll("events");

      setEvents(allEvents);

      // semantic layers
      const windows = pairEvents(allEvents);
      const groupedResult = groupWindows(windows);

      setGrouped(groupedResult);
    }

    loadEvents();
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <h2>Supervisor Panel</h2>

      {/* RAW EVENT LOG (unchanged) */}
      <h3>Event Log</h3>
      {events.length === 0 && <p>No events yet.</p>}
      {events.map((e) => (
        <div
          key={e.event_id}
          style={{
            padding: "6px 0",
            borderBottom: "1px solid #ccc",
          }}
        >
          <strong>{e.house_id}</strong> → {e.event_type} →{" "}
          <small>{e.timestamp}</small>
        </div>
      ))}

      {/* GROUPED DOWNTIME */}
      <h3 style={{ marginTop: "24px" }}>Downtime Summary</h3>

      {Object.keys(grouped).length === 0 && (
        <p>No completed downtime windows yet.</p>
      )}

      {Object.entries(grouped).map(([type, minutes]) => (
        <div key={type}>
          <strong>{type}</strong> → {minutes} min
        </div>
      ))}
    </div>
  );
}
