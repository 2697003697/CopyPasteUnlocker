// ==UserScript==
// @name         【最强】【最全面】【全网页可用】【持续更新中】解除禁止复制和粘贴限制并支持手动粘贴
// @namespace    https://github.com/2697003697/CopyPasteUnlocker
// @version      7.3.3
// @description  ⭐学习通⭐pta⭐csdn⭐飞书云文档⭐破解所有网站【禁止复制】和【禁止粘贴】限制，支持【模拟人工输入】。反馈邮箱：EchoRunning@outlook.com
// @author       EchoRunning
// @match        *://*/*
// @exclude      https://chatgpt.com/*
// @exclude      https://www.bilibili.com/*
// @exclude      https://www.bing.com/*
// @exclude      https://fanyi.*/*
// @updateURL    https://2697003697.github.io/CopyPasteUnlocker/main.user.js
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==


(function () {
    'use strict';

    const isFeishuPage = /feishu\.cn|larkoffice\.com/.test(window.location.hostname);
    const isChaoxingPage = /\.?chaoxing\.com$/.test(window.location.hostname);  // 判断是否是超星网课页面
    const isPintiaPage = /pintia\.cn/.test(window.location.hostname);  // 判断是否是Pintia页面

    // 通用工具函数
    const utils = {
    
        removeVipMask: () => {
            const masks = document.querySelectorAll('div[class*="hide-article"], div[class*="overlay"], div[class*="mask"]');
            masks.forEach(mask => {
                mask.style.display = 'none';
                mask.remove();
            });
            document.body.style.overflow = 'auto';
            document.body.style.pointerEvents = 'auto';
        },

    
        forceRemoveStyles: () => {
            document.querySelectorAll('*').forEach(el => {
                el.style.userSelect = 'auto';
                el.style.pointerEvents = 'auto';
            });
        },

        observeVipMask: () => {
            const observer = new MutationObserver(() => utils.removeVipMask());
            observer.observe(document.body, { childList: true, subtree: true });
            utils.removeVipMask();
        },

        removeSpecificEventListeners: () => {
            ['copy', 'cut', 'paste', 'contextmenu', 'selectstart'].forEach(event => {
                document.body.addEventListener(event, e => e.stopImmediatePropagation(), true);
            });
        },

   
        unlockCssRestrictions: () => {
            document.querySelectorAll('*:not([data-unlock-applied])').forEach(el => {
                el.style.userSelect = 'auto';
                el.style.pointerEvents = 'auto';
                el.setAttribute('data-unlock-applied', 'true');
            });
        },

  
        interceptXHR: () => {
            const rawOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                this.addEventListener('readystatechange', () => {
                    if (this.readyState === 4) {
                        try {
                            const jsonResponse = JSON.parse(this.responseText);
                            if (jsonResponse.data && jsonResponse.data.actions && jsonResponse.data.actions.copy !== 1) {
                                jsonResponse.data.actions.copy = 1;
                                Object.defineProperty(this, 'responseText', { value: JSON.stringify(jsonResponse) });
                                Object.defineProperty(this, 'response', { value: jsonResponse });
                            }
                        } catch (e) {
                            console.error('Failed to modify response:', e);
                        }
                    }
                }, false);
                rawOpen.call(this, method, url, ...rest);
            };
        },


        customCopyHandler: () => {
            document.addEventListener('keydown', e => {
                if (e.ctrlKey && e.key === 'c') {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        document.execCommand('copy');
                        console.log("Content copied to clipboard!");
                    } catch (err) {
                        console.error("Copy operation failed:", err);
                    }
                }
            }, true);
        }
    };

    // 飞书专用功能
    const feishuScript = () => {
        const overrideEventListeners = () => {
            const rawAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (['copy', 'contextmenu'].includes(type)) {
                    rawAddEventListener.call(this, type, event => {
                        event.stopImmediatePropagation();
                        if (type === 'contextmenu') {
                            return listener(event);
                        }
                    }, options);
                    return;
                }
                rawAddEventListener.call(this, type, listener, options);
            };
        };

        const overrideXHR = () => {
            utils.interceptXHR();
        };

        overrideEventListeners();
        overrideXHR();
    };

    // Pintia专用功能
    const pintiaScript = () => {
        // 解锁文本选择功能
        const enableTextSelection = () => {
            document.body.style.userSelect = 'text';
            document.body.style.webkitUserSelect = 'text';
            document.body.style.msUserSelect = 'text';
            document.body.style.MozUserSelect = 'text';
        };

        // 移除特定事件监听器
        const removeEventListeners = (element, events) => {
            events.forEach(event => {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            });
        };

        // 解锁复制、粘贴和拖放
        const unlockClipboardRestrictions = () => {
            ['copy', 'paste', 'drop', 'beforeinput'].forEach(eventName => {
                document.addEventListener(eventName, (e) => {
                    e.stopPropagation(); // 仅阻止限制相关的事件传播
                }, true);
            });
        };

        // 兼容动态加载的内容
        const observeDOMChanges = () => {
            const observer = new MutationObserver(() => {
                enableTextSelection();
                unlockClipboardRestrictions();
            });

            observer.observe(document, { childList: true, subtree: true });
        };

        // 初始化解锁
        const initUnlock = () => {
            enableTextSelection();
            unlockClipboardRestrictions();
            observeDOMChanges();
        };

        // 确保脚本延迟加载，避免与页面初始化冲突
        window.addEventListener('load', () => {
            initUnlock();
        });
    };

    // 通用解锁功能
    const universalUnlockScript = () => {
        utils.observeVipMask();
        utils.removeSpecificEventListeners();
        utils.unlockCssRestrictions();
        utils.interceptXHR();
        utils.customCopyHandler();
    };

    // 手动粘贴功能
    let targetElement = null;

    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'm') {
            event.preventDefault();
            targetElement = document.activeElement;
            utils.createFloatingInputBox();
        }
    });

    utils.createFloatingInputBox = () => {
        if (document.getElementById('floatingInputBox')) return;

        const floatingBox = document.createElement('div');
        floatingBox.id = 'floatingInputBox';
        Object.assign(floatingBox.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '300px',
            padding: '10px',
            backgroundColor: 'white',
            border: '1px solid black',
            zIndex: '10000'
        });

        const closeButton = document.createElement('button');
        closeButton.textContent = '关闭';
        closeButton.style.marginBottom = '10px';
        closeButton.onclick = () => document.body.removeChild(floatingBox);

        const textarea = document.createElement('textarea');
        Object.assign(textarea.style, {
            width: '100%',
            height: '80px'
        });
        textarea.placeholder = '在此粘贴内容，然后按 Enter';
        textarea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = textarea.value;
                document.body.removeChild(floatingBox);
                if (targetElement) {
                    utils.typeTextSlowly(targetElement, text);
                }
            } else if (e.key === 'Escape') {
                document.body.removeChild(floatingBox);
            }
        });

        floatingBox.appendChild(closeButton);
        floatingBox.appendChild(textarea);
        document.body.appendChild(floatingBox);
        textarea.focus();
    };

    utils.typeTextSlowly = (element, text) => {
        let i = 0;
        function typeChar() {
            if (i < text.length) {
                utils.insertChar(element, text[i]);
                i++;
                requestAnimationFrame(typeChar);
            }
        }
        typeChar();
    };

    utils.insertChar = (element, char) => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.focus();
            document.execCommand('insertText', false, char);
        } else if (element.isContentEditable) {
            element.focus();
            document.execCommand('insertText', false, char);
        }
    };

    window.addEventListener('load', function() {
        // 针对超星网课页面的功能
        if (isChaoxingPage) {
            $(function() {
                setTimeout(() => {
                    $("body").removeAttr("onselectstart");
                    $("html").css("user-select", "unset");
                    UE.EventBase.prototype.fireEvent = function() {
                        return null;
                    };
                }, 1000);

                if (window.location.href.includes("newMooc=true")) {
                    $("<div style='background: #86b430;display:inline;border: solid 1px #6f8e30;color: #FFF;padding: 2px 10px;cursor: pointer;' onclick='copyContentNew(event)'>复制题目</div>").insertAfter($(".colorShallow"));
                } else {
                    $("<div style='background: #86b430;display:inline;border: solid 1px #6f8e30;color: #FFF;padding: 2px 10px;cursor: pointer;' onclick='copyContentOld(event)'>复制题目</div>").insertAfter($(".Cy_TItle").find("p"));
                }

                window.copyContentOld = function(event) {
                    setTimeout(() => {
                        var range = document.createRange();
                        var selection = window.getSelection();
                        selection.removeAllRanges();
                        range.selectNodeContents($(event.srcElement.parentNode).find("p")[0]);
                        selection.addRange(range);
                        document.execCommand('copy');
                        selection.removeAllRanges();
                        let tips = $("<span style='color:red'>复制成功</span>").appendTo($(event.srcElement.parentNode));
                        setTimeout(() => {
                            tips.remove();
                        }, 1000);
                    }, 1000);
                };

                window.copyContentNew = function(event) {
                    setTimeout(() => {
                        var range = document.createRange();
                        var selection = window.getSelection();
                        selection.removeAllRanges();
                        range.selectNodeContents($(event.srcElement.nextSibling)[0]);
                        selection.addRange(range);
                        document.execCommand('copy');
                        selection.removeAllRanges();
                        let tips = $("<span style='color:red'>复制成功</span>").insertAfter($(event.srcElement));
                        setTimeout(() => {
                            tips.remove();
                        }, 1000);
                    }, 1000);
                };
            });
        }
    });

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        if (isFeishuPage) {
            feishuScript();
        } else if (isPintiaPage) {
            pintiaScript();
        } else {
            universalUnlockScript();
        }
    });
})();
