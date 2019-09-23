
'use strict';

import * as settings from './modules/settings.js'
// import * as helpers  from './modules/helpers.js' // 'history' API not implemented on mobile


/***************************
 * Globals
 ***************************/

let PORT_LOG;
const CONTENT_SCRIPT_REGISTER   = new Map();
const TABID_TO_PATTERN          = new Map();
const IS_MOBILE                 = new RegExp('Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini','i').test(navigator.userAgent);

/***************************
 * Functions
 ***************************/

function connected(port) {
    if (port.name === 'log'){
        PORT_LOG = port;
        port.onMessage.addListener(function(msg) {
            if( msg.msgType == 'echo' ){
                port.postMessage({ msgType : 'echo' });
            } else {
                console.error('unexpected msg.msgType', msg);
            }
        });
    } else if (port.name === 'content_loader') {
        port.onMessage.addListener(function(msg) {
            if( msg.msgType == 'matchPattern'){
                loadContentScriptToAllFrames(port, msg);
            } else {
                console.error('unexpected msg.msgType', msg);
            }
        });
    } else if (port.name === 'content'){
        port.onMessage.addListener(function(msg) {
            if( msg.msgType == 'getSettings'){
                const tabId = port.sender.tab.id;
                const url   = port.sender.tab.url;
                TABID_TO_PATTERN.set(tabId,msg.matchPattern);

                // get settings and inform content tab of them
                settings.load('sites').then((s)=>{
                    port.postMessage({
                        msgType: 'settings'
                        , settings: s['sites'].get(msg.matchPattern)
                    });
                });

                // show extension button in browser's address bar
                if (IS_MOBILE) {
                    browser.pageAction.show(tabId);
                } else {
                    // browser.pageAction.isShown() is not yet implemented on mobile
                    // but notification on mobile are annoying anyway (think text message)
                    browser.pageAction.isShown({
                        tabId: tabId
                    }).then((isShown)=>{
                        // notifications are quite annoying on mobile (think txt msg)
                        if (isShown){
                            browser.notifications.create(tabId.toString(), {
                                'type': 'basic',
                                'iconUrl': browser.extension.getURL('icons/border-48.png'),
                                'title': 'event-logger notification:',
                                'message': `URL matched more than once: ${url}`
                            });
                        } else {
                            browser.pageAction.show(tabId);

                            browser.notifications.create(tabId.toString(), {
                                'type': 'basic',
                                'iconUrl': browser.extension.getURL('icons/border-48.png'),
                                'title': 'event-logger notification:',
                                'message': `URL matches ${msg.matchPattern}`
                            }).then((notificationId)=>{
                                setTimeout(()=>{
                                    browser.notifications.clear(notificationId);
                                }, 3000);
                            });
                        }
                    });
                }
            } else if (msg.msgType == 'new_iFrame') {
                loadContentScriptToAllFrames(port, msg);
            } else if (msg.msgType === 'eventNotification') {
                PORT_LOG && PORT_LOG.postMessage(msg);
            } else {
                console.error('unexpected msg.msgType', msg);
            }
        });
    } else if (port.name === 'page_action') {
        port.onMessage.addListener(function(msg) {
            if (msg.msgType == 'getMatchPattern') {
                const pattern = TABID_TO_PATTERN.get(msg.tabId);
                port.postMessage({
                    msgType: 'matchPattern'
                    , matchPattern: pattern
                });
            } else {
                console.error('unexpected msg.msgType', msg);
            }
        });
    } else {
        console.error('unexpected port: ', port);
    }
}

function setContentScripts_all(settings){
    for (const [key,value] of CONTENT_SCRIPT_REGISTER.entries()) {
        // apparently the future needs to be consumed to be able to call unregister later
        value.then( (x) => {
            // calling `unregister` gives a console log error message that it was
            // already called ... but we still need it to unregister content scripts
            // otherwise it is not possible to remove urls from the addon's match pattern
            x.unregister();
            CONTENT_SCRIPT_REGISTER.delete(key);
        })
    }

    [...settings['sites'].keys()].forEach(setContentScript);
}

async function setContentScript(pattern){
    // register content script for site matching `pattern`; if the
    // returned object is destroyed (e.g. it goes out of scope),
    // then the content scripts will be unregistered automatically;
    // the API requires host permission in manifest.json
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/contentScripts/register

    console.log('setContentScript() for: ' + pattern);

    if (CONTENT_SCRIPT_REGISTER.has(pattern)) {
        const reg = await CONTENT_SCRIPT_REGISTER.get(pattern);
        reg.unregister();
        CONTENT_SCRIPT_REGISTER.delete(pattern);
    }

    // const matches = Object.entries(SITES).filter(x=>x[1]==1).map(x=>x[0]);
    // see: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/content_scripts#js

    // const content_code = `const SITE_MATCH_PATTERN='${pattern}';`;
    const content_code = `if( ! window.SITE_MATCH_PATTERN ) { var SITE_MATCH_PATTERN='${pattern}'; }`;
    const reg = browser.contentScripts.register( {
            matches: [pattern]
            , js: [
                {code: content_code}
                , {file: "content_script_loader.js"}
            ]
            , allFrames: true
            , runAt: ['document_start', 'document_end', 'document_idle'][2]
        }
    );

    return CONTENT_SCRIPT_REGISTER.set(pattern,reg);
}


/***************************
 * Run
 ***************************/

// 'history' API not implemented on mobile
// helpers.deleteExtHistory();

browser.runtime.onConnect.addListener(connected);

settings.load(null).then(
    (s)=>{
        console.log('stored settings(): ', s);
        if ( ! s.hasOwnProperty('firstRun')) {
            console.log('settings were null, setting default');
            settings.save(settings.defaultSettings());
        }
        setContentScripts_all(s);
    }
    , (s)=>{console.error("storage.local.get()");}
)

// content scripts loaded via browser.contentScripts.register are generally
// only loaded into scritps that match the match pattern, even if 'allFrames'
// is set to 'true'; so instead we register content_script_loader.js which
// sends back the tabId and we load the content script into all frames with
// the following method:
function loadContentScriptToFrame(tabId, frameId, pattern) {
    const content_code = (frameId===0)
        ? ';'
        : `if( ! window.SITE_MATCH_PATTERN ) { var SITE_MATCH_PATTERN='${pattern}'; }`;

    browser.tabs.executeScript(tabId, {
        frameId             : frameId
        , matchAboutBlank   : true
        , code              : content_code
        , runAt             : ['document_start', 'document_end', 'document_idle'][2]
    });

    browser.tabs.executeScript(tabId, {
        frameId             : frameId
        , matchAboutBlank   : true
        , file              : 'content_script.js'
        , runAt             : ['document_start', 'document_end', 'document_idle'][2]
    });
}

function loadContentScriptToAllFrames(port, msg) {
    const tabId     = port.sender.tab.id;
    const pattern   = msg.matchPattern;

    if ( true ) {
        browser.webNavigation.getAllFrames({tabId: tabId}).then((framesInfo)=>{
            framesInfo.forEach((frameInfo) => {
                console.log(`load content_scipt.js into tabId:frameId ${tabId}:${frameInfo.frameId} for pattern ${msg.matchPattern} at ${frameInfo.url}`);
                loadContentScriptToFrame(tabId, frameInfo.frameId, msg.matchPattern);
            });
        });

    } else {
        const content_code = `if( ! window.SITE_MATCH_PATTERN ) { var SITE_MATCH_PATTERN='${pattern}'; }`;

        browser.tabs.executeScript(tabId, {
            allFrames           : true
            , matchAboutBlank   : true
            , code              : content_code
            , runAt             : ['document_start', 'document_end', 'document_idle'][2]
        });

        browser.tabs.executeScript(tabId, {
            allFrames           : true
            , matchAboutBlank   : true
            , file              : 'content_script.js'
            , runAt             : ['document_start', 'document_end', 'document_idle'][2]
        });
    }
}


browser.storage.onChanged.addListener(
    (changes,areaName)=>{
        if ( true ) {
            settings.load(null).then(setContentScripts_all);
        } else {
            // // options to get this working:
            // // - somehow allow content script to run multiple times (it would have to unregister existing listeners)
            // for (const pattern of changes['sites']['newValue'].keys()){
            //     const content_code = `const SITE_MATCH_PATTERN='${pattern}';`;
            //     browser.tabs.query( { url : pattern } ).then(
            //         (tabs)=>{
            //             for (const tab of tabs){
            //                 browser.tabs.executeScript(tab.id, {
            //                     allFrames   : true
            //                     , code      : content_code
            //                     , runAt     : 'document_start'
            //                 });

            //                 browser.tabs.executeScript(tab.id, {
            //                     allFrames   : true
            //                     , file      : 'content_script_loader.js'
            //                     , runAt     : 'document_start'
            //                 });
            //             }
            //         }
            //     );
            // }
        }
   }
);

// Not yet available in firefox extension API:
// browser.runtime.onSuspend.addListener(browser.storage.local.clear);


// open options_launcher.html
// const optionsPage = browser.runtime.openOptionsPage();

// const NEW_TAB = browser.tabs.create({url: browser.extension.getURL("") + "options.html"});
// NEW_TAB.then(function(){},function(){});
