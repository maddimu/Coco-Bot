const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { getRandomColor, getRandomEmoji } = require('../utils/colorManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createrole')
        .setDescription('Create a new role')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the role')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Color of the role (hex code like #FF0000 or color name)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('mentionable')
                .setDescription('Whether the role can be mentioned')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('hoist')
                .setDescription('Whether the role should be displayed separately in member list')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for creating the role')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        await interaction.deferReply();
        const name = interaction.options.getString('name');
        const color = interaction.options.getString('color');
        const mentionable = interaction.options.getBoolean('mentionable') ?? false;
        const hoist = interaction.options.getBoolean('hoist') ?? false;
        const reason = interaction.options.getString('reason') || `Role created by ${interaction.user.tag}`;

        // Check if user has permission
        if (!checkPermissions(interaction.member, 'ManageRoles')) {
            return interaction.editReply({
                content: '❌ You do not have permission to manage roles!'
            });
        }

        // Check if bot has permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply({
                content: '❌ I do not have permission to manage roles in this server!'
            });
        }

        try {
            const roleOptions = {
                name: name,
                mentionable: mentionable,
                hoist: hoist,
                reason: reason
            };

            // Handle color
            if (color) {
                // Check if it's a hex color
                if (color.startsWith('#')) {
                    roleOptions.color = color;
                } else {
                    // Try to parse color name or just use it as is
                    const colorMap = {
                        'red': '#FF0000',
                        'blue': '#0000FF',
                        'green': '#00FF00',
                        'yellow': '#FFFF00',
                        'purple': '#800080',
                        'pink': '#FFC0CB',
                        'orange': '#FFA500',
                        'black': '#000000',
                        'white': '#FFFFFF',
                        'gray': '#808080',
                        'grey': '#808080'
                    };
                    
                    roleOptions.color = colorMap[color.toLowerCase()] || color;
                }
            }

            const role = await interaction.guild.roles.create(roleOptions);

            const embed = new EmbedBuilder()
                .setTitle(`${getRandomEmoji()} Role Created Successfully`)
                .setDescription(`Created role: ${role}`)
                .setColor(role.color || getRandomColor())
                .addFields(
                    {
                        name: 'Role Name',
                        value: role.name,
                        inline: true
                    },
                    {
                        name: 'Role ID',
                        value: role.id,
                        inline: true
                    },
                    {
                        name: 'Mentionable',
                        value: mentionable ? 'Yes' : 'No',
                        inline: true
                    },
                    {
                        name: 'Hoisted',
                        value: hoist ? 'Yes' : 'No',
                        inline: true
                    }
                )
                .setTimestamp();

            if (role.color) {
                embed.addFields({
                    name: 'Color',
                    value: `${role.hexColor}`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error creating role:', error);
            await interaction.editReply({
                content: '❌ An error occurred while creating the role. Please check the color format and try again.'
            });
        }
    },
};