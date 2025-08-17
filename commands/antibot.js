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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antibot')
        .setDescription('Toggle anti-bot protection to prevent unauthorized bots from joining')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Turn anti-bot protection on or off')
                .setRequired(true)
                .addChoices(
                    { name: 'On', value: 'on' },
                    { name: 'Off', value: 'off' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check permissions
        const permissionCheck = await checkPermissions(interaction, 'Administrator');
        if (!permissionCheck.allowed) {
            return await interaction.reply({
                content: permissionCheck.message,
                ephemeral: true
            });
        }

        const status = interaction.options.getString('status');
        const guildId = interaction.guild.id;
        
        // Initialize guild config if it doesn't exist
        if (!config[guildId]) {
            config[guildId] = {};
        }
        
        // Update anti-bot status
        config[guildId].antibot = status === 'on';
        saveConfig();

        const emoji = getRandomEmoji();
        const color = getRandomColor();
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} Anti-Bot Protection`)
            .setDescription(`Anti-bot protection has been **${status === 'on' ? 'enabled' : 'disabled'}**`)
            .addFields(
                {
                    name: '🤖 Protection Features',
                    value: status === 'on' 
                        ? '• Automatic bot detection\n• Unauthorized bot removal\n• Bot join notifications\n• Whitelist system for approved bots'
                        : 'Anti-bot protection is currently disabled',
                    inline: false
                },
                {
                    name: '📋 How it Works',
                    value: status === 'on'
                        ? 'New bots will be automatically kicked unless they have Administrator permissions or are whitelisted'
                        : 'All bots can join freely when protection is disabled',
                    inline: false
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Set up anti-bot monitoring if enabled
        if (status === 'on') {
            setupAntiBotMonitoring(interaction.client, guildId);
        }
    }
};

function setupAntiBotMonitoring(client, guildId) {
    // Bot join monitoring
    const botJoinHandler = async (member) => {
        if (member.guild.id !== guildId) return;
        if (!config[guildId]?.antibot) return;
        if (!member.user.bot) return;

        // Allow bots with Administrator permissions
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            await logBotJoin(member, 'ALLOWED - Administrator permissions');
            return;
        }

        // Check if bot is whitelisted (you can expand this with a whitelist system)
        const whitelistedBots = [
            client.user.id, // This moderation bot
            // Add more whitelisted bot IDs here as needed
        ];

        if (whitelistedBots.includes(member.user.id)) {
            await logBotJoin(member, 'ALLOWED - Whitelisted');
            return;
        }

        // Kick unauthorized bot
        try {
            await member.kick('Anti-bot protection: Unauthorized bot');
            await logBotJoin(member, 'KICKED - Unauthorized bot');
        } catch (error) {
            console.error('Error kicking bot:', error);
            await logBotJoin(member, 'FAILED TO KICK - Check bot permissions');
        }
    };

    // Remove existing listener to prevent duplicates
    client.removeAllListeners('guildMemberAdd');
    
    // Add new listener
    client.on('guildMemberAdd', botJoinHandler);
}

async function logBotJoin(member, action) {
    const guild = member.guild;
    const logChannel = guild.channels.cache.find(channel => 
        channel.name.includes('mod-log') || 
        channel.name.includes('audit') || 
        channel.name.includes('log')
    ) || guild.systemChannel;

    if (!logChannel) return;

    const emoji = getRandomEmoji();
    const color = action.includes('KICKED') ? '#ff6b6b' : 
                 action.includes('ALLOWED') ? '#51cf66' : getRandomColor();

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`🤖 Bot Detection ${emoji}`)
        .setDescription(`**${member.user.tag}** (${member.user.id})`)
        .addFields(
            {
                name: '⚡ Action Taken',
                value: action,
                inline: true
            },
            {
                name: '🕒 Time',
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true
            },
            {
                name: '📊 Bot Info',
                value: `**Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**Avatar:** ${member.user.displayAvatarURL() ? 'Yes' : 'No'}`,
                inline: false
            }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: 'Anti-Bot Protection System' })
        .setTimestamp();

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending bot log:', error);
    }
}