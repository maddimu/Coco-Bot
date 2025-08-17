// Color palette and emoji collections
const colors = ['#ffc0c9', '#bcf0f3', '#d7fdff', '#fff9c3'];
const emojis = ['🍬', '🍡', '🍥', '🪷', '⭐️', '☀️', '🌈', '🍒', '🍭', '🍧', '🎨', '🧸', '🎀'];

/**
 * Get a random color from the palette
 * @returns {string} Random hex color
 */
function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get a random emoji from the collection
 * @returns {string} Random emoji
 */
function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * Get multiple random emojis
 * @param {number} count - Number of emojis to get
 * @returns {string[]} Array of random emojis
 */
function getRandomEmojis(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(getRandomEmoji());
    }
    return result;
}

module.exports = {
    getRandomColor,
    getRandomEmoji,
    getRandomEmojis
};