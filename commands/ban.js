const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_messages')
                .setDescription('Delete messages from the last X days (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'BanMembers')) {
            return interaction.editReply({
                content: '❌ You do not have permission to ban members!'
            });
        }

        // Check if trying to ban themselves
        if (user.id === interaction.user.id) {
            return interaction.editReply({
                content: '❌ You cannot ban yourself!'
            });
        }

        // Check if trying to ban the bot
        if (user.id === interaction.client.user.id) {
            return interaction.editReply({
                content: '❌ I cannot ban myself!'
            });
        }

        try {
            // Try to get the member
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            // Check role hierarchy if member exists
            if (member) {
                if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
                    return interaction.editReply({
                        content: '❌ You cannot ban a user with a role equal to or higher than yours!'
                    });
                }

                if (!member.bannable) {
                    return interaction.editReply({
                        content: '❌ I cannot ban this user! They may have higher permissions than me.'
                    });
                }
            }

            // Ban the user
            await interaction.guild.members.ban(user, {
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageDays: deleteMessageDays
            });

            // Reply with success
            await interaction.editReply({
                content: `✅ **${user.tag}** has been banned!\n**Reason:** ${reason}`
            });

        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.editReply({
                content: '❌ Failed to ban the user. Please check my permissions and try again.'
            });
        }
    },
};
