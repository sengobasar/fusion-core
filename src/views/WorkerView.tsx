import { dbPromise } from "../db/db";

const EVENT_TYPES = [
  "THREAD_BREAK",
  "NO_MATERIAL",
  "NO_ORDER",
  "RESUME",
];

export default function WorkerView() {
  async function logEvent(eventType: string) {
    const db = await dbPromise;

    await db.put("events", {
      event_id: crypto.randomUUID(),
      house_id: "H-12",
      order_id: "ORD-001",
      event_type: eventType,
      timestamp: new Date().toISOString(),
      source: "PWA",
    });

    console.log("Event logged:", eventType);
  }

  return (
    <div>
      <h2>Worker Panel</h2>

      {EVENT_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => logEvent(type)}
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            marginBottom: "12px",
            fontSize: "16px",
          }}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
