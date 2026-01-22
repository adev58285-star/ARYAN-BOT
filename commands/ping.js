const os = require('os');
const settings = require('../settings.js');

/**
 * Format uptime into human-readable string
 */
function formatTime(seconds) {
    const days = Math.floor(seconds / (86400)); // 24*60*60
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

/**
 * Ping command handler
 */
async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();

        // Send initial pong response
        await sock.sendMessage(chatId, { text: '🏓 Pong!' }, { quoted: message });

        const end = Date.now();
        const ping = end - start; // round-trip latency

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        const botInfo = [
            `🚀 Ping: ${ping} ms`,
            `⏱️ Uptime: ${uptimeFormatted}`,
            `💻 Host: ${os.hostname()}`
        ].join('\n');

        // Reply with bot info
        await sock.sendMessage(chatId, { text: botInfo }, { quoted: message });

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get bot status.' }, { quoted: message });
    }
}

module.exports = pingCommand;
