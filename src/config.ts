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
    }
}