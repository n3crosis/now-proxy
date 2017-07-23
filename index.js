const express = require('express');
const rp = require('request-promise');
let j = rp.jar();
let refno = 'NPWC' + new Date().getTime();

let now = {
    url: ['http://nowplayer.now.com/acceptTnc?callerReferenceNo=',
        'https://nowplayer.now.com/live/play?callback=angular.callbacks._0&channelNo=332&deviceId=&format=HLS&callerReferenceNo='],
};
const app = express();

async function init() {
    console.log('fetching key....')
    refno = 'NPWC' + new Date().getTime();
    j = rp.jar();

    await (rp({
        url: now.url[0] + refno,
        jar: j
    }));
    let data = await (rp({
        url: now.url[1] + refno,
        jar: j
    }));
    let parse = JSON.parse(data.match(/angular\.callbacks\._0\((.*)\)/)[1])
        .assetList[0].match(/(.*)index.m3u8\?token=([\w]*)/);
    now.link = parse[1];
    now.token = parse[2];
    setTimeout(init, 1800000);
    console.log(now);
}


function getData(req, res) {
    let url = req.originalUrl.slice(1, req.originalUrl.length);
    if (url.indexOf('index.m3u8') > -1) {
        url += '?token=' + now.token;
    }
    if (/m3u8/.test(url)) {
        res.header({
            'Content-Type': 'application/vnd.apple.mpegURL'
        });
    }
    if (/segment.ts/.test(url)) {
        res.header({
            'content-type': 'video/mp2t'
        });
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log(now.link + url);
    rp({
        url: now.link + url,
        encoding: /segment.ts/.test(url) ? null : undefined,
        jar: j
    }).then(data => {
        res.send(data);
    }).catch(function () {
        res.status(403);
    })
};

app.get('/', function (req, res, next) {
    res.redirect('/index.m3u8');
});

app.use(/\/.*/, function (req, res, next) {
    getData(req, res);
});

const port = 3001;
app.listen(port, err => {
    if (err) {
        throw err;
    }
    init();

    console.log(`listening on port ${port}!`);
});

