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

    // 🔴 PRODUCTION RULE: NO_MATERIAL open > 30 minutes
    if (
        openEvent.event_type === "NO_MATERIAL" &&
        durationMinutes >= 30
    ) {
        return [
            {
                house_id: houseId,
                type: openEvent.event_type,
                reason: "NO_MATERIAL open > 30 minutes (no RESUME)",
                durationMinutes,
            },
        ];
    }

    return [];
}
