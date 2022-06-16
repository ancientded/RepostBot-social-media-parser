const PageParser = require("./PageParser.js");
const DB = require('./db.js');

let TelegramBot = require('node-telegram-bot-api');

//change to your token
let token = "5361193451:AAG4FtV4DgV8mfoHqdcyYI32IBrOMKbCdU8";

let bot = new TelegramBot(token, {
    polling: true
});

let startKeyboard = {
    "reply_markup": {
        hide_keyboard: false,
        "keyboard": [
            ["🚀 Почати 🚀"]
        ]
    },
    parse_mode: "HTML"
};

let selectSocialKeyboard = {
    "reply_markup": {
        hide_keyboard: false,
        resize_keyboard: true,
        "keyboard": [
            ["📷 Instagram"],
            ["📘 Facebook"],
            ["🐥 Twitter"]
        ]
    }
};

const users = [];

function intervalReload(bot) {
    const usersData = new DB().getAllUsers();

    usersData.then(result => {
        if (result.length > 0) {
            result.forEach((user, i) => {
                let isBotInGroup = false;
                let {
                    adminID,
                    chatIdentifier,
                    communityIdentifier,
                    adminSocialID,
                    socialName,
                    sourceURL
                } = user;
                bot.getChat(communityIdentifier).then(data => {
                    if (data.type === 'group') {
                        bot.getChatAdministrators(data.id).then(admins => {                            
                            admins.forEach(admin => {
                                //change to your bot username
                                if (admin.user.username === 'repostfrombot') {
                                    isBotInGroup = true;
                                }
                            });
                            if (!isBotInGroup) {
                                bot.sendMessage(chatIdentifier, '❗ Чат більше не існує, або бота було видалено з чату, або власник покинув канал / групу.');
                                new DB().removeCommunity(communityIdentifier, bot, chatIdentifier);
                                bot.leaveChat(communityIdentifier);
                                new DB().query(`DELETE FROM socialpost WHERE adminSocialID = (SELECT adminSocialID FROM adminsocial WHERE adminsocial.adminID = ${adminID})`).catch(err => {
                                    console.log('- - - - - - - - [ SQL Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ SQL Error ] - - - - - - - -');
                                });
                            } else {
                                setTimeout(() => {
                                    if (!!sourceURL && !!communityIdentifier) {
                                        console.log(socialName);
                                        switch (socialName) {
                                            case 'instagram':
                                                new PageParser().parseInsragram(sourceURL, communityIdentifier, bot, adminSocialID);
                                                break;
                                            case 'facebook':
                                                new PageParser().parseFacebook(sourceURL, communityIdentifier, bot, adminSocialID);
                                                break;
                                            case 'twitter':
                                                new PageParser().parseTwitter(sourceURL, communityIdentifier, bot, adminSocialID);
                                                break;
                                            default:
                                                bot.sendMessage(chatIdentifier, "При парсинге страницы произошла неизвестная ошибка.");
                                                break;
                                        }
                                    }
                                }, 2000 * i);
            
                                if (users.filter(user => user.userId == chatIdentifier).length == 0) {
                                    return users.push({
                                        userId: chatIdentifier,
                                        parsingInterval: setInterval(() => {
                                            intervalReload(bot);
                                        }, 30000 + (2000 * i + 1)),
                                        addingURL: false
                                    });
                                }
                            }
                        }).catch(err => {
                            console.log('- - - - - - - - [ Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ Error ] - - - - - - - -');
                            bot.sendMessage(chatIdentifier, '❗ Чат більше не існує, або бота було видалено з чату, або власник покинув канал / групу.');
                            new DB().removeCommunity(communityIdentifier, bot, chatIdentifier);
                            bot.leaveChat(communityIdentifier);
                            new DB().query(`DELETE FROM socialpost WHERE adminSocialID = (SELECT adminSocialID FROM adminsocial WHERE adminsocial.adminID = ${adminID})`).catch(err => {
                                console.log('- - - - - - - - [ SQL Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ SQL Error ] - - - - - - - -');
                            });
                        });
                    } else {
                        setTimeout(() => {
                            if (!!sourceURL && !!communityIdentifier) {
                                console.log(socialName);
                                switch (socialName) {
                                    case 'instagram':
                                        new PageParser().parseInsragram(sourceURL, communityIdentifier, bot, adminSocialID);
                                        break;
                                    case 'facebook':
                                        new PageParser().parseFacebook(sourceURL, communityIdentifier, bot, adminSocialID);
                                        break;
                                    case 'twitter':
                                        new PageParser().parseTwitter(sourceURL, communityIdentifier, bot, adminSocialID);
                                        break;
                                    default:
                                        bot.sendMessage(chatIdentifier, "При парсинге страницы произошла неизвестная ошибка.");
                                        break;
                                }
                            }
                        }, 2000 * i);
    
                        if (users.filter(user => user.userId == chatIdentifier).length == 0) {
                            return users.push({
                                userId: chatIdentifier,
                                parsingInterval: setInterval(() => {
                                    intervalReload(bot);
                                }, 30000 + (2000 * i + 1)),
                                addingURL: false
                            });
                        }
                    }                    
                }).catch(err => {
                    console.log('- - - - - - - - [ Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ Error ] - - - - - - - -');
                    bot.sendMessage(chatIdentifier, '❗ Чат більше не існує, або бота було видалено з чату, або власник покинув канал / групу.');
                    new DB().removeCommunity(communityIdentifier, bot, chatIdentifier);
                    bot.leaveChat(communityIdentifier);
                    new DB().query(`DELETE FROM socialpost WHERE adminSocialID = (SELECT adminSocialID FROM adminsocial WHERE adminsocial.adminID = ${adminID})`).catch(err => {
                        console.log('- - - - - - - - [ SQL Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ SQL Error ] - - - - - - - -');
                    });
                });
            });
        }

    }).catch(err => {
        console.log(err);
    });
}
intervalReload(bot);

bot.onText(/\/start/, function (msg) {
    const chatId = msg.chat.id;
    const checkUser = new DB().checkUser(chatId);
    checkUser.then(data => {
        if (!Boolean(data.length)) {
            const sql = new DB();
            sql.addNewUser(chatId);
        }
    });

    bot.sendMessage(chatId, "👋 Привіт, за допомогою цього бота ти зможеш переглядати пости улюблених авторів, не виходячи с Telegram\n\nОберіть пункт меню <b>🚀 Почати 🚀</b> для того щоб налаштувати бота!\n\nЯк налаштувати Бот: https://telegra.ph/RepostBot-instruction-05-03", startKeyboard);
});

bot.on("message", (msg) => {
    let chatId = msg.chat.id;
    if (users.length == 0) {
        users.push({
            userId: chatId.toString(),
            parsingInterval: undefined,
            addingURL: false
        });
    }
    if (msg.chat.type === 'group') {
        if (msg.text === '/add_channel') {
            bot.getChatAdministrators(chatId).then((users) => {
                let userId = users.filter(object => object.status === 'creator')[0].user.id;
                const checkUser = new DB().checkUser(userId);
                checkUser.then(data => {
                    if (Boolean(data.length)) {
                        if (userId == data[0].chatIdentifier) {
                            new DB().addCommunity(data[0].adminID, chatId, msg.chat.title, bot, userId);
                        }
                    }
                });
            });
            bot.deleteMessage(chatId, msg.message_id);
        }
        if (msg.text === '/remove_channel') {
            bot.getChatAdministrators(chatId).then((users) => {
                let userId = users.filter(object => object.status === 'creator')[0].user.id;
                const checkUser = new DB().checkUser(userId);
                checkUser.then(data => {
                    if (Boolean(data.length)) {
                        if (userId == data[0].chatIdentifier) {
                            new DB().query(`SELECT communityIdentifier FROM admincommunity INNER JOIN admin ON admin.chatIdentifier = '${chatId}'`).then(data => {
                                bot.deleteMessage(chatId, msg.message_id);
                                bot.leaveChat(chatId);
                                new DB().removeCommunity(chatId, bot, userId);
                            });
                        }
                    }
                });
            });
            bot.deleteMessage(chatId, msg.message_id);
        }
    }

    if (msg.text === "➕ Додати спільноту") {
        bot.sendMessage(chatId, 'Додайте бота в канал або группу як адміністратора та напишіть у групу команду /add_channel');
    }

    if (/(🚀 Почати 🚀)|(⬅ Назад)|(🔃 Змінити соціальну мережу)/.test(msg.text)) {
        users.addingURL = true;
        return bot.sendMessage(chatId, "Оберіть соціальну мережу вашого автора:", selectSocialKeyboard);
    }

    if (msg.text === "❌ Відв'язати группу") {
        // bot.sendMessage(chatId, "Щоб відв'язати групу напишіть команду /remove_channel або просто видаліть з неї бота");
        new DB().query(`SELECT communityIdentifier, comunityName FROM admincommunity WHERE adminID = (SELECT adminID FROM admin WHERE admin.chatIdentifier = '${chatId}')`).then(data => {
            if (data.length > 0) {
                const inlineOptions = {
                    "reply_markup": {
                        "resize_keyboard": true,
                        "inline_keyboard": []
                    }
                };
                data.forEach(item => {
                    inlineOptions.reply_markup.inline_keyboard.push([{
                        text: item.comunityName,
                        callback_data: item.communityIdentifier
                    }]);
                });
                bot.sendMessage(chatId, 'Оберіть группу для видалення:', inlineOptions);
            } else {
                bot.sendMessage(chatId, '⛔ У вас немає жодних груп для видалення!');
            }
            
        });
    }

    if (/(📷 Instagram)|(📘 Facebook)|(🐥 Twitter)/.test(msg.text)) {
        const sql = new DB();
        let userSelect = msg.text.replace(/(📷 )|(📘 )|(🐥 )/g, "").trim().toLowerCase();
        sql.addSocialNetwork(chatId, userSelect);
        users.addingURL = true;
        return bot.sendMessage(chatId, `<b>Ви обрали ${msg.text}</b>\n\nТепер надішліть посилання на профіль автора:`, {
            parse_mode: "HTML",
            "reply_markup": {
                hide_keyboard: false,
                "keyboard": [
                    ["⬅ Назад"]
                ]
            }
        });
    }


    if (/^(?:http(s)?:\/\/)?([\w.-]+)?(facebook|instagram|twitter)+[\w\-\._~:/?#[\]@!\$%&'\(\)\*\+,;=.]+$/gm.test(msg.text) && users.addingURL == true) {
        new DB().getAllUsers().then(data => {
            let currentUser;
            if (data.length == 0) {
                currentUser = new DB().checkUserSocial(chatId).then(userData => {
                    return {
                        socialName: userData[0].name
                    };
                });
            } else {
                currentUser = data[0];
            }

            if (currentUser.toString() === '[object Promise]') {
                currentUser.then(data => {
                    if (msg.text.match(/(facebook|instagram|twitter)/g)[0] === data.socialName) {
                        bot.sendMessage(chatId, "🔄Перевіряємо посилання...");
                        const Evaluator = new PageParser();
                        return Evaluator.evaluatePage(msg.text, chatId, bot, users);
                    } else {
                        let sName = data.socialName.charAt(0).toUpperCase() + data.socialName.substring(1);
                        let userMSGSocial = msg.text.match(/(facebook|instagram|twitter)/g)[0].charAt(0).toUpperCase() + msg.text.match(/(facebook|instagram|twitter)/g)[0].substring(1);
                        return bot.sendMessage(chatId, `Ви обрали <b>${sName}</b>, а надіслали посилання на <b>${userMSGSocial}</b>\nНадішлість будь ласка посилання на <b>${sName}</b>!`, {
                            parse_mode: "HTML"
                        });
                    }
                });
            } else {
                if (msg.text.match(/(facebook|instagram|twitter)/g)[0] === currentUser.socialName) {
                    bot.sendMessage(chatId, "🔄Перевіряємо посилання...");
                    const Evaluator = new PageParser();
                    return Evaluator.evaluatePage(msg.text, chatId, bot, users);
                } else {
                    let sName = currentUser.socialName.charAt(0).toUpperCase() + currentUser.socialName.substring(1);
                    let userMSGSocial = msg.text.match(/(facebook|instagram|twitter)/g)[0].charAt(0).toUpperCase() + msg.text.match(/(facebook|instagram|twitter)/g)[0].substring(1);
                    return bot.sendMessage(chatId, `Ви обрали <b>${sName}</b>, а надіслали посилання на <b>${userMSGSocial}</b>\nНадішлість будь ласка посилання на <b>${sName}</b>!`, {
                        parse_mode: "HTML"
                    });
                }
            }

        });
        return;
    } else {
        if (msg.text != "/start" && users.filter(user => user.userId == chatId)[0].addingURL == true) {
            return bot.sendMessage(chatId, "Ваше посилання не є дійсним, містить помилки, або не є посиланням на Facebook, Instagram або Twitter! Спробуйте ще раз надіслати посилання:");
        }
    }
});

bot.on('callback_query', (msg) => {
    let chatId = msg.message.chat.id;
    bot.deleteMessage(chatId, msg.message.message_id);
    bot.leaveChat(msg.data);
    new DB().removeCommunity(msg.data, bot, chatId);
});

bot.on('channel_post', (msg) => {
    let chatId = msg.chat.id;

    if (msg.text === '/add_channel') {
        bot.getChatAdministrators(chatId).then((users) => {
            let userId = users.filter(object => object.status === 'creator')[0].user.id;
            const checkUser = new DB().checkUser(userId);
            checkUser.then(data => {
                if (Boolean(data.length)) {
                    if (userId == data[0].chatIdentifier) {
                        new DB().addCommunity(data[0].adminID, chatId, msg.chat.title, bot, userId);
                    }
                }
            });
        });
        bot.deleteMessage(chatId, msg.message_id);
    }

    if (msg.text === "/remove_channel") {
        bot.getChatAdministrators(chatId).then((users) => {
            let userId = users.filter(object => object.status === 'creator')[0].user.id;
            const checkUser = new DB().checkUser(userId);
            checkUser.then(data => {
                if (Boolean(data.length)) {
                    new DB().query(`SELECT communityIdentifier FROM admincommunity INNER JOIN admin ON admin.chatIdentifier = '${chatId}'`).then(data => {
                        bot.deleteMessage(chatId, msg.message_id);
                        bot.leaveChat(chatId);
                        new DB().removeCommunity(chatId, bot, userId);
                    });
                }
            });
        });
    }
});
