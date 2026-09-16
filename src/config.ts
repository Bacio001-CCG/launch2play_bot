import { ActivityType } from "discord.js";
import { config } from "dotenv";

config();

export default {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN as string,
    ACTIVITIES: [
        { name: "Provided by BotWiz.dev", type: ActivityType.Playing },
        { name: "Game hosting on Launch2Play.com", type: ActivityType.Playing },
    ],
    ACTIVITIES_INTERVAL: 15000, // Default is 15 seconds - seconds * 1000 = milliseconds
    PING_INTERVAL: 10000, // Default is 10 seconds - seconds * 1000 = milliseconds
    LOGGING_TOGGLES: {
        ERROR: true,
        WARN: true,
        PING: true,
        DEBUG: true,
        INFO: true,
        LOG: true,
        TRACE: true,
        CACHE_SWEEP: true,
        RATE_LIMITED: true,
        SHARD_ERROR: true,
        SHARD_RECONNECTING: true,
        SHARD_RESUME: true,
        SHARD_DISCONNECT: true,
        SHARD_INVALIDATE: true,
        SHARD_READY: true,
        CLIENT_READY: true,
        CLIENT_READY_CONDENSED: true,
    },
    HONEYPOT: {
        ENABLED: true,
        WARNING_MESSAGE: "Don't send messages to this channel, you will be punished! This is a honeypot channel, meant for checking for spam and other malicious activity.",
        CHANNEL_ID: "1549815730000896021",
    },
    RAWG: {
        API_KEY: process.env.RAWG_API_KEY as string,
        BASE_URL: "https://api.rawg.io/api",
    },
    GAME_RELEASES: {
        ENABLED: true,
        CHANNEL_ID: "1549827955025387630",
        INTERVAL: 60 * 60 * 1000, // Default is 1 hour - hours * 60 * 60 * 1000 = milliseconds
        PAGE_SIZE: 40,
    },
    GAME_NEWS: {
        ENABLED: true,
        CHANNEL_ID: "1549827919914995753",
        INTERVAL: 60 * 60 * 1000, // Default is 1 hour - hours * 60 * 60 * 1000 = milliseconds
        PAGE_SIZE: 12,
        FEEDS: [
            "https://news.google.com/rss/search?q=video+games+when:1d&hl=en-US&gl=US&ceid=US:en",
            "https://www.ign.com/rss/articles/feed",
        ],
    },
    POPULAR_GAMES: {
        ENABLED: true,
        CHANNEL_ID: "1549827993373905046",
        INTERVAL: 60 * 60 * 1000, // Default is 1 hour - hours * 60 * 60 * 1000 = milliseconds
        PAGE_SIZE: 20,
    },
}