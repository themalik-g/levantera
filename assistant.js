/**
 * ====================================================================================
 *                       LEVANTER BOT ARCHITECTURE & DEVELOPER GUIDE
 * ====================================================================================
 *
 * Welcome! This document (`assistant.js`) provides a comprehensive overview of the
 * Levanter WhatsApp Bot codebase. It is designed to help you understand how the bot works,
 * how its internal modules interact, and how you can easily create new commands or modify
 * existing functionality.
 *
 * TABLE OF CONTENTS:
 * ------------------
 * 1. High-Level Architecture Overview
 * 2. Detailed Breakdown of Key Core Files
 *    - lib/index.js
 *    - lib/events.js
 *    - lib/client.js
 *    - lib/handle.js
 *    - lib/sendMessage.js
 *    - lib/baileys.js
 *    - lib/utils.js
 *    - lib/config.js
 *    - lib/store.js
 *    - lib/lang.js
 *    - lib/cmd.js
 *    - lib/constant.js
 * 3. Message Object Reference (lib/class/Message.js)
 * 4. Database Layer (lib/db/)
 * 5. Plugin System & Command Registration
 * 6. Step-by-Step Guide: How to Create a New Command / Plugin
 * 7. Step-by-Step Guide: How to Modify Existing Commands
 *
 * ====================================================================================
 */

/* ====================================================================================
 * 1. HIGH-LEVEL ARCHITECTURE OVERVIEW
 * ====================================================================================
 *
 * The bot operates on Node.js (>=20.0.0) using `@whiskeysockets/baileys` (via a customized
 * Baileys package) for WhatsApp Web protocol communication.
 *
 * Execution Flow:
 * ---------------
 * 1. [index.js] Starts the application and initializes environment configurations.
 * 2. [lib/client.js] Connects to WhatsApp servers, manages multi-session auth keys,
 *    and listens for connection status updates and incoming message events.
 * 3. [lib/handle.js] Receives incoming raw Baileys message events (`messages.upsert`),
 *    parses/filters them, and wraps them in user-friendly helper wrappers (`Message` class).
 * 4. [lib/events.js] Holds the command registry (`commands` array). Matches incoming message
 *    text against registered command patterns (`prefix + pattern`).
 * 5. [plugins/*.js] Individual command handlers (e.g. `ping.js`, `sticker.js`, `group.js`).
 *    When a command pattern matches, its handler function inside `plugins/` is executed.
 * 6. [lib/sendMessage.js] Helper utilities for constructing and sending outgoing WhatsApp messages,
 *    media, stickers, buttons, and replies.
 */

/* ====================================================================================
 * 2. DETAILED BREAKDOWN OF KEY CORE FILES
 * ====================================================================================
 *
 * Below is a breakdown of the specific files you asked about:
 *
 * ------------------------------------------------------------------------------------
 * A. `lib/index.js`
 * ------------------------------------------------------------------------------------
 * - Description: Main library exporter and aggregator.
 * - Purpose: Exports core classes, helper functions, database methods, and language strings
 *   so plugins can require everything cleanly with `const { bot, lang, ... } = require('../lib/')`.
 *
 * ------------------------------------------------------------------------------------
 * B. `lib/events.js`
 * ------------------------------------------------------------------------------------
 * - Description: Command & Plugin Event Registry.
 * - Key Functions:
 *   - `bot(info, func)` or `command(info, func)`: Registers a new command in the bot.
 *   - Parameters for `info`:
 *     - `pattern`: RegEx or string trigger (e.g., `'ping ?(.*)'` or `'sticker'`).
 *     - `desc`: Short description shown in `.menu`.
 *     - `type`: Category in menu (e.g., `'media'`, `'group'`, `'whatsapp'`, `'download'`).
 *     - `fromMe`: Boolean (true if command can only be run by the bot owner / sudo).
 *     - `onlyGroup`: Boolean (true if command only works inside WhatsApp group chats).
 *     - `onlyPm`: Boolean (true if command only works in private chats).
 *     - `on`: Trigger on specific event types (e.g., `'text'`, `'image'`, `'delete'`).
 *
 * ------------------------------------------------------------------------------------
 * C. `lib/client.js`
 * ------------------------------------------------------------------------------------
 * - Description: Baileys WebSocket Client Manager.
 * - Purpose:
 *   - Handles connection creation (`makeWASocket`).
 *   - Manages session state, reconnection loops, QR codes, and pairing codes.
 *   - Hooks into Baileys event emitters (`creds.update`, `connection.update`, `messages.upsert`).
 *
 * ------------------------------------------------------------------------------------
 * D. `lib/handle.js`
 * ------------------------------------------------------------------------------------
 * - Description: Incoming Message Pipeline & Event Handler.
 * - Purpose:
 *   - Processes raw WhatsApp messages received from `client.js`.
 *   - Checks for banned users, anti-link rules, anti-spam, auto-status views, and chat filters.
 *   - Instantiates `Message` object (`lib/class/Message.js`) and delegates matching
 *     commands to `lib/events.js`.
 *
 * ------------------------------------------------------------------------------------
 * E. `lib/sendMessage.js`
 * ------------------------------------------------------------------------------------
 * - Description: Message Dispatcher & Media Formatter.
 * - Purpose:
 *   - Contains functions to construct and send text, images, videos, audio/voice notes (PTT),
 *     documents, stickers, interactive buttons, lists, and templates.
 *   - Handles quoting/replying to messages.
 *
 * ------------------------------------------------------------------------------------
 * F. `lib/baileys.js`
 * ------------------------------------------------------------------------------------
 * - Description: Baileys Helper Utilities.
 * - Purpose: Wraps low-level Baileys protocol functions (e.g., buffer downloads, jid decoding,
 *   vcard creation, presence updates, group metadata fetching).
 *
 * ------------------------------------------------------------------------------------
 * G. `lib/utils.js`
 * ------------------------------------------------------------------------------------
 * - Description: General Utility & Formatting Functions.
 * - Key Utilities:
 *   - `getBuffer(url)`: Fetches file/media as Buffer from HTTP(S) URL.
 *   - `parseJid(text)`: Extracts phone numbers / JIDs from user input text or mentions.
 *   - `formatBytes(bytes)`: Converts file sizes into human-readable strings (KB, MB, GB).
 *   - `runtime(seconds)`: Formats uptime seconds into human-readable duration (days, hours, mins).
 *   - `isUrl(text)`: Checks if a string is a valid URL.
 *
 * ------------------------------------------------------------------------------------
 * H. `lib/config.js`
 * ------------------------------------------------------------------------------------
 * - Description: Configuration Loader.
 * - Purpose: Reads configuration from process environment variables (`config.env`) and sets
 *   defaults for prefixes, session IDs, bot language, sudo numbers, and API mode.
 *
 * ------------------------------------------------------------------------------------
 * I. `lib/store.js`
 * ------------------------------------------------------------------------------------
 * - Description: In-Memory Message & Contact Store.
 * - Purpose: Caches recent messages, group metadata, contacts, and presence updates for quick retrieval.
 *
 * ------------------------------------------------------------------------------------
 * J. `lib/lang.js`
 * ------------------------------------------------------------------------------------
 * - Description: Localization & Translation Manager.
 * - Purpose: Loads language JSON files from `lang/*.json` (English, Spanish, French, Arabic, Hindi, etc.)
 *   based on `BOT_LANG` in `config.env`.
 *
 * ------------------------------------------------------------------------------------
 * K. `lib/cmd.js`
 * ------------------------------------------------------------------------------------
 * - Description: Custom Command Aliases / DB Command Handlers.
 * - Purpose: Allows dynamic custom commands saved in the database to be processed alongside code plugins.
 *
 * ------------------------------------------------------------------------------------
 * L. `lib/constant.js`
 * ------------------------------------------------------------------------------------
 * - Description: Bot Constants & Default Messages.
 * - Purpose: Contains global constants, mime-type definitions, default media paths, and system flags.
 */

/* ====================================================================================
 * 3. MESSAGE OBJECT REFERENCE (lib/class/Message.js)
 * ====================================================================================
 *
 * When a command handler is invoked in a plugin:
 * `async (message, match, ctx) => { ... }`
 *
 * `message` is an instance of `Message`. Useful properties and methods include:
 *
 * Key Properties:
 * ---------------
 * - `message.jid`: The JID (chat ID) where the message was sent (e.g. `12345@s.whatsapp.net` or `12345@g.us`).
 * - `message.sender`: The JID of the user who sent the message.
 * - `message.fromMe`: Boolean indicating if the message was sent by the bot account itself.
 * - `message.isGroup`: Boolean indicating if the chat is a group chat.
 * - `message.text` / `message.message`: The text body of the message.
 * - `message.quoted`: Contains the quoted message object if the user replied to a message.
 * - `message.mention`: Array of JIDs mentioned (@user) in the message.
 * - `message.client`: The raw Baileys WASocket client instance.
 *
 * Key Methods:
 * ------------
 * - `await message.send(content, options)`: Sends text or media to the current chat.
 * - `await message.reply(text)`: Replies to the current message with text.
 * - `await message.sendReply(text)`: Reply shortcut.
 * - `await message.download()`: Downloads media (image/video/audio) attached to the message as a Buffer.
 * - `await message.clearChat(jid)`: Clears chat history.
 * - `await message.forward(jid, message)`: Forwards a message.
 */

/* ====================================================================================
 * 4. DATABASE LAYER (lib/db/)
 * ====================================================================================
 *
 * Database models use Sequelize (supporting SQLite3 / PostgreSQL).
 * Located in `lib/db/`:
 * - `alive.js`: Custom alive messages.
 * - `antilink.js`: Anti-link configuration per group.
 * - `filter.js`: Auto-response filters.
 * - `greetings.js`: Welcome and goodbye messages per group.
 * - `plugins.js`: Dynamically installed external plugins (`.plugin`).
 * - `warn.js`: User warning count per group.
 * - `notes.js` / `budget.js` / etc.
 */

/* ====================================================================================
 * 5. PLUGIN SYSTEM & COMMAND REGISTRATION
 * ====================================================================================
 *
 * Commands live inside the `plugins/` directory. Any `.js` file placed in `plugins/`
 * is automatically loaded when the bot starts.
 *
 * Basic Plugin Template:
 * ----------------------
 * ```javascript
 * const { bot, lang } = require('../lib/')
 *
 * bot(
 *   {
 *     pattern: 'hello ?(.*)', // Trigger pattern (RegEx)
 *     desc: 'Greets the user', // Menu description
 *     type: 'misc',           // Category in menu
 *   },
 *   async (message, match, ctx) => {
 *     // match[1] contains any text passed after the command name
 *     const name = match[1] || 'Friend'
 *     await message.send(`Hello, ${name}! 👋`)
 *   }
 * )
 * ```
 */

/* ====================================================================================
 * 6. STEP-BY-STEP GUIDE: HOW TO CREATE A NEW COMMAND / PLUGIN
 * ====================================================================================
 *
 * Example 1: Creating a simple Text Command (`plugins/mycommand.js`)
 * -----------------------------------------------------------------
 * 1. Create a new file in `plugins/`, e.g., `plugins/mycommand.js`.
 * 2. Add the following code:
 *
 * ```javascript
 * const { bot } = require('../lib/')
 *
 * bot(
 *   {
 *     pattern: 'sayhi ?(.*)',
 *     desc: 'Say hi to someone',
 *     type: 'misc',
 *   },
 *   async (message, match) => {
 *     const target = match[1] ? match[1] : 'there'
 *     await message.send(`Hi ${target}! Hope you have a great day!`)
 *   }
 * )
 * ```
 *
 * Example 2: Creating a Media Command (e.g. downloading / processing images)
 * ---------------------------------------------------------------------------
 * ```javascript
 * const { bot } = require('../lib/')
 *
 * bot(
 *   {
 *     pattern: 'getpic',
 *     desc: 'Downloads and echoes quoted image',
 *     type: 'media',
 *   },
 *   async (message) => {
 *     // Check if user quoted an image message
 *     if (!message.quoted || !message.quoted.image) {
 *       return await message.send('_Please reply to an image message!_')
 *     }
 *
 *     // Download media buffer
 *     const imageBuffer = await message.quoted.download()
 *
 *     // Send image back with a caption
 *     await message.send(imageBuffer, { caption: 'Here is your image!' }, 'image')
 *   }
 * )
 * ```
 */

/* ====================================================================================
 * 7. STEP-BY-STEP GUIDE: HOW TO MODIFY EXISTING COMMANDS
 * ====================================================================================
 *
 * 1. Find the file in `plugins/`:
 *    - Example: To modify the `clear` command, look at `plugins/clear.js`.
 *    - Example: To modify group moderation commands, look at `plugins/group.js`.
 *    - Example: To modify sticker generation, look at `plugins/sticker.js`.
 *
 * 2. Modify the handler function:
 *    - You can adjust the response message, add permission checks (`if (!message.isGroup) ...`),
 *      or add extra arguments using `match`.
 *
 * 3. Save the file and restart the bot:
 *    - Standard restart command: `npm start` or `pm2 restart levanter`.
 *
 * ====================================================================================
 * END OF ASSISTANT GUIDE
 * ====================================================================================
 */

module.exports = {
  description: "Levanter Bot Architecture & Developer Guide",
};
