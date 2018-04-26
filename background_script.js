
let PORT_LOG;
let CONTENT_SCRIPT_REGISTER;
const PORT_CONTENT      = new Array();
const METHODS_ACTIVE    = new Set();
const SITES_ACTIVE      = new Set();


/***************************
 * Functions
 ***************************/

function connected(port) {
    if (port.name == "log"){
        PORT_LOG = port;
        port.onMessage.addListener(function(msg) {
            if(msg.msgType=='setContentMethods'){
                onUpdateContentMethods(msg);
            } else {
                console.error('there is something wrong here');
            }
        });
    } else if (port.name == "content"){
        PORT_CONTENT.push(port);
        port.onMessage.addListener(function(msg) {
            if(msg.msgType=='eventNotification'){
                PORT_LOG.postMessage(msg);
            } else if (msg.msgType == 'getContentMethods') {
                port.postMessage({
                    msgType: 'setContentMethods'
                    , methods_active: METHODS_ACTIVE
                });
            } else {
                console.error('there is something wrong here');
            }
        });
    } else {
        console.error('there is something wrong here');
    }
}

async function onUpdateContentMethods(msg){
    METHODS_ACTIVE.clear();
    for(const m of msg.methods_active){
        METHODS_ACTIVE.add(m);
    }

    SITES_ACTIVE.clear();
    for(const s of msg.sites_active){
        SITES_ACTIVE.add(s);
    }

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



browser.runtime.onConnect.addListener(connected);

// open options.html
const optionsPage = browser.runtime.openOptionsPage();

// var NEW_TAB = browser.tabs.create({url: browser.extension.getURL("") + "logger.html"});
// newTab.then(function(){},function(){});
