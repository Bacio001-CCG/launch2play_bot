import { type TextChannel } from "discord.js";
import type { DiscordClient } from "../client.js";
import { getGames } from "../api/rawg.js";
import config from "../config.js";
import { formatDate, monthRange } from "../utils/dates.js";
import { gameToEmbed, hasPostedToday, refreshChannel, sendEmbedPages } from "../utils/channelFeed.js";
import { logError } from "../utils/logError.js";

export default async function execute(client: DiscordClient) {
    if (!config.GAME_RELEASES.ENABLED) return;
    if (!config.RAWG.API_KEY) {
        console.error("RAWG API key is missing. Set RAWG_API_KEY in .env");
        return;
    }
    if (!config.GAME_RELEASES.CHANNEL_ID) {
        console.error("GAME_RELEASES.CHANNEL_ID is not set");
        return;
    }

    const channel = await client.channels.fetch(config.GAME_RELEASES.CHANNEL_ID) as TextChannel | null;
    if (!channel) {
        console.error("Game releases channel not found");
        return;
    }
    if (!client.user) return;
    if (await hasPostedToday(channel, client.user.id)) return;

    const thisMonth = monthRange(0);
    const nextMonth = monthRange(1);

    try {
        const thisMonthGames = await getGames({
            dates: `${thisMonth.start},${thisMonth.end}`,
            ordering: "released",
            page_size: config.GAME_RELEASES.PAGE_SIZE,
        });
        const nextMonthGames = await getGames({
            dates: `${nextMonth.start},${nextMonth.end}`,
            ordering: "released",
            page_size: config.GAME_RELEASES.PAGE_SIZE,
        });

        await refreshChannel(channel, client.user.id);
        await sendEmbedPages(
            channel,
            thisMonthGames.map((game) => gameToEmbed(game)),
            `**This month — ${thisMonth.label}** (${thisMonthGames.length} games) · ${formatDate(new Date())}`,
        );
        await sendEmbedPages(
            channel,
            nextMonthGames.map((game) => gameToEmbed(game)),
            `**Next month — ${nextMonth.label}** (${nextMonthGames.length} games) · ${formatDate(new Date())}`,
        );
    } catch (error) {
        logError("Failed to refresh game releases", error);
    }
}
