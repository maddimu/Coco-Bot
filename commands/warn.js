const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { getRandomColor, getRandomEmoji } = require('../utils/colorManager');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../data/warnings.json');

// Load warnings from file
function loadWarnings() {
    try {
        if (fs.existsSync(warningsPath)) {
            return JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading warnings:', error);
    }
    return {};
}

// Save warnings to file
function saveWarnings(warnings) {
    try {
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
    } catch (error) {
        console.error('Error saving warnings:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn system commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a warning to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to warn')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the warning')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to check warnings for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific warning')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove warning from')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('warning_id')
                        .setDescription('The warning ID to remove')
                        .setMinValue(1)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to clear warnings for')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'ModerateMembers')) {
            return interaction.editReply({
                content: '❌ You do not have permission to manage warnings!'
            });
        }

        const warnings = loadWarnings();
        const guildId = interaction.guild.id;
        
        if (!warnings[guildId]) {
            warnings[guildId] = {};
        }

        switch (subcommand) {
            case 'add':
                await handleAddWarning(interaction, warnings);
                break;
            case 'list':
                await handleListWarnings(interaction, warnings);
                break;
            case 'remove':
                await handleRemoveWarning(interaction, warnings);
                break;
            case 'clear':
                await handleClearWarnings(interaction, warnings);
                break;
        }
    },
};

async function handleAddWarning(interaction, warnings) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const guildId = interaction.guild.id;
    const userId = user.id;

    // Check if trying to warn themselves or the bot
    if (user.id === interaction.user.id) {
        return interaction.editReply({
            content: '❌ You cannot warn yourself!'
        });
    }

    if (user.id === interaction.client.user.id) {
        return interaction.editReply({
            content: '❌ You cannot warn me!'
        });
    }

    // Initialize user warnings if they don't exist
    if (!warnings[guildId][userId]) {
        warnings[guildId][userId] = [];
    }

    // Add the warning
    const warning = {
        id: warnings[guildId][userId].length + 1,
        reason: reason,
        moderator: interaction.user.tag,
        moderatorId: interaction.user.id,
        timestamp: new Date().toISOString()
    };

    warnings[guildId][userId].push(warning);
    saveWarnings(warnings);

    // Reply with success
    await interaction.editReply({
        content: `⚠️ **${user.tag}** has been warned!\n**Reason:** ${reason}\n**Total warnings:** ${warnings[guildId][userId].length}`
    });
}

async function handleListWarnings(interaction, warnings) {
    const user = interaction.options.getUser('user');
    const guildId = interaction.guild.id;
    const userId = user.id;

    const userWarnings = warnings[guildId]?.[userId] || [];

    if (userWarnings.length === 0) {
        return interaction.editReply({
            content: `✅ **${user.tag}** has no warnings!`
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(`${getRandomEmoji()} Warnings for ${user.tag}`)
        .setThumbnail(user.displayAvatarURL())
        .setColor(getRandomColor())
        .setFooter({ text: `Total warnings: ${userWarnings.length}` })
        .setTimestamp();

    userWarnings.forEach(warning => {
        embed.addFields({
            name: `Warning #${warning.id}`,
            value: `**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Date:** <t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:f>`,
            inline: false
        });
    });

    await interaction.editReply({ embeds: [embed] });
}

async function handleRemoveWarning(interaction, warnings) {
    const user = interaction.options.getUser('user');
    const warningId = interaction.options.getInteger('warning_id');
    const guildId = interaction.guild.id;
    const userId = user.id;

    const userWarnings = warnings[guildId]?.[userId] || [];

    if (userWarnings.length === 0) {
        return interaction.editReply({
            content: `❌ **${user.tag}** has no warnings to remove!`
        });
    }

    const warningIndex = userWarnings.findIndex(w => w.id === warningId);
    if (warningIndex === -1) {
        return interaction.editReply({
            content: `❌ Warning #${warningId} not found for **${user.tag}**!`
        });
    }

    const removedWarning = userWarnings.splice(warningIndex, 1)[0];
    saveWarnings(warnings);

    await interaction.editReply({
        content: `✅ Warning #${warningId} removed from **${user.tag}**!\n**Removed warning:** ${removedWarning.reason}`
    });
}

async function handleClearWarnings(interaction, warnings) {
    const user = interaction.options.getUser('user');
    const guildId = interaction.guild.id;
    const userId = user.id;

    const userWarnings = warnings[guildId]?.[userId] || [];

    if (userWarnings.length === 0) {
        return interaction.editReply({
            content: `❌ **${user.tag}** has no warnings to clear!`
        });
    }

    const warningCount = userWarnings.length;
    warnings[guildId][userId] = [];
    saveWarnings(warnings);

    await interaction.editReply({
        content: `✅ All warnings cleared for **${user.tag}**! (${warningCount} warnings removed)`
    });
}
