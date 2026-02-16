const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { getRandomColor, getRandomEmoji } = require('../utils/colorManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('managechannel')
        .setDescription('Manage server channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to delete')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for deletion')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('New name for the channel')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('New description/topic for the channel')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('New category for the channel')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'ManageChannels')) {
            return interaction.editReply({
                content: '❌ You do not have permission to manage channels!'
            });
        }

        // Check if bot has permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.editReply({
                content: '❌ I do not have permission to manage channels in this server!'
            });
        }

        switch (subcommand) {
            case 'delete':
                await handleDeleteChannel(interaction);
                break;
            case 'edit':
                await handleEditChannel(interaction);
                break;
        }
    },
};

// Handle channel deletion
async function handleDeleteChannel(interaction) {
    const channel = interaction.options.getChannel('channel');
    const reason = interaction.options.getString('reason') || `Channel deleted by ${interaction.user.tag}`;

    try {
        const channelName = channel.name;

        await channel.delete(reason);

        const embed = new EmbedBuilder()
            .setTitle(`${getRandomEmoji()} Channel Deleted`)
            .setDescription(`Successfully deleted channel: **${channelName}**`)
            .setColor(getRandomColor())
            .addFields({
                name: 'Reason',
                value: reason,
                inline: false
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error deleting channel:', error);
        await interaction.editReply({
            content: '❌ An error occurred while deleting the channel. I may not have permission to delete this channel.'
        });
    }
}

// Handle channel editing
async function handleEditChannel(interaction) {
    const channel = interaction.options.getChannel('channel');
    const newName = interaction.options.getString('name');
    const newDescription = interaction.options.getString('description');
    const newCategory = interaction.options.getChannel('category');

    if (!newName && !newDescription && !newCategory) {
        return interaction.editReply({
            content: '❌ You must specify at least one thing to change!'
        });
    }

    try {
        const updates = {};
        
        if (newName) updates.name = newName;
        if (newDescription && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)) {
            updates.topic = newDescription;
        }
        if (newCategory) updates.parent = newCategory.id;

        await channel.edit(updates);

        const embed = new EmbedBuilder()
            .setTitle(`${getRandomEmoji()} Channel Updated`)
            .setDescription(`Successfully updated ${channel}`)
            .setColor(getRandomColor())
            .setTimestamp();

        const fields = [];
        if (newName) fields.push({ name: 'New Name', value: newName, inline: true });
        if (newDescription) fields.push({ name: 'New Description', value: newDescription, inline: false });
        if (newCategory) fields.push({ name: 'New Category', value: newCategory.name, inline: true });

        embed.addFields(fields);

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error editing channel:', error);
        await interaction.editReply({
            content: '❌ An error occurred while editing the channel. Please check your permissions and try again.'
        });
    }
}