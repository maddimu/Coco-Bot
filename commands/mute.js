const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user by removing their ability to send messages')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'ModerateMembers')) {
            return interaction.editReply({
                content: '❌ You do not have permission to mute members!'
            });
        }

        // Check if trying to mute themselves
        if (user.id === interaction.user.id) {
            return interaction.editReply({
                content: '❌ You cannot mute yourself!'
            });
        }

        // Check if trying to mute the bot
        if (user.id === interaction.client.user.id) {
            return interaction.editReply({
                content: '❌ I cannot mute myself!'
            });
        }

        try {
            // Get the member
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            if (!member) {
                return interaction.editReply({
                    content: '❌ User is not in this server!'
                });
            }

            // Check role hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
                return interaction.editReply({
                    content: '❌ You cannot mute a user with a role equal to or higher than yours!'
                });
            }

            // Check if user is already muted
            if (member.isCommunicationDisabled()) {
                return interaction.editReply({
                    content: '❌ This user is already muted!'
                });
            }

            // Find or create muted role
            let mutedRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
            
            if (!mutedRole) {
                // Create muted role if it doesn't exist
                mutedRole = await interaction.guild.roles.create({
                    name: 'Muted',
                    color: '#818386',
                    permissions: [],
                    reason: 'Muted role for moderation'
                });

                // Set up permissions for muted role in all channels
                const channels = interaction.guild.channels.cache;
                for (const channel of channels.values()) {
                    if (channel.isTextBased()) {
                        await channel.permissionOverwrites.edit(mutedRole, {
                            SendMessages: false,
                            AddReactions: false,
                            Speak: false
                        }).catch(e => console.error(`Error setting permissions for ${channel.name}:`, e));
                    }
                }
            }

            // Add muted role to user
            await member.roles.add(mutedRole, `${reason} | Muted by ${interaction.user.tag}`);

            // Reply with success
            await interaction.editReply({
                content: `✅ **${user.tag}** has been muted!\n**Reason:** ${reason}`
            });

        } catch (error) {
            console.error('Error muting user:', error);
            await interaction.editReply({
                content: '❌ Failed to mute the user. Please check my permissions and try again.'
            });
        }
    },
};
