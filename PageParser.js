const Nightmare = require('nightmare');
const cheerio = require('cheerio');
const fs = require('fs');
const download = require('download');
const DB = require('./db');

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};
Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

class PageParser {

    constructor() {
        console.log('Class initialized');
    }

    evaluatePage(url, id, bot, activeUsers) {
        const nightmare = new Nightmare({
            show: true
        });
        nightmare.goto(url)
            .wait(5000)
            .evaluate((done) => {
                done(null, document.body.innerHTML);
            })
            .end()
            .then(response => {
                console.log("31: " + getData(response));
                if (getData(response)) {
                    new DB().addSocialNetworkLink(id, url, activeUsers);
                    new DB().query(`SELECT * FROM admincommunity WHERE adminID = (SELECT adminId FROM admin WHERE admin.chatIdentifier = '${id}')`).then(([data, cols]) => {
                        if (data === undefined) {
                            return bot.sendMessage(id, "✅ Чудово! Тепер додайте бота в канал або группу як адміністратора та напишіть у групу команду /add_channel", {
                                "reply_markup": {
                                    hide_keyboard: false,
                                    "keyboard": [
                                        ["🔃 Змінити соціальну мережу"],
                                    ]
                                }
                            });
                        } else {
                            return bot.sendMessage(id, "✅ Посилання було успішно змінено!", {
                                "reply_markup": {
                                    hide_keyboard: false,
                                    "keyboard": [
                                        ["➕ Додати спільноту"],
                                        ["🔃 Змінити соціальну мережу"],
                                        ["❌ Відв'язати группу"]
                                    ]
                                }
                            });
                        }
                    }).catch(err => {
                        console.log(err);
                    });

                } else {
                    bot.sendMessage(id, "⛔ Нажаль такої сторінки не існує, або вона приватна, або відсутні публікації. Спробуйте ще раз надіслати посилання:");
                }
            }).catch(err => {
                console.log("28: " + err);
            });

        function getData(html) {
            const $ = cheerio.load(html);
            if (/(glyphsSpriteCamera__outline__24__grey_9)|(Это закрытый аккаунт)|(Хмм... Такой страницы не существует)|(Действие учетной записи приостановлено)|(Закрытая)|(Эти твиты защищены)|(Такой учетной записи нет)|(\/images\/comet\/empty_states_icons\/permissions\/permissions_gray_wash\.svg)|(https:\/\/static\.xx\.fbcdn\.net\/rsrc\.php\/v3\/yF\/r\/sPR7vMTpxtC\.png)|(data-pagelet="ProfileTimeline")/g.test($("body").html())) {
                return false;
            } else {
                return true;
            }
        }
    }
    parseFacebook(url, id, bot, adminSocialID) {
        const nightmare = new Nightmare({
            show: true
        });
        nightmare.goto(url)
            .wait(5000)
            .scrollTo(400, 0)
            .wait(5000)
            .evaluate((done) => {
                
                let arrText = [];
                let arrImg = [];
                let arrVideoLink = [];

                let flag = false;
                let postLast = document.querySelector("div[role='article']");
                let text = postLast.querySelectorAll("div:nth-child(1)>span[dir='auto'] div div");

                text.forEach((item, i) => {
                    if (item.children[0]) {
                        let btn = item.children[0];
                        btn.click();
                    }
                });

                if (postLast.querySelector("div:nth-child(1)>span[dir='auto'] div div[role='button']")) {
                    console.log('82' + document.querySelector("div[role='article']").querySelector("div:nth-child(1)>span[dir='auto'] div div[role='button']").click());
                    document.querySelector("div[role='article']").querySelector("div:nth-child(1)>span[dir='auto'] div div[role='button']").click();
                }
                if (document.querySelector("div[role='article']").querySelector("div span div[role='button']")) {
                    console.log('112' + document.querySelector("div[role='article']").querySelector("div span div[role='button']").click());
                    document.querySelector("div[role='article']").querySelector("div span div[role='button']").click();
                }
                
                setTimeout(() => {

                    console.log("85:");
                    if (document.querySelector("div[role='article']").querySelector("div:nth-child(1)>span[dir='auto'] a")) {
                        if (/(поделился публикацией.)|(поделилась публикацией.)/g.test(document.querySelector("div[role='article']").querySelector("div:nth-child(1)>span[dir='auto']").textContent)) {
                            arrText.push('Автор поділився публікацією та додав підпис :');
                        }
                    } else if (document.querySelector("div[role='article']").querySelectorAll("span[dir='auto'] h2")[0]) {
                        if (/(поделилась ссылкой.)|(поделился ссылкой.)/g.test(document.querySelector("div[role='article']").querySelectorAll("span[dir='auto'] h2")[0].textContent)) {
                            arrText.push('Автор поділився публікацією та додав підпис :');
                        }

                    }
                    if (document.querySelector("div[role='article']").querySelectorAll("div:not([class])>div[dir='auto'] div[data-ad-preview='message'] span[dir='auto']>div:nth-of-type(1)>div[dir='auto']").length) {
                        document.querySelector("div[role='article']").querySelectorAll("div:not([class])>div[dir='auto'] div[data-ad-preview='message'] span[dir='auto']>div>div[dir='auto']").forEach(div => {
                            for (let n = 0; n < div.childNodes.length; n++) {
                                if (div.childNodes[n].lastElementChild) {
                                    if (!!div.childNodes[n].lastElementChild.alt) {
                                        arrText.push(div.childNodes[n].lastElementChild.alt);
                                    } else {
                                        console.log('93:' + div.childNodes[n].lastElementChild.alt);
                                    }
                                }
                                if (!!div.childNodes[n].lastElementChild) {
                                    console.log('100' + div.childNodes[n].lastElementChild.tagName);

                                    if (!!div.childNodes[n].lastElementChild.href) {
                                        arrText.push('\n' + div.childNodes[n].lastElementChild.textContent + '\n');
                                    } else {
                                        console.log('error ' + "103:" + div.childNodes[n].tagName);
                                    }

                                } else if (!!div.childNodes[n]) {
                                    arrText.push(div.childNodes[n].textContent.length ? div.childNodes[n].textContent : '');
                                }
                            }
                        });
                    }
                    if (document.querySelector("div[role='article']").querySelectorAll("div:not([class])>div[dir='auto']>div>span>div").length) {
                        document.querySelector("div[role='article']").querySelectorAll("div:not([class])>div[dir='auto']>div>span>div").forEach(text => {
                            for (let n = 0; n < text.childNodes.length; n++) {
                                if (!!text.childNodes[n].lastElementChild) {
                                    if (!!text.childNodes[n].lastElementChild.alt) {
                                        arrText.push(text.childNodes[n].lastElementChild.alt);
                                    } else {
                                        console.log('93:' + text.childNodes[n].lastElementChild.alt);
                                    }
                                }
                                if (!!text.childNodes[n].lastElementChild) {
                                    console.log('100' + text.childNodes[n].lastElementChild.tagName);

                                    if (!!text.childNodes[n].lastElementChild.href) {
                                        arrText.push('\n' + div.childNodes[n].lastElementChild.textContent + '\n');
                                    } else {
                                        console.log('error ' + "103:" + text.childNodes[n].tagName);
                                    }

                                }
                                if (!!text.childNodes[n]) {
                                    arrText.push(text.childNodes[n].textContent.length ? text.childNodes[n].textContent : '');
                                }
                            }
                        });
                    }
                    console.log('159' + arrText);
                    
                    if (document.querySelector("div[role='article']").querySelector("div[dir='auto'] div div[aria-hidden='true']+div")) {
                        if (document.querySelector("div[role='article']").querySelector("div[dir='auto'] div div[aria-hidden='true']+div").textContent.length) {
                            for (let n = 0; n < document.querySelector("div[role='article']").querySelector("div[dir='auto'] div div[aria-hidden='true']+div div div").childNodes.length; n++) {
                                if (document.querySelector("div[role='article']").querySelector("div[dir='auto'] div div[aria-hidden='true']+div div div").childNodes[n].firstChild) {
                                    arrText.push(document.querySelector("div[role='article']").querySelector("div[dir='auto'] div div[aria-hidden='true']+div div div").childNodes[n].firstChild.alt);
                                } else {
                                    arrText.push(document.querySelector("div[role='article']").querySelector("div[dir='auto'] div div[aria-hidden='true']+div div div").childNodes[n].textContent);
                                }
                            }
                            console.log('96:' + arrText);
                        }
                    }
                }, 1000);

                postLast.querySelectorAll("div:nth-child(1) a[role='link']").forEach(item => {
                    if (item.textContent.indexOf("и ещё") != -1) {
                        flag = true;
                        item.click();
                    }
                });

                if (flag) {
                    let fullImagePost = setInterval(() => {
                        arrImg.push(document.querySelector("body div[role='dialog'] div[role='main'] img").src);
                        document.querySelectorAll("body div[role='dialog'] div[role='main'] div[data-visualcompletion='ignore-dynamic'] div[role='button']")[1].click();

                        if (arrImg[0] == arrImg[arrImg.length - 1]) {
                            if (arrImg.length - 1 != 0) {
                                arrImg.pop();
                                clearInterval(fullImagePost);
                            }
                        }
                    }, 1000);
                }
                else {
                    let img = postLast.querySelectorAll("div:nth-child(1) a div img:not([role])");
                    if (img) {
                        img.forEach(item => {
                            arrImg.push(item.src);
                        });
                    }
                }
                postLast.querySelectorAll("a[role='link']").forEach(link => {
                    if (link.href.indexOf("video") != -1) {
                        arrVideoLink.push(link.href);
                    }
                });
                setTimeout(() => {
                    console.log("test ....");
                    done(null, {
                        text: arrText,
                        img: arrImg,
                        linkVideo: arrVideoLink,
                        postId: postLast.querySelector('span[dir="auto"] span span a[role="link"]').href.match(/(\d+)(?:\?|\/?)/g)[0].replace(/(\?|\/)/g, '')
                    });
                }, 10000);
            })
            .end()
            .then(response => {
                getData(response);
            }).catch(err => {
                console.log("133: " + err);
            });

        function videoDown(url, name, disk) {
            (async () => {
                await download(url, disk); 
                download(url.replace(/https:\/\//g, "")).pipe(fs.createWriteStream(`${disk}/${name}.mp4`));
            })();
        }


        function getData(response) {
            if (!response) {
                return;
            }

            let {
                text,
                img,
                linkVideo,
                postId
            } = response;
            console.log(text, linkVideo);

            let mediaArray = [];
            if (img.length > 0) {
                img.forEach(image => {
                    mediaArray.push({
                        type: "photo",
                        media: image
                    });
                });

                if (linkVideo.length == 0) {
                    new DB().checkPostExistance(adminSocialID, postId, id).then((data) => {
                        if (!data.length) {
                            new DB().addNewPost(adminSocialID, postId, id);
                            mediaArray[0].caption = text.length == 0 ? '' : text.join('');
                            return bot.sendMediaGroup(id, mediaArray);
                        } else {
                            console.log("Facebook: Post already exists");
                        }
                    }).catch(err => {
                        console.log("365: Error");
                    });
                }
            }

            function pushVideo(res, i) {
                videoDown(res, `post_${i+1}`, `${id}`);
                setTimeout(() => {
                    mediaArray.push({
                        type: "video",
                        media: `${id}/post_${i+1}.mp4`
                    });
                }, 35000);

                setTimeout(() => {
                    if (i == linkVideo.length - 1) {
                        console.log("141: " + JSON.stringify(mediaArray));

                        new DB().checkPostExistance(adminSocialID, postId, id).then((data) => {
                            if (!data.length) {
                                new DB().addNewPost(adminSocialID, postId, id);
                                mediaArray[0].caption = text.length == 0 ? '' : text.join('');

                                return bot.sendMediaGroup(id, mediaArray);
                            } else {
                                console.log("Facebook: Post already exists");
                            }
                        }).catch(err => {
                            console.log("395: Error");
                        });
                    }
                }, 60000);
            }

            if (linkVideo.length > 0) {
                linkVideo.forEach((videoURL, i) => {
                    const nightmare = new Nightmare({
                        show: true
                    });
                    nightmare.goto('https://ru.savefrom.net/9-how-to-download-facebook-video-32.html')
                        .wait(4000)
                        .insert('input', videoURL)
                        .click('button')
                        .wait('div a[download]')
                        .evaluate((done) => {
                            setTimeout(() => {
                                done(null, document.querySelector("div a[download]").href);
                            }, 1000);
                        })
                        .end()
                        .then(response => {
                            pushVideo(response, i);
                            console.log("166: " + JSON.stringify(mediaArray[0]));
                        })
                        .catch(err => {
                            console.log("162" + err);
                        });
                });
            }

            if (img.length == 0 && linkVideo.length == 0) {
                console.log("!img.length && !linkVideo.length", text);
                new DB().checkPostExistance(adminSocialID, postId, id).then((data) => {
                    if (!data.length) {
                        new DB().addNewPost(adminSocialID, postId, id);
                        return bot.sendMessage(id, !text.length ? '' : text.join(''));
                    } else {
                        console.log("Facebook: Post already exists");
                    }
                }).catch(err => {
                    console.log("449: Error");
                });
            }
        }
    }
    parseTwitter(url, id, bot, adminSocialID) {
        const nightmare = new Nightmare({
            show: true
        });
        nightmare.goto(url)
            .wait(5000)
            .scrollTo(400, 0)
            .wait(5000)
            .evaluate((done) => {
                console.log("test.... 218");
                let arrText = [];
                let arrImage = [];
                let linkVideo = [];
                let lastPost = [...document.querySelectorAll("article[data-testid='tweet']")].filter(item => !(/Закрепленный твит/g.test(item.innerHTML)))[0];

                let text = lastPost.querySelector("div[lang][dir='auto']");
                console.log("text????");

                if (text) {
                    for (let n = 0; n < lastPost.querySelector("div[data-testid='tweetText']").childNodes.length; n++) {
                        if (lastPost.querySelector("div[data-testid='tweetText']").childNodes[n].tagName == 'IMG') {
                            arrText.push(lastPost.querySelector("div[data-testid='tweetText']").childNodes[n].alt);
                        } else if (lastPost.querySelector("div[data-testid='tweetText']").childNodes[n].tagName == 'A') {
                            arrText.push(lastPost.querySelector("div[data-testid='tweetText']").childNodes[n].href);
                        } else {
                            arrText.push(lastPost.querySelector("div[data-testid='tweetText']").childNodes[n].textContent);
                        }
                    }
                    if (lastPost.querySelector("[data-testid='card.layoutLarge.detail']")) {
                        arrText.push(`\nСсылка на источника ${lastPost.querySelector("[data-testid='card.layoutLarge.detail']").parentElement.href}\n`);
                    }
                }
                lastPost.querySelectorAll("div[data-testid='tweetPhoto'] img").forEach(img => arrImage.push(img.src));

                let IssetvideoURL = lastPost.querySelectorAll('div[data-testid="videoPlayer"]');

                if (IssetvideoURL.length && !lastPost.querySelectorAll('div[role="link"] div[data-testid="videoPlayer"]').length) {
                    linkVideo.push(lastPost.querySelector('time').parentElement.href.replace(/https:\/\//g, "https://sss"));
                }

                setTimeout(() => {
                    done(null, {
                        text: arrText,
                        img: arrImage,
                        video: linkVideo,
                        postId: lastPost.querySelector('time').parentElement.href.replace(/[^\d]/g, '')
                    });
                }, 3000);
            })
            .end()
            .then(res => {
                getDataTwitter(res);
            }).catch(err => {
                console.log(err + "err");
            });
        function videoDown(url, name, disk) {
            (async () => {                 
                await download(url, disk);                  
                download(url.replace(/https:\/\//g, "")).pipe(fs.createWriteStream(`${disk}/${name}.mp4`));
            })();
        }

        function getDataTwitter(response) {
            let {
                text,
                img,
                video,
                postId
            } = response;

            let mediaArray = [];

            if (img.length) {
                img.forEach(image => {
                    mediaArray.push({
                        type: "photo",
                        media: image
                    });
                });

                if (video.length == 0) {
                    new DB().checkPostExistance(adminSocialID, postId, id).then((data) => {
                        if (!data.length) {
                            new DB().addNewPost(adminSocialID, postId, id);
                            mediaArray[0].caption = text.length == 0 ? '' : text.join('');
                            return bot.sendMediaGroup(id, mediaArray);
                        } else {
                            console.log("Twitter: Post already exists");
                        }
                    }).catch(err => {
                        console.log("564: Error");
                    });
                }
            }

            function pushVideo(response) {
                videoDown(response, "tweetPost", `${id}`);
                setTimeout(() => {
                    mediaArray.push({
                        type: "video",
                        media: id + "/tweetPost.mp4"
                    });
                }, 5000);
                setTimeout(() => {
                    new DB().checkPostExistance(adminSocialID, postId, id).then((data) => {
                        if (!data.length) {
                            new DB().addNewPost(adminSocialID, postId, id);
                            mediaArray[0].caption = text.length == 0 ? '' : text.join('');
                            return bot.sendMediaGroup(id, mediaArray);
                        } else {
                            console.log("Twitter: Post already exists");
                        }
                    }).catch(err => {
                        console.log("586: Error");
                    });
                    console.log("300: " + JSON.stringify(mediaArray));
                }, 10000);
            }
            if (video.length) {
                console.log("video????");
                console.log(video);
                const nightmare = new Nightmare({
                    show: true
                });
                nightmare.goto(video[0])
                    .wait(4000)
                    .evaluate((done) => {
                        setTimeout(() => {
                            done(null, document.querySelector("a[href^='https://video']").href.replace(/\?tag=[0-9]{1,}/g, ""));
                        }, 1000);
                    })
                    .end()
                    .then(res => {
                        console.log(res);
                        pushVideo(res);
                    }).catch(err => {
                        console.log(err + "error");
                    });

            }
            if (img.length == 0 && video.length == 0) {
                new DB().checkPostExistance(adminSocialID, postId, id).then((data) => {
                    if (!data.length) {
                        new DB().addNewPost(adminSocialID, postId, id);
                        return bot.sendMessage(id, text.length == 0 ? '' : text.join(''));
                    } else {
                        console.log("Twitter: Post already exists");
                    }
                }).catch(err => {
                    console.log("632: Error");
                });
            }
        }

    }
    parseInsragram(url, id, bot, adminSocialID) {
        let parseURL = `${url}?__a=1`;
        const nightmare = new Nightmare({
            show: true
        });
        nightmare.goto(parseURL)
            .wait(2000)
            .evaluate((done) => {
                done(null, document.querySelector('pre').textContent.trim());
            })
            .end()
            .then(res => {
                let {
                    graphql
                } = JSON.parse(res);
                let {
                    user
                } = graphql;
                let media = [];
                let texts = [];
                user.edge_felix_video_timeline.edges.forEach(node => {
                    user.edge_owner_to_timeline_media.edges.push(node);
                });

                let lastPostTimestamp = user.edge_owner_to_timeline_media.edges.map(node => node.node.taken_at_timestamp).max();
                let lastPost = user.edge_owner_to_timeline_media.edges.filter(item => item.node.taken_at_timestamp === lastPostTimestamp)[0].node;

                if (lastPost?.edge_media_to_caption) {
                    lastPost.edge_media_to_caption.edges.forEach(node => {
                        texts.push(node.node.text);
                    });
                }

                if (lastPost?.edge_sidecar_to_children) {
                    if (lastPost.is_video) {
                        lastPost.edge_sidecar_to_children.edges.forEach(video => {
                            media.push({
                                type: 'video',
                                media: video.node.video_url
                            });
                        });
                        return;
                    } else {
                        lastPost.edge_sidecar_to_children.edges.forEach(photo => {
                            media.push({
                                type: 'photo',
                                media: photo.node.display_url
                            });
                        });
                        return;
                    }
                } else {
                    if (lastPost.is_video) {
                        media.push({
                            type: 'video',
                            media: lastPost.video_url
                        });
                    } else {
                        media.push({
                            type: 'photo',
                            media: lastPost.display_url
                        });
                    }
                }
                media[0].caption = texts.join('');
                new DB().checkPostExistance(adminSocialID, lastPost.id, id).then((data) => {
                    if (!data.length) {
                        new DB().addNewPost(adminSocialID, lastPost.id, id);
                        return bot.sendMediaGroup(id, media);
                    } else {
                        console.log("Instagram: Post already exists");
                    }
                }).catch(err => {
                    console.log("650: Error");
                });
            }).catch(err => {
                console.log("654: Error " + err);
            });
    }
}
module.exports = PageParser;