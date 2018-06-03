
/***************************
 * Globals
 ***************************/
"use strict";

const PORT_CONTENT                          = new Array();
let PORT_LOG;
let CONTENT_SCRIPT_REGISTER;

// 0 = off
// 1 = on
let SITES                                   = Object.create(null);
SITES['<all_urls>']                         = 0;
SITES["*://*.8tracks.com/*"]                = 1;
SITES["*://*.accuradio.com/*"]              = 1;
SITES["*://*.dailymail.co.uk/*"]            = 1;
SITES["*://*.jango.com/*"]                  = 1;
SITES["*://*.pandora.com/*"]                = 1;
SITES["*://*.slacker.com/*"]                = 1;
SITES["*://*.youtube.com/*"]                = 1;

// 0 = inactive
// 1 = log
// 2 = block
let EVENTS                                  = Object.create(null);
EVENTS['visibilitychange']                  = 2;
EVENTS['pagehide']                          = 2;
EVENTS['focusout']                          = 2;
EVENTS['resize']                            = 2;
EVENTS['blur']                              = 2;
EVENTS['unload']                            = 2;
EVENTS['beforeunload']                      = 2;
EVENTS['touchstart']                        = 2;
EVENTS['touchend']                          = 2;
EVENTS['touchmove']                         = 2;
EVENTS['touchcancel']                       = 2;

// 0 = off
// 1 = on
let SPECIAL_METHODS                                             = Object.create(null);
SPECIAL_METHODS['action_setToForeground']                       = 1;
SPECIAL_METHODS['log_event_visibilitychange_visibilityState']   = 1;

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
            } else if (msg.msgType == 'get_events') {
                port.postMessage({
                    msgType: 'set_events'
                    , body: EVENTS
                });
            } else if (msg.msgType == 'get_special_methods') {
                port.postMessage({
                    msgType: 'set_special_methods'
                    , body: SPECIAL_METHODS
                });
            } else if (msg.msgType == 'set_sites') {
                SITES = msg.body;
                setContentScript();
            } else if (msg.msgType == 'set_events') {
                EVENTS = msg.body;
            } else if (msg.msgType == 'set_special_methods') {
                SPECIAL_METHODS = msg.body;
            } else {
                console.error('unexpected msgType');
            }
        });
    } else if (port.name == "content"){
        PORT_CONTENT.push(port);
        port.onMessage.addListener(function(msg) {
            if (msg.msgType == 'get_events_and_methods') {
                port.postMessage({
                    msgType: 'set_events_and_methods'
                    , events: EVENTS
                    , methods: SPECIAL_METHODS
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
            "matches": Object.keys(SITES)
            , "js": [{file: "content_script.js"}]
            , "allFrames": true
            , "runAt": "document_start"
        }
    )
}


/***************************
 * Run
 ***************************/

browser.runtime.onConnect.addListener(connected);

setContentScript();


// open options.html
// const optionsPage = browser.runtime.openOptionsPage();

// var NEW_TAB = browser.tabs.create({url: browser.extension.getURL("") + "logger.html"});
// newTab.then(function(){},function(){});
