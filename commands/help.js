const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
                    { name: 'role', value: 'role' }
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
        .setTitle('🛡️ Moderation Bot Help')
        .setDescription('Here are all the available moderation commands:')
        .setColor('#5865F2')
        .addFields(
            {
                name: '👮‍♂️ **User Moderation**',
                value: '`/ban` - Ban a user from the server\n`/kick` - Kick a user from the server\n`/mute` - Mute a user (add muted role)\n`/timeout` - Timeout a user for specified duration',
                inline: false
            },
            {
                name: '⚠️ **Warning System**',
                value: '`/warn add` - Add a warning to a user\n`/warn list` - View warnings for a user\n`/warn remove` - Remove a specific warning\n`/warn clear` - Clear all warnings for a user',
                inline: false
            },
            {
                name: '🗑️ **Message Management**',
                value: '`/clear` - Delete multiple messages at once\nSupports filtering by user and bulk deletion',
                inline: false
            },
            {
                name: '🎭 **Role Management**',
                value: '`/role add` - Add a role to a user\n`/role remove` - Remove a role from a user',
                inline: false
            },
            {
                name: '❓ **Help & Info**',
                value: '`/help` - Show this help message\n`/help [command]` - Get detailed info about a command',
                inline: false
            }
        )
        .addFields(
            {
                name: '📋 **Required Permissions**',
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
        .setColor('#5865F2')
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
