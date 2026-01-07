import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";

type EventRecord = {
  event_id: string;
  house_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
};

export default function SupervisorView() {
  const [events, setEvents] = useState<EventRecord[]>([]);

  useEffect(() => {
    async function loadEvents() {
      const db = await dbPromise;
      const allEvents = await db.getAll("events");
      setEvents(allEvents);
    }

    loadEvents();
  }, []);

  return (
    <div>
      <h2>Supervisor Panel</h2>

      {events.length === 0 && <p>No events yet.</p>}

      {events.map((e) => (
        <div
          key={e.event_id}
          style={{
            padding: "8px",
            borderBottom: "1px solid #ccc",
          }}
        >
          <strong>{e.house_id}</strong> → {e.event_type} →{" "}
          <small>{e.timestamp}</small>
        </div>
      ))}
    </div>
  );
}
