const db_config = {
    host: "localhost",
    user: "root",
    database: "socialsparsertelegrambotdb",
    password: ""
};

let selectAction = {
    "reply_markup": {
        hide_keyboard: false,
        "keyboard": [
            ["➕ Додати спільноту"],
            ["🔃 Змінити соціальну мережу"],
            ["❌ Відв'язати группу"]
        ]
    }
}

const botUsername = 'repostfrombot';

class DB {
    constructor() {
        console.log("class DB initialized");
    }
    query(sqlString) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        let data = connection.query(sqlString).then(([data, cols]) => {
            return data;
        }).catch(err => {
            console.log(err);
        });
        connection.end();
        return data;
    }
    addNewUser(userId) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        connection.query(`INSERT INTO admin(chatIdentifier) VALUES ('${userId}')`);
        connection.end();
    }
    checkUser(userId) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        let connecting = connection.query(`SELECT * FROM admin WHERE chatIdentifier LIKE '${userId}'`).then(([result, fields]) => {
            return result;
        });
        connection.end();
        return connecting;
    }
    getAllUsers() {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        let connecting = connection.query(`SELECT admin.adminID, admin.chatIdentifier, admincommunity.communityID, admincommunity.communityIdentifier, adminsocial.socialID, adminsocial.adminSocialID, adminsocial.sourceURL, socialnetwork.name AS socialName FROM admin INNER JOIN admincommunity ON admincommunity.adminID = admin.adminID INNER JOIN adminsocial ON adminsocial.adminID = admin.adminID INNER JOIN socialnetwork ON socialnetwork.socialID = adminsocial.socialID`)
            .then(([result, fields]) => {
                console.log(result);
                return result;
            }).catch(err => {
                console.log(err);
            });
        connection.end();
        return connecting;
    }
    checkUserSocial(userId) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        let output = connection.query(`SELECT socialnetwork.name FROM adminsocial, socialnetwork, admin WHERE adminsocial.adminID = admin.adminID AND adminsocial.socialID = socialnetwork.socialID AND admin.chatIdentifier = '${userId}'`)
            .then(([data, cols]) => {
                return data;
            })
            .catch(err => {
                console.log(err);
            });
        connection.end();
        return output;
    }
    addCommunity(creatorId, communityId, comunityName, bot, userId) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        connection.query(`SELECT communityID FROM admincommunity WHERE communityIdentifier LIKE '${communityId}'`)
            .then(([records, columns]) => {
                if (Boolean(records.length)) {
                    bot.sendMessage(userId, "Ця група вже підв'язана.");
                } else {
                    let addingCommunity = mysql.createConnection(db_config).promise();
                    addingCommunity.query(`INSERT INTO admincommunity(communityIdentifier, adminID, comunityName) VALUES ('${communityId}','${creatorId}', '${comunityName}')`)
                        .then(() => {
                            bot.getChat(communityId).then(data => {
                                if (data.type === 'group') {                                    
                                    bot.getChatAdministrators(data.id).then(admins => {
                                        let isBotInGroup = false;
                                        admins.forEach(admin => {
                                            if (admin.user.username === botUsername) {
                                                bot.sendMessage(userId, "✅ Група була успішно додана до бази даних!", selectAction);
                                                isBotInGroup = true;
                                                return;
                                            }
                                        });
                                        if (!isBotInGroup) {
                                            bot.sendMessage(userId, "❌ Бот є в группі, але він не має прав адміністратора!", selectAction);
                                            return;
                                        }    
                                    });                                                                     
                                } else {
                                    return bot.sendMessage(userId, "✅ Група була успішно додана до бази даних!", selectAction);
                                }
                            });
                            
                        }).catch(err => {
                            console.log(err);
                            bot.sendMessage(userId, "⛔ При додаванні групи сталася помилка. Будь ласка зверніться до творця бота: @yaaarek");
                        });
                    addingCommunity.end();


                    let parsingInterval = setInterval(() => {
                        startParsing();
                    }, 30000);

                    function startParsing() {
                        const usersData = new DB().getAllUsers();
                        bot.getChat(communityId).then(data => {
                            if (data) {
                                let isBotInGroup = false;
                                if (data.type === 'group') {
                                    bot.getChatAdministrators(data.id).then(admins => {
                                        admins.forEach(admin => {
                                            if (admin.user.username === botUsername) {
                                                isBotInGroup = true;
                                            }
                                        });
                                        if (!isBotInGroup) {
                                            bot.sendMessage(userId, '❗ Чат більше не існує, або бота було видалено з чату, або власник покинув канал / групу.');
                                            new DB().removeCommunity(communityId, bot, userId);
                                            bot.leaveChat(communityId);
                                            new DB().query(`DELETE FROM socialpost WHERE adminSocialID = (SELECT adminSocialID FROM adminsocial WHERE adminsocial.adminID = ${adminID})`).catch(err => {
                                                console.log('- - - - - - - - [ SQL Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ SQL Error ] - - - - - - - -');
                                            });
                                            clearInterval(parsingInterval);
                                        } else {
                                            usersData.then(result => {
                                                if (result.length > 0) {
                                                    let user = result.filter(user => user.chatIdentifier == userId)[0];
                                                    let {
                                                        chatIdentifier,
                                                        communityIdentifier,
                                                        adminSocialID,
                                                        socialName,
                                                        sourceURL
                                                    } = user;
            
                                                    if (chatIdentifier == userId) {
                                                        if (!!sourceURL && !!communityIdentifier) {
                                                            const PageParser = require("./PageParser.js");
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
                                                                    bot.sendMessage(chatIdentifier, "Під час парсингу сторінки сталася невідома помилка.");
                                                                    break;
                                                            }
                                                        }
                                                    }
            
                                                }
                                            }).catch(err => {
                                                console.log(err);
                                            });
                                        }
                                    }).catch(err => {
                                        console.log('- - - - - - - - [ Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ Error ] - - - - - - - -');
                                        bot.sendMessage(userId, '❗ Чат більше не існує, або бота було видалено з чату, або власник покинув канал / групу.');
                                        new DB().removeCommunity(communityId, bot, userId);
                                        bot.leaveChat(communityId);
                                        new DB().query(`DELETE FROM socialpost WHERE adminSocialID = (SELECT adminSocialID FROM adminsocial WHERE adminsocial.adminID = ${adminID})`).catch(err => {
                                            console.log('- - - - - - - - [ SQL Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ SQL Error ] - - - - - - - -');
                                        });
                                        clearInterval(parsingInterval);
                                    });
                                } else {
                                    usersData.then(result => {
                                        if (result.length > 0) {
                                            let user = result[0];
                                            let {
                                                chatIdentifier,
                                                communityIdentifier,
                                                adminSocialID,
                                                socialName,
                                                sourceURL
                                            } = user;
    
                                            if (chatIdentifier == userId) {
                                                if (!!sourceURL && !!communityIdentifier) {
                                                    const PageParser = require("./PageParser.js");
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
                                                            bot.sendMessage(chatIdentifier, "Під час парсингу сторінки сталася невідома помилка.");
                                                            break;
                                                    }
                                                }
                                            }
    
                                        }
                                    }).catch(err => {
                                        console.log(err);
                                    });
                                }                                
                            }
                        }).catch(err => {
                            console.log('- - - - - - - - [ Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ Error ] - - - - - - - -');
                            bot.sendMessage(userId, '❗ Чат більше не існує, або бота було видалено з чату, або власник покинув канал / групу.');
                            new DB().removeCommunity(communityId, bot, userId);
                            new DB().query(`DELETE FROM socialpost WHERE adminSocialID = (SELECT adminSocialID FROM adminsocial WHERE adminsocial.adminID = ${creatorId})`).catch(err => {
                                console.log('- - - - - - - - [ SQL Error ] - - - - - - - -\n\n' + err + '\n\n- - - - - - - - [ SQL Error ] - - - - - - - -');
                            });
                            clearInterval(parsingInterval);
                        });
                    }
                    startParsing();
                }
            }).catch(err => {
                console.log(err);
            });

        connection.end();
        return;
    }
    removeCommunity(communityId, bot, userId) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        connection.query(`DELETE FROM admincommunity WHERE adminID = (SELECT adminID FROM admin WHERE admin.chatIdentifier='${userId}') AND communityIdentifier = '${communityId}'`)
            .then(() => {
                bot.sendMessage(userId, '⛔ Група була успішно видалена з бази даних!');
            }).catch(err => {
                console.log(err);
            });
        connection.end();
        return;
    }
    addSocialNetwork(userId, socialId) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        connection.query(`SELECT (SELECT socialID FROM socialnetwork WHERE name LIKE '${socialId}') social_Id, (SELECT adminID FROM admin WHERE chatIdentifier LIKE '${userId}') admin_Id`).then(([data, cols]) => {
            let {
                social_Id,
                admin_Id
            } = data[0];
            let SELECT_adminsocial = mysql.createConnection(db_config).promise();
            SELECT_adminsocial.query(`SELECT * FROM adminsocial WHERE adminID=${admin_Id}`)
                .then(([data, cols]) => {
                    let query;
                    if (!!data.length) {
                        query = mysql.createConnection(db_config).promise();
                        query.query(`UPDATE adminsocial SET socialID='${social_Id}', sourceURL='' WHERE adminID=${admin_Id}`).catch(err => {
                            console.log(err);
                        });
                        query.end();
                    } else {
                        query = mysql.createConnection(db_config).promise();
                        query.query(`INSERT INTO adminsocial (socialID, adminID, sourceURL) VALUES ('${social_Id}', '${admin_Id}', '')`).catch(err => {
                            console.log(err);
                        });
                        query.end();
                    }
                }).catch(err => {
                    console.log(err);
                });
            SELECT_adminsocial.end();
        }).catch(err => {
            console.log(err);
        });
        connection.end();
    }
    addSocialNetworkLink(userId, link, activeUsers) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        connection.query(`SELECT adminID FROM admin WHERE chatIdentifier LIKE '${userId}'`).then(([data, cols]) => {
            const {
                adminID
            } = data[0];
            if (!!data.length) {
                let UPDATEadminsocial = mysql.createConnection(db_config).promise();
                UPDATEadminsocial.query(`UPDATE adminsocial SET sourceURL='${link}' WHERE adminID=${adminID}`).catch(err => {
                    console.log(err);
                });
                UPDATEadminsocial.end();
            }
        }).catch(err => {
            console.log(err);
        });
        connection.end();
        return;
    }
    addNewPost(adminID, postToken, communityIdentifier) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        connection.query(`INSERT INTO socialpost (adminSocialID, sourceURL, communityIdentifier) VALUES ('${adminID}', '${postToken}', '${communityIdentifier}')`).catch(err => {
            console.log(err);
        });
        connection.end();
    }
    checkPostExistance(adminSocialID, postToken, communityIdentifier) {
        const mysql = require("mysql2");
        const connection = mysql.createConnection(db_config).promise();
        let output = connection.query(`SELECT postID FROM socialpost WHERE adminSocialID = ${adminSocialID} AND sourceURL LIKE '${postToken}' AND communityIdentifier = ${communityIdentifier}`).then(([data, cols]) => {
            return data;
        }).catch(err => {
            console.log(err);
        });
        connection.end();
        return output;
    }
}
module.exports = DB;
