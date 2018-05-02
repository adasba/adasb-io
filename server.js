const http = require('http');
const fs = require('fs');
const url = require('url');
const compression = require('compression');

var sentData;
var oD = [];
var outputs = [];
var pD = [];
var mines = [{ x: Math.random() * 1920, y: Math.random() * 1080, resources: 1000, type: "score" }, { x: Math.random() * 1920, y: Math.random() * 1080, resources: 1000, type: "score" }, { x: Math.random() * 1920, y: Math.random() * 1080, resources: 1000, type: "score" }];

var t1;
var t2;
var t3;

var temp1 = false;
var tempX = 0;
var tempY = 0;

var closeID = -1;
var closeDist = 99999;

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function findPlayer(identify) {
    var fPTimer;
    for (fPTimer = 0; pD.length > fPTimer; fPTimer++) {
        if (identify == pD[fPTimer].id) {
            return fPTimer;
        }
    }
}


function dist(xDist, yDist) {
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

const server = http.createServer((req, res) => {
    var urlPath = url.parse(req.url).pathname;
    if (urlPath.includes("htmls")) {
        fs.readFile(urlPath.slice(7), function (err, data) {
            res.writeHead(200, { 'content-type': 'text/html' });
            res.end(data);
        });
    }
    if (urlPath.includes("game")) {
        fs.readFile(urlPath.slice(1), function (err, data) {
            res.writeHead(200, { 'content-type': 'text/html' });
            res.end(data);
        });
    }
    if (urlPath.includes("control")) {
        if (isJsonString(decodeURI(urlPath.slice(9)))) {
            sentData = JSON.parse(decodeURI(urlPath.slice(9)));
            //console.log(oD);
            temp1 = false;
            for (t1 = 0; pD.length > t1; t1++) {
                if (sentData.id == pD[t1].id) {
                    temp1 = true;
                }
            }
            if (temp1 == false) {
                pD.push({ id: sentData.id, cash: 100, id2: Math.random() })
                tempX = Math.random() * 5000 - 2500;
                tempY = Math.random() * 5000 - 2500;
                oD.push({ x: tempX, y: tempY, id: sentData.id, type: "connect", time: 200, hP: 100, die: false });
            } else {
                tempX = false;
                tempY = false;
            }
            temp1 = false;
            if (sentData.mice2[0] && sentData.wheel2 != 0) {
                for (t1 = 0; oD.length > t1; t1++) {
                    if (oD[t1].type == "connect" && oD[t1].id == sentData.id && dist(oD[t1].x - (sentData.mx + sentData.xPos), oD[t1].y - (sentData.my + sentData.yPos)) < 175) {
                        temp1 = true;
                    }
                }
            }
            if (temp1) {
                if (sentData.mice2[0] && pD[findPlayer(sentData.id)].cash >= 15 && sentData.wheel2 == 1) {
                    oD.push({ x: sentData.mx + sentData.xPos, y: sentData.my + sentData.yPos, id: sentData.id, type: "defend", time: 50, hP: 100, die: false });
                    pD[findPlayer(sentData.id)].cash += -15;
                }
                if (sentData.mice2[0] && pD[findPlayer(sentData.id)].cash >= 10 && sentData.wheel2 == 2) {
                    oD.push({ x: sentData.mx + sentData.xPos, y: sentData.my + sentData.yPos, id: sentData.id, type: "mine", time: 200, hP: 100, die: false });
                    pD[findPlayer(sentData.id)].cash += -10;
                }
                if (sentData.mice2[0] && pD[findPlayer(sentData.id)].cash >= 5 && sentData.wheel2 == 3) {
                    oD.push({ x: sentData.mx + sentData.xPos, y: sentData.my + sentData.yPos, id: sentData.id, type: "connect", time: 200, hP: 100, die: false });
                    pD[findPlayer(sentData.id)].cash += -5;
                }
            }
            outputs = [];
            for (t1 = 0; oD.length > t1; t1++) {
                if (Math.abs(oD[t1].x - (sentData.xPos) - 960) < 1160 && Math.abs(oD[t1].y - (sentData.yPos) - 540) < 740) {
                    outputs.push(JSON.parse(JSON.stringify(oD[t1])));
                    if (outputs[outputs.length - 1].id == sentData.id) {
                        outputs[outputs.length - 1].id = true;
                    } else {
                        outputs[outputs.length - 1].id = pD[findPlayer(oD[outputs.length - 1].id)].id2;
                    }
                }
            }
            for (t1 = 0; mines.length > t1; t1++) {
                outputs.push(JSON.parse(JSON.stringify(mines[t1])));
            }
            outputs.push(JSON.parse(JSON.stringify(pD[findPlayer(sentData.id)])));
            outputs[outputs.length - 1].type = "playerInfo";
            outputs[outputs.length - 1].px = tempX;
            outputs[outputs.length - 1].py = tempY;
            res.end(JSON.stringify(outputs));
        }
        res.end("go away");
    }
});

function loop() {
    for (t2 = 0; oD.length > t2; t2++) {
        if (oD[t2].type == "defend") {
            oD[t2].time--;
            if (oD[t2].time < 0) {
                closeDist = 99999999;
                closeID = -1;
                for (t3 = 0; oD.length > t3; t3++) {
                    if (oD[t2].id != oD[t3].id && oD[t3].type != "bullet") {
                        if (closeDist > dist(oD[t3].x - oD[t2].x, oD[t3].y - oD[t2].y)) {
                            closeDist = dist(oD[t3].x - oD[t2].x, oD[t3].y - oD[t2].y);
                            closeID = t3;
                        }
                    }
                }
                if (closeID != -1 && closeDist < 275) {
                    oD.push({ x: oD[t2].x, y: oD[t2].y, id: oD[t2].id, type: "bullet", time: 70, hP: 25, die: false, dir: Math.atan2(oD[closeID].y - oD[t2].y, oD[closeID].x - oD[t2].x) });
                    oD[t2].time = 50;
                }
            }
            if (oD[t2].hP < 0) {
                oD[t2].die = true;
            }
        }
        if (oD[t2].type == "bullet") {
            oD[t2].time--;
            oD[t2].x += Math.cos(oD[t2].dir) * 8;
            oD[t2].y += Math.sin(oD[t2].dir) * 8;
            for (t3 = 0; oD.length > t3; t3++) {
                if (oD[t2].id != oD[t3].id && dist(oD[t3].x - oD[t2].x, oD[t3].y - oD[t2].y) < 30) {
                    oD[t2].hP += -5;
                    oD[t3].hP += -5;
                }
            }
            if (oD[t2].time < 0 || oD[t2].hP < 0) {
                oD[t2].die = true;
            }
        }
        if (oD[t2].type == "mine") {
            oD[t2].time--;
            if (oD[t2].time < 0) {
                closeDist = 99999999;
                closeID = -1;
                for (t3 = 0; mines.length > t3; t3++) {
                    if (closeDist > dist(mines[t3].x - oD[t2].x, mines[t3].y - oD[t2].y)) {
                        closeDist = dist(mines[t3].x - oD[t2].x, mines[t3].y - oD[t2].y);
                        closeID = t3;
                    }
                }
                if (closeID != -1 && closeDist < 200) {
                    oD.push({ x: oD[t2].x, y: oD[t2].y, id: oD[t2].id, type: "bullet2", time: 70, hP: 1, die: false, dir: Math.atan2(mines[closeID].y - oD[t2].y, mines[closeID].x - oD[t2].x) });
                    oD[t2].time = 200;
                }
            }
            if (oD[t2].hP < 0) {
                oD[t2].die = true;
            }
        }
        if (oD[t2].type == "bullet2") {
            oD[t2].time--;
            oD[t2].x += Math.cos(oD[t2].dir) * 8;
            oD[t2].y += Math.sin(oD[t2].dir) * 8;
            for (t3 = 0; mines.length > t3; t3++) {
                if (oD[t2].id != mines[t3].id && dist(mines[t3].x - oD[t2].x, mines[t3].y - oD[t2].y) < 30) {
                    oD[t2].hP += -2;
                    mines[t3].resources += -2;
                    pD[findPlayer(oD[t2].id)].cash += 2;
                }
            }
            if (oD[t2].time < 0 || oD[t2].hP < 0) {
                oD[t2].die = true;
            }
        }
        if (oD[t2].type == "connect") {
            if (oD[t2].hP < 0) {
                oD[t2].die = true;
            }
        }
    }
    for (t2 = 0; oD.length > t2; t2++) {
        if (oD[t2].die) {
            oD.splice(t2, 1);
        }
    }
    for (t2 = 0; mines.length > t2; t2++) {
        if (mines[t2].resources < 0) {
            mines.splice(t2, 1);
        }
    }
    if (Math.random() > 0.8) {
        if (mines.length < 60) {
            mines.push({ x: Math.random() * 6000 - 3000, y: Math.random() * 6000 - 3000, resources: 1000, type: "score" })
        }
    }
    //requestAnimationFrame(loop);   
    setTimeout(loop, 20);
}
loop();
server.listen(80);