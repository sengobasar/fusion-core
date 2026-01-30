type EventRecord = {
    event_type: string;
    timestamp: string;
};

type Alert = {
    house_id: string;
    type: string;
    reason: string;
    durationMinutes: number;
};

export function checkOpenWindows(
    houseId: string,
    events: EventRecord[]
): Alert[] {
    if (events.length === 0) return [];

    // Sort events oldest → newest
    const sorted = [...events].sort(
        (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime()
    );

    let openEvent: EventRecord | null = null;

    for (const e of sorted) {
        if (e.event_type !== "RESUME") {
            openEvent = e;
        } else {
            openEvent = null;
        }
    }

    if (!openEvent) return [];

    const now = Date.now();
    const start = new Date(openEvent.timestamp).getTime();
    const durationMinutes = Math.floor((now - start) / 60000);

    // 🔴 NO MATERIAL — supply issue
    if (
        openEvent.event_type === "NO_MATERIAL" &&
        durationMinutes >= 1
    ) {
        return [{
            house_id: houseId,
            type: "NO_MATERIAL",
            reason: "Material still unavailable (> 1 minute)",
            durationMinutes,
        }];
    }

    // 🟠 THREAD BREAK — maintenance / quality
    if (
        openEvent.event_type === "THREAD_BREAK" &&
        durationMinutes >= 2
    ) {
        return [{
            house_id: houseId,
            type: "THREAD_BREAK",
            reason: "Thread break unresolved (> 2 minutes)",
            durationMinutes,
        }];
    }

    // 🔵 NO ORDER — planning issue
    if (
        openEvent.event_type === "NO_ORDER" &&
        durationMinutes >= 2
    ) {
        return [{
            house_id: houseId,
            type: "NO_ORDER",
            reason: "No order assigned (> 2 minutes)",
            durationMinutes,
        }];
    }

    return [];
}
