const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'KickMembers')) {
            return interaction.reply({
                content: '❌ You do not have permission to kick members!',
                ephemeral: true
            });
        }

        // Check if trying to kick themselves
        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot kick yourself!',
                ephemeral: true
            });
        }

        // Check if trying to kick the bot
        if (user.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot kick myself!',
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
                    content: '❌ You cannot kick a user with a role equal to or higher than yours!',
                    ephemeral: true
                });
            }

            if (!member.kickable) {
                return interaction.reply({
                    content: '❌ I cannot kick this user! They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Kick the user
            await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

            // Log the action
            logAction('KICK', interaction.user, user, reason, interaction.guild);

            // Reply with success
            await interaction.reply({
                content: `✅ **${user.tag}** has been kicked!\n**Reason:** ${reason}`,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.reply({
                content: '❌ Failed to kick the user. They may not be in the server or I lack permissions.',
                ephemeral: true
            });
        }
    },
};
