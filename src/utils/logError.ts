import axios from "axios";

export function logError(context: string, error: unknown) {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const retryAfter = error.response?.headers["retry-after"];
        const parts = [context, error.message];
        if (status) parts.push(`(${status})`);
        if (retryAfter) parts.push(`retry after ${retryAfter}s`);
        console.error(parts.join(" "));
        return;
    }

    console.error(context, error);
}
