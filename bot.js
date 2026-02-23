const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://ibrokhimzhanov.github.io/Ramazontaqvim1447/';

if (!TOKEN) {
    console.error('BOT_TOKEN environment variable is not set!');
    process.exit(1);
}

// Paid users storage
const PAID_FILE = path.join(__dirname, 'paid_users.json');

function loadPaidUsers() {
    try {
        return JSON.parse(fs.readFileSync(PAID_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function savePaidUsers(users) {
    fs.writeFileSync(PAID_FILE, JSON.stringify(users, null, 2));
}

function isUserPaid(userId) {
    return loadPaidUsers().includes(userId);
}

function addPaidUser(userId) {
    const users = loadPaidUsers();
    if (!users.includes(userId)) {
        users.push(userId);
        savePaidUsers(users);
    }
}

const bot = new TelegramBot(TOKEN, {
    polling: {
        params: { offset: -1 }
    }
});

// /start command — always opens mini app
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || '';
    const paid = isUserPaid(chatId);
    const url = paid
        ? WEB_APP_URL + '?paid=true&uid=' + chatId
        : WEB_APP_URL + '?uid=' + chatId;

    bot.sendMessage(chatId, `Assalomu alaykum, ${firstName}! 🌙\n\nRamazon Taqvim 1447 ni ochish uchun quyidagi tugmani bosing:`, {
        reply_markup: {
            keyboard: [[
                { text: '🌙 Ramazon Taqvim', web_app: { url: url } }
            ]],
            resize_keyboard: true
        }
    });
});

// Handle web_app_data (payment confirmation from mini app)
bot.on('message', async (msg) => {
    if (!msg.web_app_data) return;

    try {
        const data = JSON.parse(msg.web_app_data.data);

        if (data.action === 'confirm_payment') {
            const userId = msg.from.id;
            const firstName = msg.from.first_name || '';
            const username = msg.from.username ? '@' + msg.from.username : "yo'q";

            // Notify user
            await bot.sendMessage(userId,
                "⏳ To'lovingiz tekshirilmoqda...\nAdmin tasdiqlashi bilan sizga xabar beriladi."
            );

            // Notify admin
            await bot.sendMessage(ADMIN_ID,
                `🔔 <b>Yangi to'lov so'rovi!</b>\n\n` +
                `👤 Ism: ${firstName}\n` +
                `🆔 ID: <code>${userId}</code>\n` +
                `📧 Username: ${username}\n\n` +
                `Tasdiqlaysizmi?`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '✅ Tasdiqlash', callback_data: `approve_${userId}` },
                            { text: '❌ Rad etish', callback_data: `reject_${userId}` }
                        ]]
                    }
                }
            );
        }
    } catch (err) {
        console.error('web_app_data error:', err.message);
    }
});

// Handle polling errors
bot.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
});

// Admin approve/reject
bot.on('callback_query', async (query) => {
    try {
        const data = query.data;

        if (data.startsWith('approve_')) {
            if (query.from.id !== ADMIN_ID) return;

            const targetId = parseInt(data.split('_')[1]);
            addPaidUser(targetId);

            await bot.answerCallbackQuery(query.id, { text: 'Tasdiqlandi!' });

            // Update admin message (photo → editCaption, text → editText)
            if (query.message.photo) {
                await bot.editMessageCaption(`✅ Tasdiqlandi! (ID: ${targetId})`, {
                    chat_id: ADMIN_ID, message_id: query.message.message_id
                });
            } else {
                await bot.editMessageText(`✅ Tasdiqlandi! (ID: ${targetId})`, {
                    chat_id: ADMIN_ID, message_id: query.message.message_id
                });
            }

            // Send confirmation and pin it (mini app polls for this)
            const confirmMsg = await bot.sendMessage(targetId, 'PAID_CONFIRMED');
            await bot.pinChatMessage(targetId, confirmMsg.message_id, { disable_notification: true });

            // Send mini app with paid=true to user
            await bot.sendMessage(targetId,
                "🎉 To'lovingiz tasdiqlandi!\n\nRamazon Taqvim ni ochish uchun quyidagi tugmani bosing:",
                {
                    reply_markup: {
                        keyboard: [[
                            { text: '🌙 Ramazon Taqvim', web_app: { url: WEB_APP_URL + '?paid=true&uid=' + targetId } }
                        ]],
                        resize_keyboard: true
                    }
                }
            );
        }

        if (data.startsWith('reject_')) {
            if (query.from.id !== ADMIN_ID) return;

            const targetId = parseInt(data.split('_')[1]);

            await bot.answerCallbackQuery(query.id, { text: 'Rad etildi!' });

            if (query.message.photo) {
                await bot.editMessageCaption(`❌ Rad etildi (ID: ${targetId})`, {
                    chat_id: ADMIN_ID, message_id: query.message.message_id
                });
            } else {
                await bot.editMessageText(`❌ Rad etildi (ID: ${targetId})`, {
                    chat_id: ADMIN_ID, message_id: query.message.message_id
                });
            }

            await bot.sendMessage(targetId,
                "❌ Kechirasiz, to'lovingiz tasdiqlanmadi.\n\nIltimos, to'lovni qayta amalga oshiring yoki admin bilan bog'laning."
            );
        }
    } catch (err) {
        console.error('Callback error:', err.message);
    }
});

console.log('Bot ishga tushdi...');
