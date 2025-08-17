const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomColor, getRandomEmoji } = require('./colorManager');

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

// Get log channels for a guild
function getLogChannels(guild) {
    const config = loadConfig();
    const guildConfig = config[guild.id] || {};
    
    return {
        general: guildConfig.generalLogChannel ? guild.channels.cache.get(guildConfig.generalLogChannel) : null,
        moderation: guildConfig.moderationLogChannel ? guild.channels.cache.get(guildConfig.moderationLogChannel) : null
    };
}

// Send general log
async function sendGeneralLog(guild, embed) {
    const channels = getLogChannels(guild);
    if (channels.general) {
        try {
            await channels.general.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending general log:', error);
        }
    }
}

// Send moderation log
async function sendModerationLog(guild, embed) {
    const channels = getLogChannels(guild);
    if (channels.moderation) {
        try {
            await channels.moderation.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending moderation log:', error);
        }
    }
}

// Create moderation log embed
function createModerationLog(action, moderator, target, reason, additionalInfo = {}) {
    const embed = new EmbedBuilder()
        .setColor(getRandomColor())
        .setTimestamp()
        .setFooter({ text: `Moderator ID: ${moderator.id}` });

    const emoji = getRandomEmoji();
    embed.setTitle(`${emoji} ${action.replace('_', ' ').toUpperCase()}`);

    if (target) {
        embed.setThumbnail(target.displayAvatarURL());
        embed.addFields({
            name: 'Target User',
            value: `${target.tag} (${target.id})`,
            inline: true
        });
    }

    embed.addFields({
        name: 'Moderator',
        value: `${moderator.tag} (${moderator.id})`,
        inline: true
    });

    if (reason) {
        embed.addFields({
            name: 'Reason',
            value: reason,
            inline: false
        });
    }

    // Add additional info
    if (additionalInfo.duration) {
        embed.addFields({
            name: 'Duration',
            value: additionalInfo.duration,
            inline: true
        });
    }

    if (additionalInfo.role) {
        embed.addFields({
            name: 'Role',
            value: additionalInfo.role,
            inline: true
        });
    }

    if (additionalInfo.messageCount) {
        embed.addFields({
            name: 'Messages Deleted',
            value: additionalInfo.messageCount.toString(),
            inline: true
        });
    }

    return embed;
}

// Create general log embed
function createGeneralLog(title, description, fields = [], color = null) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color || getRandomColor())
        .setTimestamp();

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    return embed;
}

// Log member join
async function logMemberJoin(member) {
    const embed = createGeneralLog(
        `${getRandomEmoji()} Member Joined`,
        `${member.user.tag} joined the server`,
        [
            { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
        ]
    );

    if (member.user.avatarURL()) {
        embed.setThumbnail(member.user.avatarURL());
    }

    await sendGeneralLog(member.guild, embed);
}

// Log member leave
async function logMemberLeave(member) {
    const embed = createGeneralLog(
        `${getRandomEmoji()} Member Left`,
        `${member.user.tag} left the server`,
        [
            { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: 'Joined', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
        ]
    );

    if (member.user.avatarURL()) {
        embed.setThumbnail(member.user.avatarURL());
    }

    await sendGeneralLog(member.guild, embed);
}

// Log role update
async function logMemberRoleUpdate(oldMember, newMember) {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    let description = '';
    const fields = [];

    if (addedRoles.size > 0) {
        fields.push({
            name: '➕ Roles Added',
            value: addedRoles.map(role => role.name).join(', '),
            inline: false
        });
    }

    if (removedRoles.size > 0) {
        fields.push({
            name: '➖ Roles Removed', 
            value: removedRoles.map(role => role.name).join(', '),
            inline: false
        });
    }

    const embed = createGeneralLog(
        `${getRandomEmoji()} Member Role Update`,
        `${newMember.user.tag}'s roles were updated`,
        [
            { name: 'User', value: `${newMember.user.tag} (${newMember.user.id})`, inline: true },
            ...fields
        ]
    );

    if (newMember.user.avatarURL()) {
        embed.setThumbnail(newMember.user.avatarURL());
    }

    await sendGeneralLog(newMember.guild, embed);
}

// Log message delete
async function logMessageDelete(message) {
    if (message.author.bot) return; // Don't log bot messages

    const embed = createGeneralLog(
        `${getRandomEmoji()} Message Deleted`,
        `Message by ${message.author.tag} was deleted`,
        [
            { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Channel', value: `${message.channel}`, inline: true },
            { name: 'Content', value: message.content ? (message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content) : '*No text content*', inline: false }
        ]
    );

    if (message.attachments.size > 0) {
        embed.addFields({
            name: 'Attachments',
            value: message.attachments.map(att => att.name).join(', '),
            inline: false
        });
    }

    await sendGeneralLog(message.guild, embed);
}

// Log message edit
async function logMessageEdit(oldMessage, newMessage) {
    if (newMessage.author.bot) return; // Don't log bot messages
    if (oldMessage.content === newMessage.content) return; // No content change

    const embed = createGeneralLog(
        `${getRandomEmoji()} Message Edited`,
        `Message by ${newMessage.author.tag} was edited`,
        [
            { name: 'Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
            { name: 'Channel', value: `${newMessage.channel}`, inline: true },
            { name: 'Before', value: oldMessage.content ? (oldMessage.content.length > 512 ? oldMessage.content.substring(0, 509) + '...' : oldMessage.content) : '*No text content*', inline: false },
            { name: 'After', value: newMessage.content ? (newMessage.content.length > 512 ? newMessage.content.substring(0, 509) + '...' : newMessage.content) : '*No text content*', inline: false },
            { name: 'Jump to Message', value: `[Click here](${newMessage.url})`, inline: false }
        ]
    );

    await sendGeneralLog(newMessage.guild, embed);
}

// Log nickname change
async function logNicknameUpdate(oldMember, newMember) {
    if (oldMember.nickname === newMember.nickname) return;

    const embed = createGeneralLog(
        `${getRandomEmoji()} Nickname Changed`,
        `${newMember.user.tag}'s nickname was updated`,
        [
            { name: 'User', value: `${newMember.user.tag} (${newMember.user.id})`, inline: true },
            { name: 'Before', value: oldMember.nickname || 'None', inline: true },
            { name: 'After', value: newMember.nickname || 'None', inline: true }
        ]
    );

    if (newMember.user.avatarURL()) {
        embed.setThumbnail(newMember.user.avatarURL());
    }

    await sendGeneralLog(newMember.guild, embed);
}

// Log channel events
async function logChannelCreate(channel) {
    const embed = createGeneralLog(
        `${getRandomEmoji()} Channel Created`,
        `New channel created: ${channel.name}`,
        [
            { name: 'Channel', value: `${channel} (${channel.id})`, inline: true },
            { name: 'Type', value: channel.type.toString(), inline: true }
        ]
    );

    await sendGeneralLog(channel.guild, embed);
}

async function logChannelDelete(channel) {
    const embed = createGeneralLog(
        `${getRandomEmoji()} Channel Deleted`,
        `Channel deleted: ${channel.name}`,
        [
            { name: 'Name', value: channel.name, inline: true },
            { name: 'Type', value: channel.type.toString(), inline: true },
            { name: 'ID', value: channel.id, inline: true }
        ]
    );

    await sendGeneralLog(channel.guild, embed);
}

// Log voice state changes
async function logVoiceStateUpdate(oldState, newState) {
    const member = newState.member;
    
    // Joined voice channel
    if (!oldState.channel && newState.channel) {
        const embed = createGeneralLog(
            `${getRandomEmoji()} Voice Channel Join`,
            `${member.user.tag} joined a voice channel`,
            [
                { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
                { name: 'Channel', value: newState.channel.name, inline: true }
            ]
        );
        await sendGeneralLog(member.guild, embed);
    }
    // Left voice channel
    else if (oldState.channel && !newState.channel) {
        const embed = createGeneralLog(
            `${getRandomEmoji()} Voice Channel Leave`,
            `${member.user.tag} left a voice channel`,
            [
                { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
                { name: 'Channel', value: oldState.channel.name, inline: true }
            ]
        );
        await sendGeneralLog(member.guild, embed);
    }
    // Moved between channels
    else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        const embed = createGeneralLog(
            `${getRandomEmoji()} Voice Channel Move`,
            `${member.user.tag} moved between voice channels`,
            [
                { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
                { name: 'From', value: oldState.channel.name, inline: true },
                { name: 'To', value: newState.channel.name, inline: true }
            ]
        );
        await sendGeneralLog(member.guild, embed);
    }
}

module.exports = {
    sendGeneralLog,
    sendModerationLog,
    createModerationLog,
    createGeneralLog,
    logMemberJoin,
    logMemberLeave,
    logMemberRoleUpdate,
    logMessageDelete,
    logMessageEdit,
    logNicknameUpdate,
    logChannelCreate,
    logChannelDelete,
    logVoiceStateUpdate
};