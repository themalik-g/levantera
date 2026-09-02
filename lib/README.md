# Core Library Directory (`lib/`)

This directory contains the internal infrastructure and core utilities of the **Levanter WhatsApp Bot**. Below is a summary map of all core files to help developers and maintainers navigate the codebase.

---

## 🗺 Directory Map & Key Files

### 1. Engine & Client Connection

- **`lib/client.js`**
  - **Purpose:** Initializes WhatsApp Web WebSocket connection using Baileys (`makeWASocket`).
  - **Responsibilities:** Manages multi-session authentications, session data persistence, QR code generation, pairing codes, auto-reconnections, and event dispatching.
- **`lib/handle.js`**
  - **Purpose:** Central message execution pipeline.
  - **Responsibilities:** Listens to incoming messages from `client.js`, applies chat filters, anti-link rules, anti-spam, checks ban statuses, constructs `Message` instances, and routes command triggers to registered event handlers in `lib/events.js`.
- **`lib/sendMessage.js`**
  - **Purpose:** Message dispatcher and media renderer.
  - **Responsibilities:** Encapsulates outbound communication for sending text, images, videos, audio/voice notes (PTT), documents, stickers, interactive buttons, template messages, and quoted replies.
- **`lib/baileys.js`**
  - **Purpose:** Low-level Baileys helper utilities.
  - **Responsibilities:** Handles buffer downloads for media, JID parsing/normalization, contact vCard generation, presence updates, and WhatsApp group metadata operations.

---

### 2. Command & Plugin Management

- **`lib/events.js`**
  - **Purpose:** Plugin and command event registry.
  - **Responsibilities:** Defines the `bot()` (or `command()`) registration function. Maintains the array of registered commands, matches incoming message triggers against regular expressions, and enforces execution constraints (`fromMe`, `onlyGroup`, `onlyPm`).
- **`lib/cmd.js`**
  - **Purpose:** Dynamic database command alias processor.
  - **Responsibilities:** Handles custom command shortcuts and aliases saved by users in the database.

---

### 3. Utility & Support Modules

- **`lib/index.js`**
  - **Purpose:** Primary library exporter and entry aggregator.
  - **Responsibilities:** Re-exports core modules, helper functions, and database models so plugins can cleanly import them (`const { bot, lang } = require('../lib/')`).
- **`lib/utils.js`**
  - **Purpose:** Common utility functions.
  - **Responsibilities:** Offers general helpers like `getBuffer()`, `formatBytes()`, `runtime()`, `parseJid()`, and URL validation.
- **`lib/config.js`**
  - **Purpose:** Environment variable and configuration manager.
  - **Responsibilities:** Loads and validates configuration settings from `config.env` and `config.js` (prefixes, language, session IDs, API mode, ports, sudo numbers).
- **`lib/store.js`**
  - **Purpose:** In-memory store and state manager.
  - **Responsibilities:** Caches recent message histories, chat metadata, contact names, and user presence states for fast access.
- **`lib/lang.js`**
  - **Purpose:** Multi-language localization engine.
  - **Responsibilities:** Loads language JSON files from `lang/*.json` based on the configured `BOT_LANG`.
- **`lib/constant.js`**
  - **Purpose:** System constants and defaults.
  - **Responsibilities:** Defines static system constants, default media paths, mime-type definitions, and global flags.

---

### 4. Message Wrappers & Data Abstraction

- **`lib/class/Message.js`**
  - **Purpose:** High-level wrapper object around raw Baileys WhatsApp message payloads.
  - **Key API Properties & Methods:**
    - `message.jid`: Target chat JID (`...@s.whatsapp.net` or `...@g.us`).
    - `message.sender`: Sender's JID.
    - `message.isGroup`: Boolean indicating group chat.
    - `message.text`: Body text of the message.
    - `message.quoted`: Quoted/replied message object (if present).
    - `await message.send(content, options)`: Sends message or media to current chat.
    - `await message.reply(text)`: Replies to the message.
    - `await message.download()`: Downloads attached media as Buffer.

---

### 5. Persistence Layer

- **`lib/db/`**
  - **Purpose:** Sequelize ORM database models supporting SQLite3 and PostgreSQL.
  - **Models Include:** `alive.js`, `antilink.js`, `filter.js`, `greetings.js`, `plugins.js`, `warn.js`, `notes.js`, `budget.js`, and more.

---

## 🛠 How to Create or Edit Commands

1. **Creating a Plugin:** Add a `.js` file inside `plugins/` (e.g. `plugins/myplugin.js`).
2. **Registering Command:**

   ```javascript
   const { bot } = require("../lib/");

   bot(
     {
       pattern: "mycmd ?(.*)",
       desc: "My custom command description",
       type: "misc",
     },
     async (message, match) => {
       await message.send(`Hello! You passed: ${match[1] || "nothing"}`);
     },
   );
   ```
