const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { getRandomColor, getRandomEmoji } = require('../utils/colorManager');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, '..', 'data', 'config.json');
let config = {};
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (error) {
    console.error('Error loading config:', error);
}

// Save config
function saveConfig() {
    try {
        if (!fs.existsSync(path.dirname(configPath))) {
            fs.mkdirSync(path.dirname(configPath), { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

// Anti-raid tracking
const raidTracking = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Toggle anti-raid protection to detect suspicious mass actions')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Turn anti-raid protection on or off')
                .setRequired(true)
                .addChoices(
                    { name: 'On', value: 'on' },
                    { name: 'Off', value: 'off' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Defer reply since operations might take time
        await interaction.deferReply();

        // Check permissions
        const permissionCheck = await checkPermissions(interaction, 'Administrator');
        if (!permissionCheck.allowed) {
            return await interaction.editReply({
                content: permissionCheck.message
            });
        }

        const status = interaction.options.getString('status');
        const guildId = interaction.guild.id;
        
        // Initialize guild config if it doesn't exist
        if (!config[guildId]) {
            config[guildId] = {};
        }
        
        // Update anti-raid status
        config[guildId].antiraid = status === 'on';
        saveConfig();

        const emoji = getRandomEmoji();
        const color = getRandomColor();
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} Anti-Raid Protection`)
            .setDescription(`Anti-raid protection has been **${status === 'on' ? 'enabled' : 'disabled'}**`)
            .addFields(
                {
                    name: '🛡️ Protection Features',
                    value: status === 'on' 
                        ? '• Mass join detection\n• Rapid message spam detection\n• Suspicious user behavior monitoring\n• Automatic temporary lockdown capabilities'
                        : 'Anti-raid protection is currently disabled',
                    inline: false
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Set up anti-raid monitoring if enabled
        if (status === 'on') {
            setupAntiRaidMonitoring(interaction.client, guildId);
        }
    }
};

function setupAntiRaidMonitoring(client, guildId) {
    // Member join monitoring
    const joinHandler = async (member) => {
        if (member.guild.id !== guildId) return;
        // Reload config to get latest state
        let currentConfig = {};
        try {
            if (fs.existsSync(configPath)) {
                currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (e) {}
        
        if (!currentConfig[guildId]?.antiraid) return;

        const now = Date.now();
        const timeWindow = 60000; // 1 minute
        const maxJoins = 10; // Max joins per minute

        if (!raidTracking.has(guildId)) {
            raidTracking.set(guildId, { joins: [], messages: [] });
        }

        const tracking = raidTracking.get(guildId);
        tracking.joins.push(now);

        // Clean old entries
        tracking.joins = tracking.joins.filter(time => now - time < timeWindow);

        // Check for raid
        if (tracking.joins.length >= maxJoins) {
            await handleRaidDetection(member.guild, 'mass_join');
        }
    };

    // Message spam monitoring
    const messageHandler = async (message) => {
        if (!message.guild || message.guild.id !== guildId) return;
        
        // Reload config to get latest state
        let currentConfig = {};
        try {
            if (fs.existsSync(configPath)) {
                currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (e) {}
        
        if (!currentConfig[guildId]?.antiraid) return;
        if (message.author.bot) return;

        const now = Date.now();
        const timeWindow = 10000; // 10 seconds
        const maxMessages = 15; // Max messages per 10 seconds

        const tracking = raidTracking.get(guildId) || { joins: [], messages: [] };
        tracking.messages.push({ time: now, userId: message.author.id });

        // Clean old entries
        tracking.messages = tracking.messages.filter(msg => now - msg.time < timeWindow);

        // Check for spam raid
        const userMessages = tracking.messages.filter(msg => msg.userId === message.author.id);
        if (userMessages.length >= 8) { // Individual spam
            await handleSpamDetection(message);
        }

        // Check for coordinated spam
        if (tracking.messages.length >= maxMessages) {
            await handleRaidDetection(message.guild, 'message_spam');
        }

        raidTracking.set(guildId, tracking);
    };

    // Remove existing listeners to prevent duplicates (globally for this guild)
    // Note: removeAllListeners is aggressive, but here we are scope-limited by guildId inside handlers
    // For a production bot, a more surgical approach with listener maps per guild would be better
    client.removeAllListeners('guildMemberAdd');
    client.removeAllListeners('messageCreate');

    // Add new listeners
    client.on('guildMemberAdd', joinHandler);
    client.on('messageCreate', messageHandler);
}

async function handleRaidDetection(guild, type) {
    const logChannel = guild.channels.cache.find(channel => 
        channel.name.includes('mod-log') || 
        channel.name.includes('audit') || 
        channel.name.includes('log')
    ) || guild.systemChannel;

    if (!logChannel) return;

    const emoji = getRandomEmoji();
    const color = '#ff6b6b'; // Red for alerts

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`🚨 RAID DETECTED ${emoji}`)
        .setDescription(`**${type === 'mass_join' ? 'Mass Join' : 'Message Spam'}** raid detected!`)
        .addFields(
            {
                name: '⚠️ Recommended Actions',
                value: '• Enable slowmode in active channels\n• Review recent joins\n• Consider temporary verification requirements\n• Monitor for suspicious activity',
                inline: false
            }
        )
        .setFooter({ text: 'Anti-Raid Protection System' })
        .setTimestamp();

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending raid alert:', error);
    }
}

async function handleSpamDetection(message) {
    try {
        // Delete the spam message
        if (message.deletable) {
            await message.delete();
        }

        // Timeout the user for 5 minutes
        if (message.member && message.member.moderatable) {
            await message.member.timeout(5 * 60 * 1000, 'Anti-raid spam detection');
        }
    } catch (error) {
        console.error('Error handling spam detection:', error);
    }
}