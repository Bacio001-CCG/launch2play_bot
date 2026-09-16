import {Client, GatewayIntentBits, TextChannel } from "discord.js";
import config from "./config.js";
import gameNews from "./custom_events/gameNews.js";
import gameReleases from "./custom_events/gameReleases.js";
import popularGames from "./custom_events/popularGames.js";
import { registerDiscordEvents } from "./handlers/discordEvents.js";

export class DiscordClient extends Client {

    private activitiesInterval?: NodeJS.Timeout;
    private pingInterval?: NodeJS.Timeout;
    private feedIntervals: NodeJS.Timeout[] = [];
    private eventsReady: Promise<void>;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
        this.eventsReady = this.registerEvents();
    }

    async registerEvents() {
        await registerDiscordEvents(this);

        this.on("clientReady", async () => {
            let lastActivityIndex = -1;

            this.activitiesInterval = setInterval(() => {
                lastActivityIndex = (lastActivityIndex + 1) % config.ACTIVITIES.length;
                this.user?.setActivity(config.ACTIVITIES[lastActivityIndex]!.name, { type: config.ACTIVITIES[lastActivityIndex]!.type });
            }, config.ACTIVITIES_INTERVAL);

            await this.honeypotSetup();
            await this.startFeed(config.GAME_RELEASES.ENABLED, gameReleases, config.GAME_RELEASES.INTERVAL);
            await this.startFeed(config.GAME_NEWS.ENABLED, gameNews, config.GAME_NEWS.INTERVAL);
            await this.startFeed(config.POPULAR_GAMES.ENABLED, popularGames, config.POPULAR_GAMES.INTERVAL);

        });

        this.on("disconnect", () => { this.onDisconnect(); });

        // Discord.js events logging
        this.on("error", (error) => { if (config.LOGGING_TOGGLES.ERROR) console.error("Error:", error); });
        this.on("warn", (warning) => { if (config.LOGGING_TOGGLES.WARN) console.warn("Warning:", warning); });
        this.on("debug", (debug) => { if (config.LOGGING_TOGGLES.DEBUG) console.debug("Debug:", debug); });
        this.on("info", (info) => { if (config.LOGGING_TOGGLES.INFO) console.info("Info:", info); });
        this.on("log", (log) => { if (config.LOGGING_TOGGLES.LOG) console.log("Log:", log); });
        this.on("trace", (trace) => { if (config.LOGGING_TOGGLES.TRACE) console.trace("Trace:", trace); });
        this.on("cacheSweep", (cacheSweep) => { if (config.LOGGING_TOGGLES.CACHE_SWEEP) console.log("Cache Sweep:", cacheSweep); });
        this.on("shardError", (shardError) => { if (config.LOGGING_TOGGLES.SHARD_ERROR) console.log("Shard Error:", shardError); });
        this.on("shardReconnecting", (shardReconnecting) => { if (config.LOGGING_TOGGLES.SHARD_RECONNECTING) console.log("Shard Reconnecting:", shardReconnecting); });
        this.on("shardResume", (shardResume) => { if (config.LOGGING_TOGGLES.SHARD_RESUME) console.log("Shard Resume:", shardResume); });
        this.on("shardDisconnect", (shardDisconnect) => { if (config.LOGGING_TOGGLES.SHARD_DISCONNECT) console.log("Shard Disconnect:", shardDisconnect); });
        this.on("shardInvalidate", (shardInvalidate) => { if (config.LOGGING_TOGGLES.SHARD_INVALIDATE) console.log("Shard Invalidate:", shardInvalidate); });
        this.on("shardReady", (shardReady) => { if (config.LOGGING_TOGGLES.SHARD_READY) console.log("Shard Ready:", shardReady); });
        this.on("clientReady", (clientReady) => { if (config.LOGGING_TOGGLES.CLIENT_READY) console.log("Client Ready:", config.LOGGING_TOGGLES.CLIENT_READY_CONDENSED ? `Logged in as ${clientReady.user?.tag}` : clientReady); });
        
        // Custom events logging
        if (config.LOGGING_TOGGLES.PING) {
            this.logPing();
        }
    }

    async login() {
        await this.eventsReady;
        return await super.login(process.env.DISCORD_TOKEN as string);
    }

    async onDisconnect() {
        if (this.activitiesInterval) {
            clearInterval(this.activitiesInterval);
        }
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        for (const interval of this.feedIntervals) {
            clearInterval(interval);
        }
    }

    async logPing() {
        this.pingInterval = setInterval(() => {
            console.log("Ping:", Math.round(this.ws.ping), "ms");
        }, config.PING_INTERVAL);
    }

    async honeypotSetup() {
        if(config.HONEYPOT.ENABLED && config.HONEYPOT.CHANNEL_ID) {
            // Honeypot setup
            const honeypotChannel = await this.channels.fetch(config.HONEYPOT.CHANNEL_ID) as TextChannel | null;
            if (!honeypotChannel) {
                throw new Error("Honeypot channel not found");
            }

            const honeypotChannelMessages = await honeypotChannel.messages.fetch({ limit: 100 });
            const honeypotWarningSent = honeypotChannelMessages.some(message => message.content === config.HONEYPOT.WARNING_MESSAGE);
            if (!honeypotWarningSent) {
                honeypotChannel.send(config.HONEYPOT.WARNING_MESSAGE);
            }
        }
    }

    async startFeed(enabled: boolean, execute: (client: DiscordClient) => Promise<void>, interval: number) {
        if (!enabled) return;

        await execute(this);
        this.feedIntervals.push(setInterval(() => {
            void execute(this);
        }, interval));
    }
}
