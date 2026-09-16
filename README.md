# Launch2Play Bot

A Discord bot for [Launch2Play](https://launch2play.com). It will track game releases and news so communities can stay on top of what is coming out and what is happening in games.
This repo is also meant as a reference for new programmers.

**This is not a support server, only join this if you're interested in our platform**: [Launch2Play Discord](https://discord.gg/6pSQjDbsdJ)

**This is not an example of how [BotWiz.dev](https://botwiz.dev) is made.** BotWiz is a separate product with its own architecture. This project is the Launch2Play bot, written as a straightforward discord.js app you can learn from.

## Stack

- TypeScript (ESM, `NodeNext`)
- [discord.js](https://discord.js.org) v14
- [pnpm](https://pnpm.io)
- `tsx` for local development

## Setup

1. Clone the repo and install dependencies:

```bash
pnpm install
```

2. Create a `.env` file in the project root:

```
DISCORD_TOKEN=your_bot_token_here
RAWG_API_KEY=your_rawg_api_token_here
```

3. Run the bot:

```bash
pnpm dev
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run with live reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run the compiled bot |
| `pnpm typecheck` | Type-check without emitting |


Relative TypeScript imports use `.js` extensions (`./client.js`) because this project compiles to native ESM. TypeScript still resolves those specifiers to the `.ts` source files.

## AI

I use AI while building this, but I do not paste its output blindly. Treat it as a tool, not a source of truth. If you are just starting out, write the code yourself. Use AI to explain what you do not understand — not to generate the project for you.