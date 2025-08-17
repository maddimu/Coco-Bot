const { PermissionFlagsBits } = require('discord.js');

/**
 * Check if a member has the required permission
 * @param {GuildMember} member - The member to check
 * @param {string} permission - The permission to check for
 * @returns {boolean} - Whether the member has the permission
 */
function checkPermissions(member, permission) {
    // Server owner always has permissions
    if (member.guild.ownerId === member.id) {
        return true;
    }

    // Administrator permission overrides all other permissions
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    // Check specific permission
    const permissionMap = {
        'BanMembers': PermissionFlagsBits.BanMembers,
        'KickMembers': PermissionFlagsBits.KickMembers,
        'ModerateMembers': PermissionFlagsBits.ModerateMembers,
        'ManageMessages': PermissionFlagsBits.ManageMessages,
        'ManageRoles': PermissionFlagsBits.ManageRoles,
        'ManageChannels': PermissionFlagsBits.ManageChannels,
        'ViewAuditLog': PermissionFlagsBits.ViewAuditLog
    };

    const requiredPermission = permissionMap[permission];
    if (!requiredPermission) {
        console.warn(`Unknown permission: ${permission}`);
        return false;
    }

    return member.permissions.has(requiredPermission);
}

/**
 * Check if the bot has the required permission
 * @param {Guild} guild - The guild to check in
 * @param {string} permission - The permission to check for
 * @returns {boolean} - Whether the bot has the permission
 */
function checkBotPermissions(guild, permission) {
    const botMember = guild.members.me;
    if (!botMember) return false;

    return checkPermissions(botMember, permission);
}

/**
 * Get missing permissions for a member
 * @param {GuildMember} member - The member to check
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {string[]} - Array of missing permissions
 */
function getMissingPermissions(member, requiredPermissions) {
    const missing = [];
    
    for (const permission of requiredPermissions) {
        if (!checkPermissions(member, permission)) {
            missing.push(permission);
        }
    }
    
    return missing;
}

/**
 * Format permission names for user display
 * @param {string} permission - The permission to format
 * @returns {string} - Formatted permission name
 */
function formatPermissionName(permission) {
    const permissionNames = {
        'BanMembers': 'Ban Members',
        'KickMembers': 'Kick Members',
        'ModerateMembers': 'Moderate Members',
        'ManageMessages': 'Manage Messages',
        'ManageRoles': 'Manage Roles',
        'ManageChannels': 'Manage Channels',
        'ViewAuditLog': 'View Audit Log',
        'Administrator': 'Administrator'
    };

    return permissionNames[permission] || permission;
}

/**
 * Check if a member can moderate another member
 * @param {GuildMember} moderator - The member trying to moderate
 * @param {GuildMember} target - The member being moderated
 * @returns {boolean} - Whether moderation is allowed
 */
function canModerate(moderator, target) {
    // Cannot moderate yourself
    if (moderator.id === target.id) {
        return false;
    }

    // Server owner can moderate anyone except themselves
    if (moderator.guild.ownerId === moderator.id) {
        return true;
    }

    // Cannot moderate the server owner
    if (target.guild.ownerId === target.id) {
        return false;
    }

    // Check role hierarchy
    const moderatorHighestRole = moderator.roles.highest;
    const targetHighestRole = target.roles.highest;

    return moderatorHighestRole.position > targetHighestRole.position;
}

module.exports = {
    checkPermissions,
    checkBotPermissions,
    getMissingPermissions,
    formatPermissionName,
    canModerate
};
