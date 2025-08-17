const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (max 40320 - 28 days)')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'ModerateMembers')) {
            return interaction.reply({
                content: '❌ You do not have permission to timeout members!',
                ephemeral: true
            });
        }

        // Check if trying to timeout themselves
        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot timeout yourself!',
                ephemeral: true
            });
        }

        // Check if trying to timeout the bot
        if (user.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot timeout myself!',
                ephemeral: true
            });
        }

        try {
            // Get the member
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member) {
                return interaction.reply({
                    content: '❌ User is not in this server!',
                    ephemeral: true
                });
            }

            // Check role hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: '❌ You cannot timeout a user with a role equal to or higher than yours!',
                    ephemeral: true
                });
            }

            // Check if user is already timed out
            if (member.isCommunicationDisabled()) {
                return interaction.reply({
                    content: '❌ This user is already timed out!',
                    ephemeral: true
                });
            }

            // Calculate timeout duration
            const timeoutDuration = duration * 60 * 1000; // Convert minutes to milliseconds
            const timeoutUntil = new Date(Date.now() + timeoutDuration);

            // Timeout the user
            await member.timeout(timeoutDuration, `${reason} | Timed out by ${interaction.user.tag}`);

            // Format duration for display and logging
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            let durationText = '';
            if (hours > 0) {
                durationText += `${hours} hour${hours !== 1 ? 's' : ''}`;
                if (minutes > 0) durationText += ` and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else {
                durationText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }

            // Log the action


            // Reply with success
            await interaction.reply({
                content: `✅ **${user.tag}** has been timed out for **${durationText}**!\n**Reason:** ${reason}\n**Timeout expires:** <t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>`,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error timing out user:', error);
            await interaction.reply({
                content: '❌ Failed to timeout the user. Please check my permissions and try again.',
                ephemeral: true
            });
        }
    },
};
