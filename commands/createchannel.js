const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { getRandomColor, getRandomEmoji } = require('../utils/colorManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createchannel')
        .setDescription('Create a new channel')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the channel')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of channel')
                .setRequired(true)
                .addChoices(
                    { name: 'Text Channel', value: 'text' },
                    { name: 'Voice Channel', value: 'voice' },
                    { name: 'Category', value: 'category' },
                    { name: 'Forum', value: 'forum' },
                    { name: 'Announcement', value: 'announcement' }
                ))
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('Category to place the channel in')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Channel description/topic')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply();
        const name = interaction.options.getString('name');
        const type = interaction.options.getString('type');
        const category = interaction.options.getChannel('category');
        const description = interaction.options.getString('description');

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

        try {
            let channelType;
            switch (type) {
                case 'text':
                    channelType = ChannelType.GuildText;
                    break;
                case 'voice':
                    channelType = ChannelType.GuildVoice;
                    break;
                case 'category':
                    channelType = ChannelType.GuildCategory;
                    break;
                case 'forum':
                    channelType = ChannelType.GuildForum;
                    break;
                case 'announcement':
                    channelType = ChannelType.GuildAnnouncement;
                    break;
            }

            const channelOptions = {
                name: name,
                type: channelType,
                parent: category ? category.id : null
            };

            if (description && (type === 'text' || type === 'announcement' || type === 'forum')) {
                channelOptions.topic = description;
            }

            const channel = await interaction.guild.channels.create(channelOptions);

            const embed = new EmbedBuilder()
                .setTitle(`${getRandomEmoji()} Channel Created Successfully`)
                .setDescription(`Created ${type} channel: ${channel}`)
                .setColor(getRandomColor())
                .addFields(
                    {
                        name: 'Channel Name',
                        value: channel.name,
                        inline: true
                    },
                    {
                        name: 'Channel Type',
                        value: type.charAt(0).toUpperCase() + type.slice(1),
                        inline: true
                    }
                )
                .setTimestamp();

            if (category) {
                embed.addFields({
                    name: 'Category',
                    value: category.name,
                    inline: true
                });
            }

            if (description) {
                embed.addFields({
                    name: 'Description',
                    value: description,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error creating channel:', error);
            await interaction.editReply({
                content: '❌ An error occurred while creating the channel. Please try again.'
            });
        }
    },
};