const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

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
        await interaction.deferReply();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'KickMembers')) {
            return interaction.editReply({
                content: '❌ You do not have permission to kick members!'
            });
        }

        // Check if trying to kick themselves
        if (user.id === interaction.user.id) {
            return interaction.editReply({
                content: '❌ You cannot kick yourself!'
            });
        }

        // Check if trying to kick the bot
        if (user.id === interaction.client.user.id) {
            return interaction.editReply({
                content: '❌ I cannot kick myself!'
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
                    content: '❌ You cannot kick a user with a role equal to or higher than yours!'
                });
            }

            if (!member.kickable) {
                return interaction.editReply({
                    content: '❌ I cannot kick this user! They may have higher permissions than me.'
                });
            }

            // Kick the user
            await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

            // Reply with success
            await interaction.editReply({
                content: `✅ **${user.tag}** has been kicked!\n**Reason:** ${reason}`
            });

        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.editReply({
                content: '❌ Failed to kick the user. They may not be in the server or I lack permissions.'
            });
        }
    },
};
