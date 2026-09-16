function pad(value: number): string {
    return String(value).padStart(2, "0");
}

export function formatDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function monthRange(offset = 0): { start: string; end: string; label: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);

    return {
        start: formatDate(start),
        end: formatDate(end),
        label: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
    };
}

export function lastDaysRange(days: number): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    return {
        start: formatDate(start),
        end: formatDate(end),
    };
}
