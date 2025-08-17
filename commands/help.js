const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRandomColor, getRandomEmoji } = require('../utils/colorManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show information about available commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get detailed info about a specific command')
                .setRequired(false)
                .addChoices(
                    { name: 'ban', value: 'ban' },
                    { name: 'kick', value: 'kick' },
                    { name: 'mute', value: 'mute' },
                    { name: 'timeout', value: 'timeout' },
                    { name: 'warn', value: 'warn' },
                    { name: 'clear', value: 'clear' },
                    { name: 'role', value: 'role' },
                    { name: 'antiraid', value: 'antiraid' },
                    { name: 'antibot', value: 'antibot' }
                )),

    async execute(interaction) {
        const commandName = interaction.options.getString('command');

        if (commandName) {
            // Show detailed info about a specific command
            await showCommandDetails(interaction, commandName);
        } else {
            // Show general help
            await showGeneralHelp(interaction);
        }
    },
};

async function showGeneralHelp(interaction) {
    const embed = new EmbedBuilder()
        .setTitle(`${getRandomEmoji()} Moderation Bot Help`)
        .setDescription('Here are all the available moderation commands:')
        .setColor(getRandomColor())
        .addFields(
            {
                name: `${getRandomEmoji()} **User Moderation**`,
                value: '`/ban` - Ban a user from the server\n`/kick` - Kick a user from the server\n`/mute` - Mute a user (add muted role)\n`/timeout` - Timeout a user for specified duration',
                inline: false
            },
            {
                name: `${getRandomEmoji()} **Warning System**`,
                value: '`/warn add` - Add a warning to a user\n`/warn list` - View warnings for a user\n`/warn remove` - Remove a specific warning\n`/warn clear` - Clear all warnings for a user',
                inline: false
            },
            {
                name: `${getRandomEmoji()} **Message Management**`,
                value: '`/clear` - Delete multiple messages at once\nSupports filtering by user and bulk deletion',
                inline: false
            },
            {
                name: `${getRandomEmoji()} **Role Management**`,
                value: '`/role add` - Add a role to a user\n`/role remove` - Remove a role from a user',
                inline: false
            },
            {
                name: `${getRandomEmoji()} **Channel & Role Management**`,
                value: '`/createchannel` - Create new channels with categories\n`/managechannel` - Edit or delete channels\n`/createrole` - Create new roles with colors',
                inline: false
            },
            {
                name: `${getRandomEmoji()} **Security Protection**`,
                value: '`/antiraid [on/off]` - Detect suspicious mass actions\n`/antibot [on/off]` - Prevent unauthorized bots from joining',
                inline: false
            },
            {
                name: `${getRandomEmoji()} **Help**`,
                value: '`/help` - Show this help message\n`/help [command]` - Get detailed info about a command',
                inline: false
            }
        )
        .addFields(
            {
                name: `${getRandomEmoji()} **Required Permissions**`,
                value: 'Most commands require specific permissions. Make sure you have the appropriate role permissions to use moderation commands.',
                inline: false
            }
        )
        .setFooter({ 
            text: 'Use /help [command] for detailed information about specific commands',
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showCommandDetails(interaction, commandName) {
    const commandDetails = {
        ban: {
            title: '🔨 Ban Command',
            description: 'Permanently ban a user from the server',
            usage: '/ban <user> [reason] [delete_messages]',
            fields: [
                { name: 'Parameters', value: '• `user` - The user to ban (required)\n• `reason` - Reason for the ban (optional)\n• `delete_messages` - Delete messages from last X days 0-7 (optional)', inline: false },
                { name: 'Required Permission', value: 'Ban Members', inline: true },
                { name: 'Bot Permission', value: 'Ban Members', inline: true },
                { name: 'Notes', value: '• Cannot ban users with roles higher than yours\n• Cannot ban yourself or the bot\n• Banned users can be unbanned through Discord\'s ban list', inline: false }
            ]
        },
        kick: {
            title: '👢 Kick Command',
            description: 'Remove a user from the server (they can rejoin)',
            usage: '/kick <user> [reason]',
            fields: [
                { name: 'Parameters', value: '• `user` - The user to kick (required)\n• `reason` - Reason for the kick (optional)', inline: false },
                { name: 'Required Permission', value: 'Kick Members', inline: true },
                { name: 'Bot Permission', value: 'Kick Members', inline: true },
                { name: 'Notes', value: '• Cannot kick users with roles higher than yours\n• Cannot kick yourself or the bot\n• Kicked users can rejoin with a new invite', inline: false }
            ]
        },
        mute: {
            title: '🔇 Mute Command',
            description: 'Prevent a user from sending messages by adding a muted role',
            usage: '/mute <user> [reason]',
            fields: [
                { name: 'Parameters', value: '• `user` - The user to mute (required)\n• `reason` - Reason for the mute (optional)', inline: false },
                { name: 'Required Permission', value: 'Moderate Members', inline: true },
                { name: 'Bot Permission', value: 'Manage Roles', inline: true },
                { name: 'Notes', value: '• Creates "Muted" role if it doesn\'t exist\n• Sets up channel permissions automatically\n• Cannot mute users with roles higher than yours', inline: false }
            ]
        },
        timeout: {
            title: '⏰ Timeout Command',
            description: 'Temporarily restrict a user from sending messages, reactions, and speaking',
            usage: '/timeout <user> <duration> [reason]',
            fields: [
                { name: 'Parameters', value: '• `user` - The user to timeout (required)\n• `duration` - Duration in minutes 1-40320 (required)\n• `reason` - Reason for the timeout (optional)', inline: false },
                { name: 'Required Permission', value: 'Moderate Members', inline: true },
                { name: 'Bot Permission', value: 'Moderate Members', inline: true },
                { name: 'Duration Limits', value: '• Minimum: 1 minute\n• Maximum: 40,320 minutes (28 days)', inline: false }
            ]
        },
        warn: {
            title: '⚠️ Warning System',
            description: 'Manage user warnings with persistent storage',
            usage: '/warn <add|list|remove|clear> <user> [options]',
            fields: [
                { name: 'Subcommands', value: '• `add` - Add a warning to a user\n• `list` - View all warnings for a user\n• `remove` - Remove a specific warning by ID\n• `clear` - Remove all warnings for a user', inline: false },
                { name: 'Required Permission', value: 'Moderate Members', inline: true },
                { name: 'Storage', value: 'File-based (JSON)', inline: true },
                { name: 'Features', value: '• Persistent warning storage\n• Warning IDs for easy management\n• Moderator tracking\n• Timestamp logging', inline: false }
            ]
        },
        clear: {
            title: '🗑️ Clear Messages',
            description: 'Bulk delete messages with advanced filtering',
            usage: '/clear <amount> [user] [reason]',
            fields: [
                { name: 'Parameters', value: '• `amount` - Number of messages 1-100 (required)\n• `user` - Only delete messages from this user (optional)\n• `reason` - Reason for clearing messages (optional)', inline: false },
                { name: 'Required Permission', value: 'Manage Messages', inline: true },
                { name: 'Bot Permission', value: 'Manage Messages', inline: true },
                { name: 'Limitations', value: '• Cannot delete messages older than 14 days\n• Maximum 100 messages at once\n• Temporary confirmation message', inline: false }
            ]
        },
        role: {
            title: '🎭 Role Management',
            description: 'Add or remove roles from users',
            usage: '/role <add|remove> <user> <role> [reason]',
            fields: [
                { name: 'Subcommands', value: '• `add` - Add a role to a user\n• `remove` - Remove a role from a user', inline: false },
                { name: 'Required Permission', value: 'Manage Roles', inline: true },
                { name: 'Bot Permission', value: 'Manage Roles', inline: true },
                { name: 'Hierarchy Rules', value: '• Cannot manage roles higher than your highest role\n• Cannot manage bot roles or integration roles\n• Cannot manage @everyone role', inline: false }
            ]
        },
        createchannel: {
            title: '📝 Create Channel',
            description: 'Create new channels with different types and categories',
            usage: '/createchannel <name> <type> [category] [description]',
            fields: [
                { name: 'Parameters', value: '• `name` - Channel name (required)\n• `type` - text/voice/category/forum/announcement (required)\n• `category` - Parent category (optional)\n• `description` - Channel topic/description (optional)', inline: false },
                { name: 'Required Permission', value: 'Manage Channels', inline: true },
                { name: 'Bot Permission', value: 'Manage Channels', inline: true },
                { name: 'Channel Types', value: '• Text - Standard text chat\n• Voice - Voice communication\n• Category - Organize channels\n• Forum - Discussion threads\n• Announcement - Server announcements', inline: false }
            ]
        },
        managechannel: {
            title: '⚙️ Manage Channel',
            description: 'Edit or delete existing channels',
            usage: '/managechannel <delete|edit> <channel> [options]',
            fields: [
                { name: 'Subcommands', value: '• `delete` - Remove a channel permanently\n• `edit` - Modify channel settings', inline: false },
                { name: 'Required Permission', value: 'Manage Channels', inline: true },
                { name: 'Bot Permission', value: 'Manage Channels', inline: true },
                { name: 'Edit Options', value: '• Change channel name\n• Update description/topic\n• Move to different category\n• Provide reason for changes', inline: false }
            ]
        },
        createrole: {
            title: '🎭 Create Role',
            description: 'Create new roles with custom colors and settings',
            usage: '/createrole <name> [color] [mentionable] [hoist]',
            fields: [
                { name: 'Parameters', value: '• `name` - Role name (required)\n• `color` - Hex code or color name (optional)\n• `mentionable` - Can be @mentioned (optional)\n• `hoist` - Display separately in member list (optional)', inline: false },
                { name: 'Required Permission', value: 'Manage Roles', inline: true },
                { name: 'Bot Permission', value: 'Manage Roles', inline: true },
                { name: 'Color Examples', value: '• Hex: #FF0000, #00FF00\n• Names: red, blue, green, purple\n• Case insensitive', inline: false }
            ]
        },
        antiraid: {
            title: '🛡️ Anti-Raid Protection',
            description: 'Toggle protection against mass suspicious activities',
            usage: '/antiraid <on|off>',
            fields: [
                { name: 'Protection Features', value: '• Mass join detection (10+ users in 1 minute)\n• Message spam detection (15+ messages in 10 seconds)\n• Automatic alerts to moderators\n• Temporary user timeouts for spam', inline: false },
                { name: 'Required Permission', value: 'Administrator', inline: true },
                { name: 'Bot Permission', value: 'Moderate Members, Manage Messages', inline: true },
                { name: 'How it Works', value: 'Monitors server activity and sends alerts to mod-log channels when suspicious patterns are detected', inline: false }
            ]
        },
        antibot: {
            title: '🤖 Anti-Bot Protection',
            description: 'Prevent unauthorized bots from joining your server',
            usage: '/antibot <on|off>',
            fields: [
                { name: 'Protection Features', value: '• Automatic bot detection\n• Unauthorized bot removal\n• Bot join notifications\n• Whitelist system for approved bots', inline: false },
                { name: 'Required Permission', value: 'Administrator', inline: true },
                { name: 'Bot Permission', value: 'Kick Members', inline: true },
                { name: 'Exceptions', value: '• Bots with Administrator permissions are allowed\n• Whitelisted bots (like this moderation bot) are allowed\n• All activity is logged to mod-log channels', inline: false }
            ]
        }
    };

    const details = commandDetails[commandName];
    if (!details) {
        return interaction.reply({
            content: '❌ Command not found!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(details.title)
        .setDescription(details.description)
        .setColor(getRandomColor())
        .addFields(
            { name: '💻 Usage', value: `\`${details.usage}\``, inline: false },
            ...details.fields
        )
        .setFooter({ 
            text: 'Parameters in <> are required, parameters in [] are optional',
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
