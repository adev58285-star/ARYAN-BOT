//JUNE//
//Terrivez
//supremeLord


require('./setting/settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { 
    default: makeWASocket,
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Create a store object with required methods
const store = {
    messages: {},
    contacts: {},
    chats: {},
    groupMetadata: async (jid) => {
        return {}
    },
    bind: function(ev) {
        // Handle events
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key && msg.key.remoteJid) {
                    this.messages[msg.key.remoteJid] = this.messages[msg.key.remoteJid] || {}
                    this.messages[msg.key.remoteJid][msg.key.id] = msg
                }
            })
        })
        
        ev.on('contacts.update', (contacts) => {
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = contact
                }
            })
        })
        
        ev.on('chats.set', (chats) => {
            this.chats = chats
        })
    },
    loadMessage: async (jid, id) => {
        return this.messages[jid]?.[id] || null
    }
}

let phoneNumber = "254792021944"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "𝐉ᴜɴᴇ 𝐌ᴅ"
global.themeemoji = "•"
global.statusview = true

const settings = require('./setting/settings')
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

async function downloadSessionData() {
  try {

    await fs.promises.mkdir(sessionDir, { recursive: true });

    if (!fs.existsSync(credsPath)) {
      if (!global.SESSION_ID) {
        return console.log(color(`Session id not found at SESSION_ID!\nCreds.json not found at session folder!\n\nWait to enter your number`, 'red'));
      }

      const base64Data = global.SESSION_ID.split("trashcore~")[1];
      
      const sessionData = Buffer.from(base64Data, 'base64');
      
        await fs.promises.writeFile(credsPath, sessionData);
      console.log(`Session successfully saved, please wait!!`);
      await startconn();
    }
  } catch (error) {
    console.error('Error downloading session data:', error);
  }
}

async function startconn() {
let { version, isLatest } = await fetchLatestBaileysVersion()
const {  state, saveCreds } =await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache() // for retry message, "waiting message"
    const conn = makeWASocket({
        version: [2, 3000, 1023223821],
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode, // popping up QR in terminal log
      mobile: useMobile, // mobile api (prone to bans)
      browser: [ "Ubuntu", "Chrome", "20.0.04" ], // for this issues https://github.com/WhiskeySockets/Baileys/issues/328
     auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      markOnlineOnConnect: true, // set false for offline
      generateHighQualityLinkPreview: true, // make high preview link
      getMessage: async (key) => {
         let jid = jidNormalizedUser(key.remoteJid)
         let msg = await store.loadMessage(jid, key.id)

         return msg?.message || ""
      },
      msgRetryCounterCache, // Resolve waiting messages
      defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/Baileys/issues/276
   })
   
   store.bind(conn.ev)
 
        
             

    conn.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(conn, chatUpdate);
                return;
            }
            if (!conn.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            
            try {
                await handleMessages(conn, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                if (mek.key && mek.key.remoteJid) {
                    await conn.sendMessage(mek.key.remoteJid, { 
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: false,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '@newsletter',
                                newsletterName: '𝐉ᴜɴᴇ 𝐌ᴅ',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    conn.ev.on('messages.upsert', async chatUpdate => {
        if (global.statusview){
            try {
                if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
                const mek = chatUpdate.messages[0];

                if (!mek.message) return;
                mek.message =
                    Object.keys(mek.message)[0] === 'ephemeralMessage'
                        ? mek.message.ephemeralMessage.message
                        : mek.message;

                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    let emoji = [ "💙","❤️","💓","⭐","👍","😘","🤍","🖤" ];
                    let sigma = emoji[Math.floor(Math.random() * emoji.length)];
                    await conn.readMessages([mek.key]);
                    conn.sendMessage(
                        'status@broadcast',
                        { react: { text: sigma, key: mek.key } },
                        { statusJidList: [mek.key.participant] },
                    );
                }
            } catch (err) {
                console.error(err);
            }
        }
    });

    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    conn.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = conn.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    conn.getName = (jid, withoutContact = false) => {
        id = conn.decodeJid(jid)
        withoutContact = conn.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = conn.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === conn.decodeJid(conn.user.id) ?
            conn.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    conn.public = true

    conn.serializeM = (m) => smsg(conn, m, store)

    if (pairingCode && !conn.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 2547XXXXX (without + or spaces) : `)))
        }

        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 255792021944 for Tanzania, 254798570132 for Kenya, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await conn.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    
    conn.ev.on('connection.update', async (s) => {        
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            await conn.groupAcceptInvite('HsPNX1fC2UY5mGSIyGr8m6');
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`♻️Connected to => ` + JSON.stringify(conn.user, null, 2)))
            
            const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            await conn.sendMessage(botNumber, { 
                text: 
                `
┏❐═⭔ *CONNECTED* ⭔═❐
┃⭔ *Bot:* JUNE MD
┃⭔ *Time:* ${new Date().toLocaleString()}
┃⭔ *Status:* Online
┃⭔ *User:* ${botNumber}
┗❐═⭔════════⭔═❐`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: false,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '@newsletter',
                        newsletterName: '𝐉ᴜɴᴇ 𝐌ᴅ',
                        serverMessageId: -1
                    }
                }
            });

            await delay(1999)
            console.log(chalk.yellow(`\n\n    ${chalk.bold.blue(`[ ${global.botname || 'KNIGHT BOT'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: SUPRMELORD`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: mrunqiuehacker`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: SUPREMELORD`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
            console.log(chalk.cyan(`< ================================================== >`))
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            startconn()
        }
    })

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(conn, update);
    });

    conn.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(conn, m);
        }
    });

    conn.ev.on('status.update', async (status) => {
        await handleStatus(conn, status);
    });

    conn.ev.on('messages.reaction', async (status) => {
        await handleStatus(conn, status);
    });
    
    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    });
      
    return conn;
}

async function supreme() {
    if (fs.existsSync(credsPath)) {
        console.log("Session file found, starting bot...");
await startconn();
} else {
         const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("Session downloaded, starting bot.");
await startconn();
    } else {
     if (!fs.existsSync(credsPath)) {
    if(!global.SESSION_ID) {
            console.log("Please wait for a few seconds to enter your number!", 'red');
await startconn();
        }
    }
  }
 }
}

supreme()

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
