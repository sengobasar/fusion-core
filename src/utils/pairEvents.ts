type EventRecord = {
  event_type: string;
  timestamp: string;
};

type TimeWindow = {
  type: string;
  start: string;
  end: string;
  durationMinutes: number;
};

export function pairEvents(events: EventRecord[]): TimeWindow[] {
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const windows: TimeWindow[] = [];
  let openEvent: EventRecord | null = null;

  for (const event of sorted) {
    if (event.event_type !== "RESUME") {
      openEvent = event;
    } else if (openEvent) {
      const startMs = new Date(openEvent.timestamp).getTime();
      const endMs = new Date(event.timestamp).getTime();

      windows.push({
        type: openEvent.event_type,
        start: openEvent.timestamp,
        end: event.timestamp,
        durationMinutes: Math.round((endMs - startMs) / 60000),
      });

      openEvent = null;
    }
  }

  return windows;
}
