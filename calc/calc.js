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
            return Math.random() < 0.35 ? '+' : Math.random() < 0.7 ? '-' : '*';
        },
        getEqualFlag: (function () {
            var last;
            var count = 0;

            return function () {
                var equal = Math.random() < 0.5;
// console.log('Generate: ' + equal);
                if (equal === last) {
                    if (count >= 2 && Math.random() < (count + 1) / 10) {
                        equal = !equal;
                        count = 1;
                    }
                    else {
                        count++;
                    }
                }
                else {
                    count = 1;
                }
// console.log('Return: ' + equal);
// console.log('----------------');
                return (last = equal);
            };
        })(),
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
                if (score === 25 || score === 45 || score === 60 || score === 75 || score === 90) {
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
                var highest = window.localStorage.getItem('highest');
                if (score > highest) {
                    NGAME.ui.highest.innerText = '历史最高分：' + score;
                    window.localStorage.setItem('highest', score);
                }
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
            },
            revive: function () {
                var lives = window.localStorage.getItem('lives') || 0;
                if (lives <= 0) {
                    NGAME.status.reset();
                    return;
                }

                lives -= 1;
                window.localStorage.setItem('lives', lives);
                status = 0;
                NGAME.util.hide(NGAME.ui.mask);
                NGAME.status.next();
            }
        };
    })();

    NGAME.timer = (function () {
        var timer = null;
        var duration = 3000;
        var ms;
        var timeStart;

        return {
            speedUp: function () {
                if (duration > 2000) {
                    duration -= 1000;
                }
                else {
                    duration /= 2;
                }
            },
            checkCheat: function () {
                var delta = +new Date() - timeStart - ms;
                if (delta > 500) {
                    NGAME.ui.process.style.cssText = 'width: 100%;';
                    NGAME.status.end();
                    return false;
                }
                timeStart += delta;
                return true;
            },
            clearTimer: function () {
                duration = 3000;
                clearTimeout(timer);
            },
            resetTimer: function () {
                clearTimeout(timer);
                ms = 0;
//                NGAME.ui.process.className = 'animation';
                NGAME.ui.process.style.cssText = 'width: 0%;';
//                NGAME.ui.process.style.cssText = 'width: 10%;';
                timeStart = +new Date();
                timer = setInterval(function () {
                    ms += duration / 10;
                    if (!NGAME.timer.checkCheat()) {
                        return;
                    }
                    NGAME.ui.process.style.cssText = 'width: ' + ms / duration * 100 + '%;';
                    if (ms >= duration) {
                        NGAME.status.end();
                    }
//                    NGAME.ui.process.style.cssText = 'width: ' + (ms + 200) / 20 + '%;';
                }, duration / 10);
            }
        };
    })();

    NGAME.process = function () {
        var numbers = NGAME.util.generateNumbers();
        var equal = NGAME.util.getEqualFlag();
        var delta = 0;

        if (!equal) {
            delta = NGAME.util.generateDelta();
        }

        var operator = NGAME.util.generateOperator();
        var textL, text = '';
        switch (operator) {
            case '+': {
                numbers[2] = numbers[0] + numbers[1] + delta;
                textL = numbers[0] + ' ＋ ' + numbers[1];
                break;
            }
            case '-': {
                numbers[2] = numbers[0];
                numbers[0] = numbers[0] + numbers[1] + delta;
                textL = numbers[0] + ' － ' + numbers[1];
                break;
            }
            case '*': {
                numbers[2] = numbers[0] * numbers[1] + delta;
                textL = numbers[0] + ' × ' + numbers[1];
                break;
            }
        }

        text += Math.random() < 0.5 ? textL + ' ＝ ' + numbers[2] : numbers[2] + ' ＝ ' + textL;

        NGAME.ui.equation.innerText = text;
        NGAME.timer.resetTimer();

        return equal;
    };

    NGAME.share = {
        appId: '',
        img: location.href.substring(0, location.href.lastIndexOf('/')) + '/calc.png',
        imgSize: '120',
        url: location.href.substring(0, location.href.lastIndexOf('?')) + '?' + NGAME.util.randInt(1E8, 1E9-1),
        title: '谁算得快？',
        desc: '速算小游戏，看谁算得快？'
    };

    var document = window.document;
    window.addEventListener('load', function () {
        NGAME.ui = {
            score: document.getElementById('score'),
            process: document.getElementById('process'),
            equation: document.getElementById('equation'),
            mask: document.getElementById('mask'),
            result: document.getElementById('result'),
            highest: document.getElementById('highest'),
            restartBtn: document.getElementById('restartBtn')
        };

        NGAME.util.bindTap(document.getElementById('trueBtn'), function () {
            if (!NGAME.status.check() || !NGAME.timer.checkCheat()) {
                return;
            }
            if (NGAME.status.getEqual() === true) {
                NGAME.status.next();
            }
            else {
                NGAME.status.end();
            }
        });

        NGAME.util.bindTap(document.getElementById('falseBtn'), function () {
            if (!NGAME.status.check() || !NGAME.timer.checkCheat()) {
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

        if (typeof WeixinJSBridge === 'undefined') {
            NGAME.util.hide(document.getElementById('share'));
        }

        if (typeof window.localStorage !== 'undefined') {
            var highest = window.localStorage.getItem('highest');
            if (highest !== null) {
                NGAME.ui.highest.innerText = '历史最高分：' + highest;
            }
        }
        else {
            window.localStorage = {
                setItem: function (key, value) {},
                getItem: function (key) {
                    return null;
                }
            };
        }

        document.addEventListener('touchmove', function (event) {
            event.preventDefault();
        });
    });

    document.addEventListener('WeixinJSBridgeReady', function () {
        WeixinJSBridge.on('menu:share:appmessage', function () {
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
        WeixinJSBridge.on('menu:share:timeline', function () {
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