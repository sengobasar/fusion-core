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
    const sorted = [...events].sort(
        (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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
    const durationMinutes = Math.round((now - start) / 60000);

    // 🔴 NO_MATERIAL — supply issue
    if (
        openEvent.event_type === "NO_MATERIAL" &&
        durationMinutes >= 30
    ) {
        return [{
            house_id: houseId,
            type: "NO_MATERIAL",
            reason: "Material unavailable for > 30 minutes",
            durationMinutes,
        }];
    }

    // 🔴 THREAD_BREAK — maintenance / quality
    if (
        openEvent.event_type === "THREAD_BREAK" &&
        durationMinutes >= 20
    ) {
        return [{
            house_id: houseId,
            type: "THREAD_BREAK",
            reason: "Thread break unresolved for > 20 minutes",
            durationMinutes,
        }];
    }

    // 🔴 NO_ORDER — planning failure
    if (
        openEvent.event_type === "NO_ORDER" &&
        durationMinutes >= 120
    ) {
        return [{
            house_id: houseId,
            type: "NO_ORDER",
            reason: "No order assigned for > 2 hours",
            durationMinutes,
        }];
    }

    return [];
}
