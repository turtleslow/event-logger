
/***************************
 * Globals
 ***************************/
"use strict";

let PORT_LOG;
let CONTENT_SCRIPT_REGISTER;
const PORT_CONTENT      = new Array();
const EVENT_TARGETS     = ['visibilitychange','resize','pagehide','focusout','blur','unload'];
let METHODS             = (()=>{
    const a = ['action_setToForeground', 'log_event_visibilitychange_visibilityState'];
    for (const evt of EVENT_TARGETS){
        a.push('action_stop_' + evt);
        a.push('log_event_' + evt);
    }
    return new Set(a.sort());
})();
let METHODS_ACTIVE      = new Set(METHODS);
let SITES               = new Set([
    "<all_urls>"
    , "*://*.8tracks.com/*"
    , "*://*.accuradio.com/*"
    , "*://*.jango.com/*"
    , "*://*.pandora.com/*"
    , "*://*.slacker.com/*"
    , "*://*.youtube.com/*"
]);
let SITES_ACTIVE        = (()=>{const s = new Set(SITES); s.delete("<all_urls>"); return s;})()

/***************************
 * Functions
 ***************************/

function connected(port) {
    if (port.name == "log"){
        PORT_LOG = port;
        port.onMessage.addListener(function(msg) {
            if (msg.msgType == 'get_sites') {
                port.postMessage({
                    msgType: 'set_sites'
                    , body: SITES
                });
            } else if (msg.msgType == 'get_methods') {
                port.postMessage({
                    msgType: 'set_methods'
                    , body: METHODS
                });
            } else if (msg.msgType == 'get_sites_active') {
                port.postMessage({
                    msgType: 'set_sites_active'
                    , body: SITES_ACTIVE
                });
            } else if (msg.msgType == 'get_methods_active') {
                port.postMessage({
                    msgType: 'set_methods_active'
                    , body: METHODS_ACTIVE
                });
            } else if (msg.msgType == 'set_sites_active') {
                SITES_ACTIVE = msg.body;
                setContentScript();
            } else if (msg.msgType == 'set_methods_active') {
                METHODS_ACTIVE = msg.body;
                setContentScript();
            } else {
                console.error('unexpected msgType');
            }
        });
    } else if (port.name == "content"){
        PORT_CONTENT.push(port);
        port.onMessage.addListener(function(msg) {
            if (msg.msgType == 'get_methods_active') {
                port.postMessage({
                    msgType: 'set_methods_active'
                    , methods_active: METHODS_ACTIVE
                });
            } else if( PORT_LOG && (msg.msgType == 'eventNotification') ){
                PORT_LOG.postMessage(msg);
            } else {
                console.error('unexpected msgType');
            }
        });
    } else {
        console.error('unexpected port');
    }
}

async function setContentScript(){
    // register content script for SITES; if the returned
    // object is destroyed (e.g. it goes out of scope), then
    // the content scripts will be unregistered automatically;
    // the API requires host permission in manifest.json
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/contentScripts/register

    if (CONTENT_SCRIPT_REGISTER) {
        const reg = await CONTENT_SCRIPT_REGISTER;
        reg.unregister();
    }

    CONTENT_SCRIPT_REGISTER = browser.contentScripts.register( {
            "matches": Array.from(SITES_ACTIVE)
            , "js": [{file: "content_script.js"}]
            , "allFrames": true
            , "runAt": "document_start"
        }
    )
}


/***************************
 * Run
 ***************************/

setContentScript();

browser.runtime.onConnect.addListener(connected);

// open options.html
// const optionsPage = browser.runtime.openOptionsPage();

// var NEW_TAB = browser.tabs.create({url: browser.extension.getURL("") + "logger.html"});
// newTab.then(function(){},function(){});
