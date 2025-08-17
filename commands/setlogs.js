const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { getRandomColor, getRandomEmoji } = require('../utils/colorManager');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

// Load configuration
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return {};
}

// Save configuration
function saveConfig(config) {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(configPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Configure logging channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('general')
                .setDescription('Set the general logs channel (user changes, roles, channels, messages)')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for general logs')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('moderation')
                .setDescription('Set the moderation logs channel (bans, warnings, kicks, etc.)')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for moderation logs')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current logging configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable logging')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of logging to disable')
                        .setRequired(true)
                        .addChoices(
                            { name: 'General', value: 'general' },
                            { name: 'Moderation', value: 'moderation' },
                            { name: 'All', value: 'all' }
                        )))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'Administrator')) {
            return interaction.reply({
                content: 'You need Administrator permission to configure logging!',
                flags: 64
            });
        }

        const config = loadConfig();
        const guildId = interaction.guild.id;
        
        if (!config[guildId]) {
            config[guildId] = {};
        }

        switch (subcommand) {
            case 'general':
                await handleSetGeneral(interaction, config);
                break;
            case 'moderation':
                await handleSetModeration(interaction, config);
                break;
            case 'view':
                await handleView(interaction, config);
                break;
            case 'disable':
                await handleDisable(interaction, config);
                break;
        }
    },
};

async function handleSetGeneral(interaction, config) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    if (!channel.isTextBased()) {
        return interaction.reply({
            content: 'Please select a text channel for logging!',
            flags: 64
        });
    }

    // Check if bot can send messages in the channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has(['SendMessages', 'EmbedLinks'])) {
        return interaction.reply({
            content: `I don't have permission to send messages and embeds in ${channel}! Please give me the required permissions.`,
            flags: 64
        });
    }

    config[guildId].generalLogChannel = channel.id;
    saveConfig(config);

    const embed = new EmbedBuilder()
        .setTitle(`${getRandomEmoji()} General Logging Configured`)
        .setDescription(`General logs will now be sent to ${channel}`)
        .addFields({
            name: 'Logged Events',
            value: '• User joins/leaves\n• Role changes\n• Channel updates\n• Message edits/deletes\n• Nickname changes\n• Voice channel activity',
            inline: false
        })
        .setColor(getRandomColor())
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Send test message to the log channel
    const testEmbed = new EmbedBuilder()
        .setTitle(`${getRandomEmoji()} General Logging Enabled`)
        .setDescription('This channel will now receive general server logs.')
        .setColor(getRandomColor())
        .setTimestamp();

    await channel.send({ embeds: [testEmbed] });
}

async function handleSetModeration(interaction, config) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    if (!channel.isTextBased()) {
        return interaction.reply({
            content: 'Please select a text channel for logging!',
            flags: 64
        });
    }

    // Check if bot can send messages in the channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has(['SendMessages', 'EmbedLinks'])) {
        return interaction.reply({
            content: `I don't have permission to send messages and embeds in ${channel}! Please give me the required permissions.`,
            flags: 64
        });
    }

    config[guildId].moderationLogChannel = channel.id;
    saveConfig(config);

    const embed = new EmbedBuilder()
        .setTitle(`${getRandomEmoji()} Moderation Logging Configured`)
        .setDescription(`Moderation logs will now be sent to ${channel}`)
        .addFields({
            name: 'Logged Actions',
            value: '• Bans/Unbans\n• Kicks\n• Mutes/Unmutes\n• Timeouts\n• Warnings\n• Role management\n• Message clears',
            inline: false
        })
        .setColor(getRandomColor())
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Send test message to the log channel
    const testEmbed = new EmbedBuilder()
        .setTitle(`${getRandomEmoji()} Moderation Logging Enabled`)
        .setDescription('This channel will now receive moderation logs.')
        .setColor(getRandomColor())
        .setTimestamp();

    await channel.send({ embeds: [testEmbed] });
}

async function handleView(interaction, config) {
    const guildId = interaction.guild.id;
    const guildConfig = config[guildId] || {};

    const generalChannel = guildConfig.generalLogChannel ? 
        interaction.guild.channels.cache.get(guildConfig.generalLogChannel) : null;
    const moderationChannel = guildConfig.moderationLogChannel ? 
        interaction.guild.channels.cache.get(guildConfig.moderationLogChannel) : null;

    const embed = new EmbedBuilder()
        .setTitle(`${getRandomEmoji()} Current Logging Configuration`)
        .setColor(getRandomColor())
        .addFields(
            {
                name: 'General Logs',
                value: generalChannel ? `${generalChannel}` : 'Not configured',
                inline: true
            },
            {
                name: 'Moderation Logs',
                value: moderationChannel ? `${moderationChannel}` : 'Not configured',
                inline: true
            }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleDisable(interaction, config) {
    const type = interaction.options.getString('type');
    const guildId = interaction.guild.id;

    if (!config[guildId]) {
        return interaction.reply({
            content: 'No logging configuration found to disable!',
            flags: 64
        });
    }

    let disabled = [];

    switch (type) {
        case 'general':
            if (config[guildId].generalLogChannel) {
                delete config[guildId].generalLogChannel;
                disabled.push('General logging');
            }
            break;
        case 'moderation':
            if (config[guildId].moderationLogChannel) {
                delete config[guildId].moderationLogChannel;
                disabled.push('Moderation logging');
            }
            break;
        case 'all':
            if (config[guildId].generalLogChannel) disabled.push('General logging');
            if (config[guildId].moderationLogChannel) disabled.push('Moderation logging');
            delete config[guildId].generalLogChannel;
            delete config[guildId].moderationLogChannel;
            break;
    }

    if (disabled.length === 0) {
        return interaction.reply({
            content: 'No logging was enabled for the specified type!',
            flags: 64
        });
    }

    saveConfig(config);

    await interaction.reply({
        content: `Disabled: ${disabled.join(', ')}`,
        flags: 64
    });
}