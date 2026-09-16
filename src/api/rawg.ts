import axios from "axios";
import config from "../config.js";
import { logError } from "../utils/logError.js";

const SKIP_TAGS = /steam|controller|achievements|cloud|trading cards|remote play|in.?app purchases|stats|captions|commentary/i;
const RETRYABLE = new Set([429, 502, 503, 504]);
const detailsCache = new Map<number, Pick<Game, "description" | "developers" | "publishers">>();

const rawg = axios.create({
    baseURL: config.RAWG.BASE_URL,
    timeout: 15000,
    headers: {
        "User-Agent": "launch2play-bot/1.0",
    },
});

let backoffUntil = 0;

type RawgGame = {
    id: number;
    slug?: string;
    name: string;
    released: string | null;
    background_image: string | null;
    rating: number;
    metacritic: number | null;
    playtime?: number;
    platforms: { platform: { name: string } }[] | null;
    genres: { name: string }[] | null;
    tags?: { name: string }[] | null;
    esrb_rating?: { name: string } | null;
    description_raw?: string | null;
    developers?: { name: string }[] | null;
    publishers?: { name: string }[] | null;
};

type RawgGamesResponse = {
    count: number;
    next: string | null;
    results: RawgGame[];
};

export type Game = {
    id: number;
    name: string;
    released: string | null;
    image: string | null;
    rating: number;
    metacritic: number | null;
    platforms: string[];
    genres: string[];
    tags: string[];
    developers: string[];
    publishers: string[];
    description?: string;
    slug?: string;
};

export async function getGames(params: {
    dates: string;
    ordering: string;
    page_size: number;
}): Promise<Game[]> {
    const data = await rawgGet<RawgGamesResponse>("/games", params);
    return withGameInfo(data.results.map(mapGame));
}

export async function searchGame(name: string): Promise<Game | null> {
    try {
        const data = await rawgGet<RawgGamesResponse>("/games", {
            search: name,
            page_size: 1,
        });
        const game = data.results[0];
        if (!game) return null;

        const [hydrated] = await withGameInfo([mapGame(game)]);
        return hydrated ?? null;
    } catch (error) {
        logError("RAWG search failed", error);
        return null;
    }
}

export async function withGameInfo(games: Game[]): Promise<Game[]> {
    const hydrated: Game[] = [];
    for (const game of games) {
        hydrated.push(await hydrateGame(game));
    }
    return hydrated;
}

async function hydrateGame(game: Game): Promise<Game> {
    const cached = detailsCache.get(game.id);
    if (cached) {
        return { ...game, ...cached, description: cached.description ?? fallbackDescription(game) };
    }
    if (Date.now() < backoffUntil) {
        return { ...game, description: fallbackDescription(game) };
    }

    try {
        const data = await rawgGet<RawgGame>(`/games/${game.id}`, {}, 1);
        const extra = {
            description: cleanDescription(data.description_raw) ?? fallbackDescription(game),
            developers: data.developers?.map((developer) => developer.name) ?? [],
            publishers: data.publishers?.map((publisher) => publisher.name) ?? [],
        };
        detailsCache.set(game.id, extra);
        return { ...game, ...extra };
    } catch (error) {
        noteBackoff(error);
        return { ...game, description: fallbackDescription(game) };
    }
}

async function rawgGet<T>(path: string, params: Record<string, string | number>, retries = 3): Promise<T> {
    await waitForBackoff();

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await rawg.get<T>(path, {
                params: {
                    key: config.RAWG.API_KEY,
                    ...params,
                },
            });
            return response.data;
        } catch (error) {
            lastError = error;
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            if (!status || !RETRYABLE.has(status) || attempt === retries) {
                throw error;
            }

            const waitMs = retryDelay(error, attempt);
            noteBackoff(error, waitMs);
            console.warn(`RAWG ${status} on ${path}, retrying in ${Math.ceil(waitMs / 1000)}s`);
            await sleep(waitMs);
        }
    }

    throw lastError;
}

function retryDelay(error: unknown, attempt: number): number {
    if (axios.isAxiosError(error)) {
        const retryAfter = Number(error.response?.headers["retry-after"]);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
            return Math.min(retryAfter * 1000, 60_000);
        }
    }
    return Math.min(1000 * 2 ** attempt, 15_000);
}

function noteBackoff(error: unknown, waitMs?: number) {
    const delay = waitMs ?? retryDelay(error, 0);
    backoffUntil = Math.max(backoffUntil, Date.now() + delay);
}

async function waitForBackoff() {
    const waitMs = backoffUntil - Date.now();
    if (waitMs > 0) {
        await sleep(waitMs);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapGame(game: RawgGame): Game {
    return {
        id: game.id,
        name: game.name,
        released: game.released,
        image: game.background_image,
        rating: game.rating,
        metacritic: game.metacritic,
        platforms: game.platforms?.map((entry) => entry.platform.name) ?? [],
        genres: game.genres?.map((genre) => genre.name) ?? [],
        tags: game.tags?.map((tag) => tag.name).filter((tag) => !SKIP_TAGS.test(tag)).slice(0, 5) ?? [],
        developers: game.developers?.map((developer) => developer.name) ?? [],
        publishers: game.publishers?.map((publisher) => publisher.name) ?? [],
        description: cleanDescription(game.description_raw),
        slug: game.slug,
    };
}

function cleanDescription(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    const text = raw.replace(/\s+/g, " ").trim();
    return text || undefined;
}

function fallbackDescription(game: Game): string | undefined {
    const parts: string[] = [];
    if (game.genres.length > 0) parts.push(game.genres.join(", "));
    if (game.tags.length > 0) parts.push(game.tags.join(", "));
    return parts.length > 0 ? parts.join(" · ") : undefined;
}
