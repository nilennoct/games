(function (window) {
    var NGAME = {};

    NGAME.util = {
        randInt: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        generateNumbers: function () {
            return [NGAME.util.randInt(3, 9), NGAME.util.randInt(3, 14)];
        },
        generateDelta: function () {
            return (NGAME.util.randInt(0, 1) * 2 + 1) * (Math.random() < 0.5 ? -1 : 1);
        },
        generateOperator: function () {
            return Math.random() < 0.5 ? '+' : '-';
        },
        bindTap: function (dom, callback) {
            if ('ontouchend' in window) {
                var touchStartPoint, touchStartTime;
                dom.addEventListener('touchstart', function (event) {
                    touchStartPoint = event.touches[0];
                    touchStartTime = event.timestamp;
                });
                dom.addEventListener('touchend', function (event) {
                    var touchEndPoint = event.changedTouches[0];
                    if (event.timestamp - touchStartTime >= 400) {
                        return;
                    }
                    if (Math.max(Math.abs(touchEndPoint.clientX - touchStartPoint.clientX), Math.abs(touchEndPoint.clientY - touchStartPoint.clientY)) > 10) {
                        return;
                    }
                    callback.call(dom, event);
                    event.preventDefault();
                });
                dom.addEventListener('click', function (event) {
                    event.preventDefault();
                });
            }
            else {
                dom.addEventListener('click', function (event) {
                    callback.call(dom, event);
                });
            }
        },
        show: function (dom) {
            dom.style.cssText = 'display: block;';
        },
        hide: function (dom) {
            dom.style.cssText = 'display: none;';
        }
    };

    NGAME.status = (function () {
        var status = 0;
        var score = -1;
        var equal = null;

        return {
            check: function () {
                return status === 0;
            },
            getEqual: function () {
                return equal;
            },
            next: function () {
                if (status === 1) {
                    return;
                }
//                NGAME.ui.process.className = '';
                NGAME.ui.process.style.cssText = 'width: 0%;';
                NGAME.ui.score.innerText = ++score;
                if (score === 25 || score === 50 || score === 80) {
//                if (score === 1 || score === 2 || score === 3) {
                    NGAME.timer.speedUp();
                }
                equal = NGAME.process();
            },
            end: function () {
                status = 1;
                NGAME.timer.clearTimer();
//                NGAME.ui.process.className = '';
//                NGAME.ui.process.style.cssText = 'width: 0%;';
                NGAME.ui.result.innerHTML = '<p>游戏结束</p><p>最终得分：' + score + '</p>';
                NGAME.ui.restartBtn.innerText = '► 重试';
                NGAME.share.desc = '我得了' + score + '分，你能算得比我快吗？速算小游戏，看谁算得快？';
                NGAME.util.show(NGAME.ui.mask);
            },
            reset: function () {
                score = -1;
                NGAME.ui.score.innerText = status = 0;
//                NGAME.ui.process.className = '';
                NGAME.share.desc = '速算小游戏，看谁算得快？';
                NGAME.util.hide(NGAME.ui.mask);
                NGAME.status.next();
            }
        }
    })();

    NGAME.timer = (function () {
        var timer = null;
        var duration = 2000;

        return {
            speedUp: function () {
                duration /= 2;
            },
            clearTimer: function () {
                clearTimeout(timer);
            },
            resetTimer: function () {
                clearTimeout(timer);
                var ms = 0;
//                NGAME.ui.process.className = 'animation';
                NGAME.ui.process.style.cssText = 'width: 0%;';
//                NGAME.ui.process.style.cssText = 'width: 10%;';
                timer = setInterval(function () {
                    ms += duration / 10;
                    NGAME.ui.process.style.cssText = 'width: ' + ms / duration * 100 + '%;';
                    if (ms >= duration) {
                        NGAME.status.end();
                    }
//                    NGAME.ui.process.style.cssText = 'width: ' + (ms + 200) / 20 + '%;';
                }, duration / 10);
            }
        }
    })();

    NGAME.process = function () {
        var numbers = NGAME.util.generateNumbers();
        var equal = true, delta = 0;
        if (Math.random() < 0.6) {
            equal = false;
            delta = NGAME.util.generateDelta();
        }
        var operator = NGAME.util.generateOperator();
        if (operator === '+') {
            numbers[2] = numbers[0] + numbers[1] + delta;
        }
        else {
            numbers[2] = numbers[0];
            numbers[0] = numbers[0] + numbers[1] + delta;
        }

        var text = '';
        var textL = operator === '+' ? numbers[0] + ' + ' + numbers[1] : numbers[0] + ' - ' + numbers[1];
        text += Math.random() < 0.5 ? textL + ' = ' + numbers[2] : numbers[2] + ' = ' + textL;

        NGAME.ui.equation.innerText = text;
        NGAME.timer.resetTimer();

        return equal;
    };

    NGAME.share = {
        appId: '',
        img: location.href.substring(0, location.href.lastIndexOf('/')) + '/calc.png',
        imgSize: '120',
        url: location.href,
        title: '谁算得快？',
        desc: '速算小游戏，看谁算得快？'
    };

    var document = window.document;
    window.addEventListener('load', function () {
        NGAME.ui = {
            score: document.getElementById('score'),
            process: document.getElementById('process'),
            equation: document.getElementById('equation'),
            trueBtn: document.getElementById('trueBtn'),
            falseBtn: document.getElementById('falseBtn'),
            mask: document.getElementById('mask'),
            result: document.getElementById('result'),
            restartBtn: document.getElementById('restartBtn')
        };

        NGAME.util.bindTap(NGAME.ui.trueBtn, function () {
            if (!NGAME.status.check()) {
                return;
            }
            if (NGAME.status.getEqual() === true) {
                NGAME.status.next();
            }
            else {
                NGAME.status.end();
            }
        });

        NGAME.util.bindTap(NGAME.ui.falseBtn, function () {
            if (!NGAME.status.check()) {
                return;
            }
            if (NGAME.status.getEqual() === false) {
                NGAME.status.next();
            }
            else {
                NGAME.status.end();
            }
        });

        NGAME.util.bindTap(NGAME.ui.restartBtn, function () {
            NGAME.status.reset();
        });
    });

    document.addEventListener('WeixinJSBridgeReady', function () {
        WeixinJSBridge.on('menu:share:appmessage', function (argv) {
            WeixinJSBridge.invoke('sendAppMessage', {
                appid: NGAME.share.appId,
                img_url: NGAME.share.img,
                img_width: NGAME.share.imgSize,
                img_height: NGAME.share.imgSize,
                link: NGAME.share.url,
                desc: NGAME.share.desc,
                title: NGAME.share.title
            });
        });
        WeixinJSBridge.on('menu:share:timeline', function (argv) {
            WeixinJSBridge.invoke('shareTimeline', {
                img_url: NGAME.share.img,
                img_width: NGAME.share.imgSize,
                img_height: NGAME.share.imgSize,
                link: NGAME.share.url,
                desc: NGAME.share.desc,
                title: NGAME.share.desc
            });
        });
    });

})(window);