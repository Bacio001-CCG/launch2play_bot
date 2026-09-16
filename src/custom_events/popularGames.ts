import { type TextChannel } from "discord.js";
import type { DiscordClient } from "../client.js";
import { getGames } from "../api/rawg.js";
import config from "../config.js";
import { formatDate, lastDaysRange } from "../utils/dates.js";
import { gameToEmbed, hasPostedToday, refreshChannel, sendEmbedPages } from "../utils/channelFeed.js";
import { logError } from "../utils/logError.js";

export default async function execute(client: DiscordClient) {
    if (!config.POPULAR_GAMES.ENABLED) return;
    if (!config.RAWG.API_KEY) {
        console.error("RAWG API key is missing. Set RAWG_API_KEY in .env");
        return;
    }
    if (!config.POPULAR_GAMES.CHANNEL_ID) {
        console.error("POPULAR_GAMES.CHANNEL_ID is not set");
        return;
    }

    const channel = await client.channels.fetch(config.POPULAR_GAMES.CHANNEL_ID) as TextChannel | null;
    if (!channel) {
        console.error("Popular games channel not found");
        return;
    }
    if (!client.user) return;
    if (await hasPostedToday(channel, client.user.id)) return;

    const week = lastDaysRange(7);

    try {
        const games = await getGames({
            dates: `${week.start},${week.end}`,
            ordering: "-added",
            page_size: config.POPULAR_GAMES.PAGE_SIZE,
        });

        await refreshChannel(channel, client.user.id);
        await sendEmbedPages(
            channel,
            games.map((game, index) => gameToEmbed(game, `${index + 1}.`)),
            `**Most popular games this week** (${week.start} to ${week.end}) · ${formatDate(new Date())}`,
        );
    } catch (error) {
        logError("Failed to refresh popular games", error);
    }
}
