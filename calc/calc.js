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
            return NGAME.util.randInt(1, 3) * (Math.random() < 0.5 ? -1 : 1);
        },
        generateOperator: function () {
            var seed = Math.random();
            // return '/';
            return seed < 0.3 ? '+' : seed < 0.6 ? '-' : seed < 0.8 ? '*' : '/';
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
        show: function (dom, display) {
            display = display || 'block';
            dom.style.cssText = 'display: ' + display + ';';
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
                NGAME.ui.result.innerHTML = '<p>游戏结束</p><p>最终得分：' + score + '</p>';
                var highest = window.localStorage.getItem('highest');
                if (score > highest) {
                    NGAME.ui.highest.innerText = '历史最高分：' + score;
                    window.localStorage.setItem('highest', score);
                }
                NGAME.ui.restartBtn.innerText = '► 重试';

                NGAME.ui.handleReviveBtn();

                NGAME.share.desc = '我得了' + score + '分，你能算得比我快吗？速算小游戏，看谁算得快？';
                NGAME.util.show(NGAME.ui.mask);
            },
            reset: function () {
                score = -1;
                NGAME.timer.resetDuration();
                NGAME.ui.score.innerText = status = 0;
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
                if (score >= 0) {
                    score -= 1;
                }
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
                else if (duration > 1000) {
                    duration -= 500;
                }
                else if (duration > 500) {
                    duration -= 250;
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
                clearInterval(timer);
            },
            resetDuration: function () {
                duration = 3000;
            },
            resetTimer: function () {
                clearInterval(timer);
                ms = 0;
                NGAME.ui.process.style.cssText = 'width: 0%;';
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
            case '/': {
                numbers[2] = numbers[0];
                numbers[0] = numbers[0] * numbers[1];

                if (Math.random() < 0.5) {
                    numbers[1] += delta;
                }
                else {
                    numbers[2] += delta;
                }

                textL = numbers[0] + ' ÷ ' + numbers[1];
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
        desc: '速算小游戏，看谁算得快？',
        getBonus: function () {
            var date = window.localStorage.getItem('date');
            if (date === null) {
                date = new Date();
                date = +new Date(date.getFullYear(), date.getMonth(), date.getDate());
            }
            else if (Date.now() - date < 864E5) {
                return;
            }

            window.localStorage.setItem('lives', 3);
            window.localStorage.setItem('date', date);

            NGAME.ui.handleReviveBtn();
        }
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
            restartBtn: document.getElementById('restartBtn'),
            reviveBtn: document.getElementById('reviveBtn')
        };

        NGAME.ui.handleReviveBtn = function () {
            var lives = window.localStorage.getItem('lives') || 0;
            if (lives > 0) {
                NGAME.ui.reviveBtn.innerText = '复活(' + lives + ')';
                NGAME.util.show(NGAME.ui.reviveBtn, 'inline-block');
            }
            else {
                NGAME.util.hide(NGAME.ui.reviveBtn);
            }
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

        NGAME.util.bindTap(NGAME.ui.reviveBtn, function () {
            NGAME.status.revive();
        });

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
    /*function param(obj) {
        var str = '';
        for (var key in obj) {
            str += '[' + key + ']' + obj[key] + ',';
        }
        return str;
    }*/
    document.addEventListener('WeixinJSBridgeReady', function () {
        NGAME.util.show(document.getElementById('share'));
        WeixinJSBridge.on('menu:share:appmessage', function () {
            WeixinJSBridge.invoke('sendAppMessage', {
                appid: NGAME.share.appId,
                img_url: NGAME.share.img,
                img_width: NGAME.share.imgSize,
                img_height: NGAME.share.imgSize,
                link: NGAME.share.url,
                desc: NGAME.share.desc,
                title: NGAME.share.title
            }, function (res) {
                if (/[\w_]+:cancel/.test(res.err_msg)) {
                    return;
                }
                NGAME.share.getBonus();
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
            }, function (res) {
                if (/[\w_]+:cancel/.test(res.err_msg)) {
                    return;
                }
                NGAME.share.getBonus();
            });
        });
    });
// window.localStorage.removeItem('date');
})(window);