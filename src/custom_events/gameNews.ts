import axios from "axios";
import { EmbedBuilder, type TextChannel } from "discord.js";
import Parser from "rss-parser";
import type { DiscordClient } from "../client.js";
import { searchGame } from "../api/rawg.js";
import config from "../config.js";
import { formatDate } from "../utils/dates.js";
import { hasPostedToday, refreshChannel, sendEmbedPages, truncate } from "../utils/channelFeed.js";
import { logError } from "../utils/logError.js";

const parser = new Parser();
const dayMs = 24 * 60 * 60 * 1000;

type NewsItem = {
    title: string;
    link: string;
    source?: string;
    publishedAt: Date;
    snippet?: string;
};

export default async function execute(client: DiscordClient) {
    if (!config.GAME_NEWS.ENABLED) return;
    if (!config.GAME_NEWS.CHANNEL_ID) {
        console.error("GAME_NEWS.CHANNEL_ID is not set");
        return;
    }

    const channel = await client.channels.fetch(config.GAME_NEWS.CHANNEL_ID) as TextChannel | null;
    if (!channel) {
        console.error("Game news channel not found");
        return;
    }
    if (!client.user) return;
    if (await hasPostedToday(channel, client.user.id)) return;

    try {
        const articles = await getTodaysGameNews();
        const embeds: EmbedBuilder[] = [];

        for (const article of articles) {
            embeds.push(await articleToEmbed(article));
        }

        await refreshChannel(channel, client.user.id);
        await sendEmbedPages(
            channel,
            embeds,
            `**Today's game news** (${embeds.length} stories) · ${formatDate(new Date())}`,
        );
    } catch (error) {
        logError("Failed to refresh today's game news", error);
    }
}

async function getTodaysGameNews(): Promise<NewsItem[]> {
    const cutoff = Date.now() - dayMs;
    const seen = new Set<string>();
    const items: NewsItem[] = [];

    for (const feedUrl of config.GAME_NEWS.FEEDS) {
        const response = await axios.get<string>(feedUrl, {
            responseType: "text",
            headers: {
                "User-Agent": "launch2play-bot/1.0",
            },
        });
        const feed = await parser.parseString(response.data);

        for (const item of feed.items) {
            if (!item.title || !item.link) continue;

            const publishedAt = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date();
            if (Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < cutoff) continue;

            const key = item.title.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);

            items.push({
                title: item.title,
                link: item.link,
                source: feed.title,
                publishedAt,
                snippet: item.contentSnippet,
            });
        }
    }

    items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    return items.slice(0, config.GAME_NEWS.PAGE_SIZE);
}

async function articleToEmbed(article: NewsItem): Promise<EmbedBuilder> {
    const embed = new EmbedBuilder()
        .setTitle(truncate(article.title, 256))
        .setURL(article.link)
        .setTimestamp(article.publishedAt)
        .setFooter({ text: article.source ? `${article.source} · RAWG metadata when matched` : "Gaming news" });

    if (article.snippet) {
        embed.setDescription(truncate(article.snippet, 400));
    }

    if (config.RAWG.API_KEY) {
        const game = await searchGame(article.title).catch(() => null);
        if (game && article.title.toLowerCase().includes(game.name.toLowerCase())) {
            if (game.image) embed.setThumbnail(game.image);
            embed.addFields(
                { name: "Game", value: game.name, inline: true },
                { name: "Released", value: game.released ?? "Unknown", inline: true },
                { name: "Platforms", value: truncate(game.platforms.join(", ") || "Unknown", 1024) },
            );
            if (game.description) {
                embed.addFields({ name: "About", value: truncate(game.description, 300) });
            }
            if (game.developers.length > 0) {
                embed.addFields({ name: "Developer", value: truncate(game.developers.join(", "), 1024), inline: true });
            }
        }
    }

    return embed;
}
