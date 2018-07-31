
'use strict';

import * as settings from './modules/settings.js'
import * as helpers  from './modules/helpers.js'


/***************************
 * Globals
 ***************************/

let PORT_LOG;
let CONTENT_SCRIPT_REGISTER = new Map();


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
                console.error('unexpected msgType');
            }
        });
    } else if (port.name === 'content'){
        port.onMessage.addListener(function(msg) {
            if( msg.msgType == 'getSettings'){
                settings.load('sites').then((s)=>{
                    port.postMessage({
                        msgType: 'settings'
                        , settings: s['sites'].get(msg.matchPattern)
                    });
                });
            } else if( PORT_LOG && (msg.msgType === 'eventNotification') ){
                PORT_LOG.postMessage(msg);
            } else {
                console.error('unexpected msgType');
            }
        });
    } else {
        console.error('unexpected port');
    }
}

function setContentScripts_all(settings){
    [...settings['sites'].keys()].forEach(setContentScript);
}

async function setContentScript(pattern){
    // register content script for SITES; if the returned
    // object is destroyed (e.g. it goes out of scope), then
    // the content scripts will be unregistered automatically;
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
    const content_code = `const SITE_MATCH_PATTERN='${pattern}';`;
    const reg = browser.contentScripts.register( {
            matches: [pattern]
            , js: [
                {code: content_code}
                , {file: "content_script.js"}
            ]
            , allFrames: true
            , runAt: "document_start"
        }
    );

    return CONTENT_SCRIPT_REGISTER.set(pattern,reg);
}


/***************************
 * Run
 ***************************/

helpers.deleteExtHistory();

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

browser.storage.onChanged.addListener(
    (changes,areaName)=>{
        settings.load(null).then(setContentScripts_all);

//         // options to get this working:
//         // - somehow allow content script to run multiple times (it would have to unregister existing listeners)
//         for (const pattern of changes['sites']['newValue'].keys()){
//             const content_code = `const SITE_MATCH_PATTERN='${pattern}';`;
//             browser.tabs.query( { url : pattern } ).then(
//                 (tabs)=>{
//                     for (const tab of tabs){
//                         browser.tabs.executeScript(tab.id, {
//                             allFrames   : true
//                             , code      : content_code
//                             , runAt     : 'document_start'
//                         });
//
//                         browser.tabs.executeScript(tab.id, {
//                             allFrames   : true
//                             , file      : 'content_script.js'
//                             , runAt     : 'document_start'
//                         });
//                     }
//                 }
//             );
//         }
    }
);

// Not yet available in firefox extension API:
// browser.runtime.onSuspend.addListener(browser.storage.local.clear);


// open options_launcher.html
// const optionsPage = browser.runtime.openOptionsPage();

// const NEW_TAB = browser.tabs.create({url: browser.extension.getURL("") + "options.html"});
// NEW_TAB.then(function(){},function(){});
