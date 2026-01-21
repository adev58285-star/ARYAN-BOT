// index.js
require('dotenv').config()
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const NodeCache = require('node-cache')
const pino = require('pino')
const { rmSync } = require('fs')
const { delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys')

const store = require('./lib/lightweight_store')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main')
const { smsg } = require('./lib/myfunc')

// --- Global Config ---
const BOT_NAME = "KNIGHT BOT"
const THEME_EMOJI = "•"
const SESSION_PATH = path.join(__dirname, "session")

// --- Store Init ---
store.readFromFile()
setInterval(() => store.writeToFile(), 10_000)

// --- Memory & RAM Monitoring ---
setInterval(() => global.gc && global.gc(), 60_000)
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting...')
        process.exit(1)
    }
}, 30_000)

// --- CLI Helpers ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(res => rl.question(chalk.cyan(q), ans => res(ans.trim())))

// --- Login Options ---
async function chooseLogin() {
    console.clear()
    console.log(chalk.yellow('╔══════════════════════════════╗'))
    console.log(chalk.yellow('║     KNIGHT BOT LOGIN         ║'))
    console.log(chalk.yellow('╚══════════════════════════════╝'))
    console.log(chalk.cyan('1. Phone Number\n2. Session ID\n3. Existing Session'))

    const choice = await ask('Enter choice (1/2/3): ')
    if (choice === '1') return loginPhone()
    if (choice === '2') return loginSessionId()
    if (choice === '3') return { method: 'existing', path: SESSION_PATH }
    console.log(chalk.red('Invalid choice.'))
    return chooseLogin()
}

async function loginPhone() {
    let phone = await ask('Enter phone number (with country code): ')
    phone = phone.replace(/\D/g, '')
    if (!phone.startsWith('91') && phone.length === 10) phone = '91' + phone
    const usePairing = (await ask('Use pairing code? (y/N): ')).toLowerCase() === 'y'
    return { method: 'phone', phoneNumber: phone, pairingCode: usePairing }
}

async function loginSessionId() {
    let id = await ask('Paste Session ID: ')
    if (!id.startsWith('ARYAN:~')) id = `ARYAN:~${id}`
    return { method: 'sessionId', sessionId: id }
}

// --- Auth Loader ---
async function getAuthState(login) {
    const { useMultiFileAuthState } = require('@whiskeysockets/baileys')
    if (!fs.existsSync(SESSION_PATH)) fs.mkdirSync(SESSION_PATH, { recursive: true })

    if (login.method === 'sessionId') {
        fs.writeFileSync(path.join(SESSION_PATH, "creds.json"), JSON.stringify({ sessionId: login.sessionId }, null, 2))
    }
    return useMultiFileAuthState(login.path || SESSION_PATH)
}

// --- Bot Startup ---
async function startBot() {
    try {
        const login = await chooseLogin()
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await getAuthState(login)
        const msgCache = new NodeCache()

        const { default: makeWASocket } = require('@whiskeysockets/baileys')
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: login.method === 'phone' && !login.pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })) },
            msgRetryCounterCache: msgCache,
        })

        sock.ev.on('creds.update', saveCreds)
        store.bind(sock.ev)

        // --- Message Handling ---
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const mek = messages[0]
            if (!mek?.message) return
            mek.message = mek.message.ephemeralMessage?.message || mek.message
            if (mek.key.remoteJid === 'status@broadcast') return handleStatus(sock, { messages })
            try { await handleMessages(sock, { messages }, true) }
            catch (err) { console.error("Message error:", err) }
        })

        // --- Connection Handling ---
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (qr) console.log(chalk.yellow('📱 Scan QR with WhatsApp'))
            if (connection === 'open') console.log(chalk.green(`✅ Connected as ${BOT_NAME}`))
            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode
                if (code === DisconnectReason.loggedOut || code === 401) {
                    rmSync(SESSION_PATH, { recursive: true, force: true })
                    console.log(chalk.red('Session cleared. Re-authenticate.'))
                } else {
                    console.log(chalk.yellow('Reconnecting...'))
                    await delay(5000)
                    startBot()
                }
            }
        })

        // --- Pairing Code ---
        if (login.method === 'phone' && login.pairingCode) {
            setTimeout(async () => {
                const code = await sock.requestPairingCode(login.phoneNumber)
                console.log(chalk.yellow(`Pairing Code: ${code}`))
            }, 3000)
        }

    } catch (err) {
        console.error('Fatal error:', err)
        await delay(5000)
        startBot()
    }
}

// --- Exit Cleanup ---
process.on('SIGINT', () => { rl.close(); process.exit(0) })
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

startBot()
