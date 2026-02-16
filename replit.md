# replit.md

## Overview

This is a Discord moderation bot built with discord.js v14 and Node.js. It provides server moderation tools including banning, kicking, muting, timeouts, warnings, role management, channel management, anti-raid protection, and anti-bot protection. The bot uses Discord's slash command system and includes a minimal Express web server to keep the bot alive on hosting platforms like Replit or Render.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Entry Point
- `index.js` is the main file. It does three things:
  1. Starts a basic Express web server on port 5000 (for keep-alive pinging)
  2. Creates a Discord.js client with the necessary gateway intents
  3. Dynamically loads all command files from the `commands/` directory using filesystem scanning

### Command Pattern
- All commands live in the `commands/` directory as individual `.js` files
- Each command exports an object with a `data` property (SlashCommandBuilder) and an `execute` function
- Commands are auto-discovered: any `.js` file in `commands/` that has both `data` and `execute` is loaded automatically
- Commands use Discord's slash command system with proper permission defaults set via `setDefaultMemberPermissions`

### Available Commands
| Command | Purpose |
|---------|---------|
| `ban` | Ban users |
| `kick` | Kick users |
| `mute` | Mute users via role |
| `timeout` | Timeout users for a duration |
| `warn` | Warning system (add/list/remove/clear) |
| `clear` | Bulk delete messages |
| `role` | Add/remove roles from users |
| `createrole` | Create new roles |
| `createchannel` | Create new channels |
| `managechannel` | Edit/delete channels |
| `antiraid` | Toggle anti-raid protection |
| `antibot` | Toggle anti-bot protection |
| `help` | Show command information |

### Data Storage
- **File-based JSON storage** in the `data/` directory — no database is used
- `data/warnings.json` — stores user warnings, keyed by guild ID then user ID
- `data/config.json` — stores per-server configuration (anti-raid, anti-bot settings, etc.)
- Data is read/written synchronously using `fs.readFileSync` and `fs.writeFileSync`
- If migrating to a database, these two JSON files represent the data that would need to be migrated

### Utility Modules
- `utils/permissions.js` — centralized permission checking. Maps string permission names to Discord.js `PermissionFlagsBits`. Handles server owner and administrator overrides automatically.
- `utils/colorManager.js` — provides random pastel colors and cute emojis for embed styling. The bot uses a kawaii/cute aesthetic theme with colors like `#ffc0c9`, `#bcf0f3` and emojis like 🍬, 🎀, 🧸.

### Design Decisions
- **No database**: Chose flat JSON files for simplicity. Works fine for small-to-medium bots. Downside: no concurrent write safety, doesn't scale well across multiple bot instances.
- **Dynamic command loading**: New commands are added by simply creating a new file in `commands/`. No registration file to update.
- **Express keep-alive server**: Minimal HTTP server exists purely to respond to health checks on hosting platforms. It has a single GET route at `/` that returns "Bot is running!".
- **Permission checking is dual-layered**: Discord's built-in `setDefaultMemberPermissions` hides commands from unauthorized users in the UI, while the `checkPermissions` utility provides runtime verification in the execute function.

### Important Note
- The `index.js` file appears incomplete/truncated — it loads commands and sets up the client but the event handlers (client ready event, interaction handler, guild member add for anti-bot, etc.) and the `client.login()` call may be missing from the visible code. These would need to be present or added for the bot to function.

## External Dependencies

### NPM Packages
| Package | Version | Purpose |
|---------|---------|---------|
| `discord.js` | ^14.25.1 | Core Discord bot framework |
| `dotenv` | ^17.3.1 | Loads environment variables from `.env` file |
| `express` | ^5.2.1 | Minimal web server for keep-alive health checks |

### Environment Variables
- `DISCORD_TOKEN` (or similar) — The bot's Discord token (loaded via dotenv)
- `PORT` — Web server port, defaults to 5000

### External Services
- **Discord API** — The bot communicates with Discord's API via discord.js for all bot functionality
- No other external APIs or services are used