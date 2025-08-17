const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage user roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for adding the role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for removing the role')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'ManageRoles')) {
            return interaction.reply({
                content: '❌ You do not have permission to manage roles!',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if trying to modify themselves
        if (user.id === interaction.user.id && subcommand === 'add') {
            return interaction.reply({
                content: '❌ You cannot add roles to yourself!',
                ephemeral: true
            });
        }

        // Check if trying to modify the bot
        if (user.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ You cannot modify my roles!',
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

            // Check role hierarchy - user cannot assign roles higher than their highest role
            if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot manage a role that is equal to or higher than your highest role!',
                    ephemeral: true
                });
            }

            // Check if bot can manage the role
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: '❌ I cannot manage this role! It is equal to or higher than my highest role.',
                    ephemeral: true
                });
            }

            // Check if role is managed by an integration
            if (role.managed) {
                return interaction.reply({
                    content: '❌ I cannot manage this role as it is managed by an integration (bot role, boost role, etc.)!',
                    ephemeral: true
                });
            }

            // Check if role is @everyone
            if (role.id === interaction.guild.id) {
                return interaction.reply({
                    content: '❌ I cannot manage the @everyone role!',
                    ephemeral: true
                });
            }

            if (subcommand === 'add') {
                // Check if user already has the role
                if (member.roles.cache.has(role.id)) {
                    return interaction.reply({
                        content: `❌ **${user.tag}** already has the **${role.name}** role!`,
                        ephemeral: true
                    });
                }

                // Add the role
                await member.roles.add(role, `${reason} | Added by ${interaction.user.tag}`);

                // Log the action
                logAction('ROLE_ADD', interaction.user, user, reason, interaction.guild, { role: role.name });

                await interaction.reply({
                    content: `✅ Added the **${role.name}** role to **${user.tag}**!\n**Reason:** ${reason}`,
                    ephemeral: false
                });

            } else if (subcommand === 'remove') {
                // Check if user has the role
                if (!member.roles.cache.has(role.id)) {
                    return interaction.reply({
                        content: `❌ **${user.tag}** does not have the **${role.name}** role!`,
                        ephemeral: true
                    });
                }

                // Remove the role
                await member.roles.remove(role, `${reason} | Removed by ${interaction.user.tag}`);

                // Log the action
                logAction('ROLE_REMOVE', interaction.user, user, reason, interaction.guild, { role: role.name });

                await interaction.reply({
                    content: `✅ Removed the **${role.name}** role from **${user.tag}**!\n**Reason:** ${reason}`,
                    ephemeral: false
                });
            }

        } catch (error) {
            console.error('Error managing role:', error);
            
            let errorMessage = '❌ Failed to manage the role. ';
            
            if (error.code === 50013) {
                errorMessage += 'I do not have permission to manage roles.';
            } else if (error.code === 50025) {
                errorMessage += 'Invalid OAuth2 access token.';
            } else {
                errorMessage += 'Please check my permissions and role hierarchy.';
            }

            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    },
};
