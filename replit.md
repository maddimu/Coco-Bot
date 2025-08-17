# Discord Moderation Bot

## Overview

This is a Discord moderation bot built with Discord.js v14 that provides comprehensive server management capabilities. The bot implements slash commands for user moderation, channel creation, role management, and server administration. It features a colorful aesthetic with random color palettes and cute emojis, proper permission checking, and persistent data storage for warnings. The bot is designed to help server administrators manage their communities with easy-to-use creation tools and moderation features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Framework
- **Discord.js v14**: Modern Discord API wrapper with slash command support
- **Node.js Runtime**: Server-side JavaScript execution environment
- **Command Handler Pattern**: Modular command structure with automatic loading from `/commands` directory
- **Event-Driven Architecture**: Responds to Discord gateway events and user interactions

### Command System
- **Slash Commands**: Native Discord slash command integration with proper permission defaults
- **Modular Design**: Each command is a separate file with standardized structure (data + execute)
- **Dynamic Loading**: Automatic command discovery and registration on bot startup
- **Subcommand Support**: Complex commands like `/warn` and `/role` use Discord's subcommand system

### Permission System
- **Multi-Layer Authorization**: Server owner > Administrator > Specific permissions
- **Permission Utility**: Centralized permission checking in `/utils/permissions.js`
- **Bot Permission Validation**: Ensures bot has necessary permissions before executing actions
- **Hierarchical Role Checking**: Prevents users from moderating higher-ranked members

### Data Storage
- **File-Based Persistence**: JSON file storage for warnings data (`/data/warnings.json`)
- **Structured Data Format**: Guild-based organization with user-specific warning arrays
- **Synchronous File Operations**: Direct file I/O for simplicity and reliability
- **Data Schema**: Warnings include ID, reason, moderator info, and timestamps

### Visual Theme System
- **Random Color Palette**: Uses custom colors (#ffc0c9, #bcf0f3, #d7fdff, #fff9c3) for all embeds
- **Cute Emoji Integration**: Random selection from collection (🍬🍡🍥🪷⭐️☀️🌈🍒🍭🍧🎨🧸🎀)
- **Consistent Aesthetics**: All embeds feature colorful themes with matching emojis
- **Color Manager Utility**: Centralized system for random color and emoji selection

### Command Categories
- **User Moderation**: Ban, kick, mute, timeout commands with duration and reason support
- **Warning System**: Add, list, remove, and clear warnings with persistent storage
- **Message Management**: Bulk message deletion with user filtering
- **Role Management**: Add/remove roles with proper hierarchy checking
- **Channel Creation**: Create new channels with types, categories, and descriptions
- **Role Creation**: Create roles with custom colors, names, and permissions
- **Channel Management**: Edit and delete existing channels with full control
- **Security Protection**: Anti-raid and anti-bot protection with real-time monitoring
- **Help System**: Interactive help with general overview and command-specific details

## External Dependencies

### Core Dependencies
- **discord.js ^14.21.0**: Discord API wrapper and gateway client
- **dotenv ^17.2.1**: Environment variable management for sensitive tokens

### Discord API Integration
- **Gateway Intents**: Guilds, messages, members, message content, and moderation events
- **REST API**: Slash command registration and Discord API interactions
- **Permission System**: Integration with Discord's permission flags and role hierarchy

### Environment Configuration
- **DISCORD_TOKEN**: Bot authentication token stored in environment variables
- **Application Commands**: Global slash command registration via Discord's REST API

### File System Operations
- **Command Loading**: Dynamic discovery and loading of command modules
- **Data Persistence**: JSON file operations for warnings storage
- **Optional Logging**: File-based logging capability (currently disabled)