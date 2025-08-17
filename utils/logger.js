const fs = require('fs');
const path = require('path');

/**
 * Log moderation actions to console and optionally to file
 * @param {string} action - The type of action (BAN, KICK, etc.)
 * @param {User} moderator - The user who performed the action
 * @param {User} target - The target user (can be null for some actions)
 * @param {string} reason - The reason for the action
 * @param {Guild} guild - The guild where the action occurred
 */
function logAction(action, moderator, target, reason, guild) {
    const timestamp = new Date().toISOString();
    const targetInfo = target ? ` on ${target.tag} (${target.id})` : '';
    
    const logMessage = `[${timestamp}] [${guild.name}] ${action}: ${moderator.tag} (${moderator.id})${targetInfo} - ${reason}`;
    
    // Log to console with color coding
    const colors = {
        BAN: '\x1b[31m',      // Red
        KICK: '\x1b[33m',     // Yellow  
        MUTE: '\x1b[36m',     // Cyan
        TIMEOUT: '\x1b[35m',  // Magenta
        WARN: '\x1b[93m',     // Bright Yellow
        WARN_REMOVE: '\x1b[92m', // Bright Green
        WARN_CLEAR: '\x1b[92m',  // Bright Green
        CLEAR: '\x1b[34m',    // Blue
        ROLE_ADD: '\x1b[32m', // Green
        ROLE_REMOVE: '\x1b[91m', // Bright Red
        UNMUTE: '\x1b[32m',   // Green
        UNBAN: '\x1b[32m'     // Green
    };
    
    const resetColor = '\x1b[0m';
    const color = colors[action] || '\x1b[37m'; // Default to white
    
    console.log(`${color}📋 ${logMessage}${resetColor}`);
    
    // Optionally log to file (uncomment if you want file logging)
    /*
    try {
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `moderation-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
    */
}

/**
 * Log general bot events
 * @param {string} level - Log level (INFO, WARN, ERROR)
 * @param {string} message - The message to log
 * @param {Object} data - Additional data to log
 */
function logEvent(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    const colors = {
        INFO: '\x1b[32m',     // Green
        WARN: '\x1b[33m',     // Yellow
        ERROR: '\x1b[31m',    // Red
        DEBUG: '\x1b[90m'     // Gray
    };
    
    const resetColor = '\x1b[0m';
    const color = colors[level] || '\x1b[37m';
    
    let output = `${color}${logMessage}${resetColor}`;
    
    if (data) {
        output += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    console.log(output);
}

/**
 * Log command usage statistics
 * @param {string} commandName - Name of the command used
 * @param {User} user - User who used the command
 * @param {Guild} guild - Guild where command was used
 */
function logCommandUsage(commandName, user, guild) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [COMMAND] ${commandName} used by ${user.tag} (${user.id}) in ${guild.name} (${guild.id})`;
    
    console.log(`\x1b[36m⚡ ${logMessage}\x1b[0m`);
}

/**
 * Log errors with stack trace
 * @param {string} context - Context where error occurred
 * @param {Error} error - The error object
 * @param {Object} additionalInfo - Additional information about the error
 */
function logError(context, error, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    
    console.error(`\x1b[31m❌ [${timestamp}] [ERROR] ${context}\x1b[0m`);
    console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
    
    if (error.stack) {
        console.error(`\x1b[90mStack trace:\n${error.stack}\x1b[0m`);
    }
    
    if (Object.keys(additionalInfo).length > 0) {
        console.error(`\x1b[90mAdditional info:\x1b[0m`);
        console.error(additionalInfo);
    }
}

/**
 * Create a formatted log entry for audit purposes
 * @param {string} action - The action performed
 * @param {Object} details - Details about the action
 * @returns {string} - Formatted log entry
 */
function createAuditLog(action, details) {
    const timestamp = new Date().toISOString();
    
    return {
        timestamp,
        action,
        details,
        formatted: `[${timestamp}] ${action}: ${JSON.stringify(details)}`
    };
}

module.exports = {
    logAction,
    logEvent,
    logCommandUsage,
    logError,
    createAuditLog
};
