import type { Message } from "discord.js";
import type { DiscordClient } from "../client.js";
import config from "../config.js";

export default async function execute(client: DiscordClient, message: Message) {
    if (!config.HONEYPOT.ENABLED) return;
    if (message.channel.id !== config.HONEYPOT.CHANNEL_ID) return;
    if (message.author.id === client.user?.id) return;
    if (message.content.includes(config.HONEYPOT.WARNING_MESSAGE)) return;
    return await message.member?.ban({ reason: "Suspicious activity", deleteMessageDays: 1 });
}