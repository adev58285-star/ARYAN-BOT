const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
╔═════  *${settings.botName || 'ARYAN-BOT'}*  ╗
║   Version: *${settings.version || '1.0.0'}*
║   Owner: ${settings.botOwner || ''} 
║   YT : ${global.ytch}

┏━━♢ *General Commands* ♢
| .help or .menu\n| .ping\n| .alive\n| .tts <text>\n| .owner\n| .joke\n| .quote\n| .fact\n| .weather <city>\n| .news\n| .attp <text>\n| .lyrics <song_title>\n| .8ball <question>\n| .groupinfo\n| .staff or .admins\n| .vv\n| .trt <text> <lang>\n| .ss <link>\n| .jid\n| .url\n\n

┏━━♢ *Admin Commands* ♢
| .ban @user\n| .promote @user\n| .demote @user\n| .mute <minutes>\n| .unmute\n| .delete or .del\n| .kick @user\n| .warnings @user\n| .warn @user\n| .antilink\n| .antibadword\n| .clear\n| .tag <message>\n| .tagall\n| .tagnotadmin\n| .hidetag <message>\n| .chatbot\n| .resetlink\n| .antitag <on/off>\n| .welcome <on/off>\n| .goodbye <on/off>\n| .setgdesc <description>\n| .setgname <new name>\n| .setgpp (reply to image)\n\n

┏━━ ♢*Owner Commands♢
| .mode <public/private>\n| .clearsession\n| .antidelete\n| .cleartmp\n| .update\n| .settings\n| .setpp <reply to image>\n| .autoreact <on/off>\n| .autostatus <on/off>\n| .autostatus react <on/off>\n| .autotyping <on/off>\n| .autoread <on/off>\n| .anticall <on/off>\n| .pmblocker <on/off/status>\n| .pmblocker setmsg <text>\n| .setmention <reply to msg>\n| .mention <on/off>\n\n

┏━━ ♢ Image/Sticker ♢
| .blur <image>\n| .simage <reply to sticker>\n| .sticker <reply to image>\n| .removebg\n| .remini\n| .crop <reply to image>\n| .tgsticker <Link>\n| .meme\n| .take <packname>\n| .emojimix <emj1>+<emj2>\n| .igs <insta link>\n| .igsc <insta link>\n\n

┏━━♢ Pies Commands ♢
| .pies <country>\n| .china\n| .indonesia\n| .japan\n| .korea\n| .hijab\n\n

┏━━♢ *Game Commands* ♢
| .tictactoe @user\n| .hangman\n| .guess <letter>\n| .trivia\n| .answer <answer>\n| .truth\n| .dare\n\n

┏━━♢ *AI Commands* ♢
| .gpt <question>\n| .gemini <question>\n| .imagine <prompt>\n| .flux <prompt>\n| .sora <prompt>\n\n

┏━━♢ *Fun Commands* ♢
| .compliment @user\n| .insult @user\n| .flirt\n| .shayari\n| .goodnight\n| .roseday\n| .character @user\n| .wasted @user\n| .ship @user\n| .simp @user\n| .stupid @user [text]\n\n

┏━━♢ *Textmaker* ♢
| .metallic <text>\n| .ice <text>\n| .snow <text>\n| .impressive <text>\n| .matrix <text>\n| .light <text>\n| .neon <text>\n| .devil <text>\n| .purple <text>\n| .thunder <text>\n| .leaves <text>\n| .1917 <text>\n| .arena <text>\n| .hacker <text>\n| .sand <text>\n| .blackpink <text>\n| .glitch <text>\n| .fire <text>\n\n

┏━━♢ *Downloader* ♢
| .play <song_name>\n| .song <song_name>\n| .spotify <query>\n| .instagram <link>\n| .facebook <link>\n| .tiktok <link>\n| .video <song name>\n| .ytmp4 <Link>\n\n

┏━━♢ *MISC* ♢
| .heart\n| .horny\n| .circle\n| .lgbt\n| .lolice\n| .its-so-stupid\n| .namecard\n| .oogway\n| .tweet\n| .ytcomment\n| .comrade\n| .gay\n| .glass\n| .jail\n| .passed\n| .triggered\n\n

┏━━♢ *ANIME* ♢
| .nom\n| .poke\n| .cry\n| .kiss\n| .pat\n| .hug\n| .wink\n| .facepalm\n\n

 ┏━━♢ *Github Commands* ♢
| .git\n| .github\n| .sc\n| .script\n| .repo\n\n

`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '@newsletter',
                        newsletterName: 'MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '@newsletter',
                        newsletterName: '',
                        serverMessageId: -1
                    } 
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
