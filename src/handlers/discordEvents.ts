import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Events, type ClientEvents } from "discord.js";
import type { DiscordClient } from "../client.js";

const eventsDir = join(dirname(fileURLToPath(import.meta.url)), "../discord_events");
const discordEventNames = new Set<string>(Object.values(Events));

export type DiscordEventExecute<K extends keyof ClientEvents = keyof ClientEvents> = (
    client: DiscordClient,
    ...args: ClientEvents[K]
) => unknown;

export async function registerDiscordEvents(client: DiscordClient) {
    const files = (await readdir(eventsDir)).filter((file) => {
        if (file.startsWith(".")) return false;
        if (file.endsWith(".d.ts") || file.endsWith(".map")) return false;
        return file.endsWith(".js") || file.endsWith(".ts");
    });

    for (const file of files) {
        const name = file.replace(/\.(ts|js)$/, "");
        if (!discordEventNames.has(name)) {
            console.warn(`Skipping ${file}: "${name}" is not a discord.js event.`);
            continue;
        }

        const moduleUrl = pathToFileURL(join(eventsDir, file)).href;
        const eventModule = await import(moduleUrl);
        const execute = eventModule.default as DiscordEventExecute | undefined;

        if (typeof execute !== "function") {
            console.warn(`Skipping ${file}: missing a default export function.`);
            continue;
        }

        const listener = (...args: ClientEvents[keyof ClientEvents]) => {
            void execute(client, ...args);
        };

        if (eventModule.once === true) {
            client.once(name, listener);
        } else {
            client.on(name, listener);
        }
    }
}
