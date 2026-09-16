import { EmbedBuilder, type TextChannel } from "discord.js";
import type { Game } from "../api/rawg.js";
import { formatDate, startOfToday } from "./dates.js";

export async function hasPostedToday(channel: TextChannel, botId: string): Promise<boolean> {
    const since = startOfToday();
    const today = formatDate(since);
    const messages = await channel.messages.fetch({ limit: 50 });

    return messages.some((message) => {
        if (message.author.id !== botId) return false;
        if (message.createdAt >= since) return true;
        return message.content.includes(today);
    });
}

export async function refreshChannel(channel: TextChannel, botId: string) {
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

    for (let pass = 0; pass < 20; pass++) {
        const messages = await channel.messages.fetch({ limit: 100 });
        const ours = messages.filter((message) => message.author.id === botId);
        if (ours.size === 0) break;

        const now = Date.now();
        const recent = ours.filter((message) => now - message.createdTimestamp < twoWeeksMs);
        const old = ours.filter((message) => now - message.createdTimestamp >= twoWeeksMs);

        if (recent.size > 1) {
            try {
                await channel.bulkDelete(recent);
            } catch {
                for (const message of recent.values()) {
                    await message.delete().catch(() => undefined);
                }
            }
        } else if (recent.size === 1) {
            await recent.first()?.delete().catch(() => undefined);
        }

        for (const message of old.values()) {
            await message.delete().catch(() => undefined);
        }
    }
}

export async function sendEmbedPages(channel: TextChannel, embeds: EmbedBuilder[], header?: string) {
    if (embeds.length === 0) {
        if (header) {
            await channel.send({ content: header });
        }
        return;
    }

    for (let i = 0; i < embeds.length; i += 10) {
        await channel.send({
            ...(i === 0 && header ? { content: header } : {}),
            embeds: embeds.slice(i, i + 10),
        });
    }
}

export function gameToEmbed(game: Game, extraTitle?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle(extraTitle ? `${extraTitle} ${game.name}` : game.name)
        .setFooter({ text: "Game data from RAWG.io" });

    if (game.slug) {
        embed.setURL(`https://rawg.io/games/${game.slug}`);
    }
    if (game.image) {
        embed.setThumbnail(game.image);
    }
    if (game.description) {
        embed.setDescription(truncate(game.description, 350));
    }

    embed.addFields(
        { name: "Released", value: game.released ?? "Unknown", inline: true },
        { name: "Metacritic", value: game.metacritic !== null ? String(game.metacritic) : "N/A", inline: true },
        { name: "Rating", value: game.rating ? game.rating.toFixed(1) : "N/A", inline: true },
    );

    if (game.developers.length > 0) {
        embed.addFields({ name: "Developer", value: truncate(game.developers.join(", "), 1024), inline: true });
    }
    if (game.publishers.length > 0) {
        embed.addFields({ name: "Publisher", value: truncate(game.publishers.join(", "), 1024), inline: true });
    }

    embed.addFields(
        { name: "Platforms", value: truncate(game.platforms.join(", ") || "Unknown", 1024) },
        { name: "Genres", value: truncate(game.genres.join(", ") || "Unknown", 1024) },
    );

    return embed;
}

export function truncate(value: string, max: number): string {
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1)}…`;
}
