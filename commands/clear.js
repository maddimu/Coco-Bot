const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete multiple messages at once')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for clearing messages')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'ManageMessages')) {
            return interaction.reply({
                content: '❌ You do not have permission to manage messages!',
                ephemeral: true
            });
        }

        // Check if bot can delete messages
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: '❌ I do not have permission to manage messages in this server!',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch messages
            let messages = await interaction.channel.messages.fetch({ 
                limit: targetUser ? Math.min(amount * 3, 100) : amount 
            });

            // Filter messages if targeting specific user
            if (targetUser) {
                messages = messages.filter(msg => msg.author.id === targetUser.id);
                messages = messages.first(amount);
            }

            // Filter out messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const messagesArray = Array.from(messages.values());
            const recentMessages = messagesArray.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = messagesArray.length - recentMessages.length;

            if (recentMessages.length === 0) {
                return interaction.editReply({
                    content: '❌ No messages found to delete! Messages older than 14 days cannot be bulk deleted.'
                });
            }

            // Delete messages
            let deletedCount = 0;
            
            if (recentMessages.length === 1) {
                // Delete single message
                await recentMessages[0].delete();
                deletedCount = 1;
            } else {
                // Bulk delete
                const deleted = await interaction.channel.bulkDelete(recentMessages, true);
                deletedCount = deleted.size;
            }

            // Log the action
            const logMessage = targetUser 
                ? `Cleared ${deletedCount} messages from ${targetUser.tag}`
                : `Cleared ${deletedCount} messages`;
            


            // Create response message
            let responseMessage = `✅ Successfully deleted **${deletedCount}** message${deletedCount !== 1 ? 's' : ''}`;
            
            if (targetUser) {
                responseMessage += ` from **${targetUser.tag}**`;
            }
            
            if (oldMessages > 0) {
                responseMessage += `\n⚠️ ${oldMessages} message${oldMessages !== 1 ? 's' : ''} ${oldMessages !== 1 ? 'were' : 'was'} older than 14 days and could not be deleted.`;
            }
            
            responseMessage += `\n**Reason:** ${reason}`;

            await interaction.editReply({
                content: responseMessage
            });

            // Send a temporary confirmation message in the channel
            const confirmMessage = await interaction.followUp({
                content: `🗑️ **${deletedCount}** message${deletedCount !== 1 ? 's' : ''} deleted by ${interaction.user}`,
                ephemeral: false
            });

            // Delete the confirmation message after 5 seconds
            setTimeout(async () => {
                try {
                    await confirmMessage.delete();
                } catch (error) {
                    // Message might already be deleted, ignore error
                }
            }, 5000);

        } catch (error) {
            console.error('Error clearing messages:', error);
            
            let errorMessage = '❌ Failed to delete messages. ';
            
            if (error.code === 50013) {
                errorMessage += 'I do not have permission to manage messages in this channel.';
            } else if (error.code === 50034) {
                errorMessage += 'Messages are too old to delete (older than 14 days).';
            } else {
                errorMessage += 'Please check my permissions and try again.';
            }

            await interaction.editReply({
                content: errorMessage
            });
        }
    },
};
