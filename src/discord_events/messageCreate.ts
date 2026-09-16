import type { Message } from "discord.js";
import type { DiscordClient } from "../client.js";
import honeypot from "../custom_events/honeypot.js";

export default async function execute(client: DiscordClient, message: Message) {
    if (message.author.id === client.user?.id) return;
    botAndUserMessage(client, message);
    if (message.author.bot) return botMessage(client, message);
    return userMessage(client, message);
}

async function botAndUserMessage(client: DiscordClient, message: Message) {
    await honeypot(client, message);
}

function botMessage(client: DiscordClient, message: Message) {}
function userMessage(client: DiscordClient, message: Message) {}