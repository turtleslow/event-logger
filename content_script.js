
'use strict';

/***************************
 * Globals
 ***************************/

const PORT      = browser.runtime.connect({name:"content"});
const METHODS   = Object.create(null);
const URL       = window.location.href;

// importing modules in a content script gives sites access to the module (security question)
// and is convoluted anyway; so just get settings from background script via message passing; see:
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources
// https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension

/***************************
 * Listeners
 ***************************/

PORT.onMessage.addListener((msg)=>{
    if( msg.msgType == 'settings' ){
        applySettings(msg.settings);
    } else {
        console.error('unexpected msgType');
    }
});


/***************************
 * Run
 ***************************/

console.log(`content script for SITE_MATCH_PATTERN: ${SITE_MATCH_PATTERN} at: ${URL}`);

PORT.postMessage({
    msgType: 'getSettings'
    , matchPattern: SITE_MATCH_PATTERN
});


/***************************
 * Functions: General
 ***************************/
// see:
// https://stackoverflow.com/questions/3937000/chrome-extension-accessing-localstorage-in-content-script#3938013
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/sendMessage
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/onMessage#Sending_a_synchronous_response
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/sendMessage

function applySettings(settings){
    console.log(SITE_MATCH_PATTERN, ' applySettings(): ', settings);

    const events = settings.get('events');
    for (const s_key of events.keys()){
        if (events.get(s_key) == 1) {
            window.addEventListener(s_key, (x)=>{x.stopImmediatePropagation();}, {capture: true});
            console.log(`events on ${s_key} = ${events.get(s_key)}`);
        } else if (events.get(s_key) == 2) {
            window.addEventListener(s_key, ()=>{notifyOfEvent(s_key);});
            console.log(`events log ${s_key} = ${events.get(s_key)}`);
        }
    }

    const special_methods = settings.get('special_methods');
    for (const s_key of special_methods.keys()){
        if (special_methods.get(s_key) == 1) {
            console.log(`special_methods on ${s_key} = ${special_methods.get(s_key)}`);
            METHODS[s_key]();
        }
    }
}


/***************************
 * Functions: Methods implementations
 ***************************/

METHODS['action_setToForeground'] = ()=>{
    console.log('special method: action_setToForeground');
    setToForeground();
};

METHODS['log_event_visibilitychange_visibilityState'] = ()=>{
    console.log('special method: log_event_visibilitychange_visibilityState');
    window.addEventListener(
        "visibilitychange"
        , ()=>{
            const msg = { visibilitychange_visibilityState: document.wrappedJSObject.visibilityState };
            notifyOfEvent(msg);
        }
    );
};

METHODS['log_event_visibilitychange_allEntries'] = ()=>{
    window.addEventListener(
        "visibilitychange"
        , ()=>{
            const msg = {visibilitychange_allEntries: Object.entries(document.wrappedJSObject)};
            notifyOfEvent(msg);
        }
    );
};

METHODS['log_event_visibilitychange_fullscreenElement'] = ()=>{
    window.addEventListener(
        "visibilitychange"
        , ()=>{
            if (document.fullscreenElement) {
                const msg = {visibilitychange_fullscreenElements: Object.entries(document.fullscreenElement.wrappedJSObject)};
                notifyOfEvent(msg);
            }
        }
    );
};

METHODS['log_interval_pageProperties'] = ()=>{
    pageProperties();
    setInterval(pageProperties, 10000);  // clear with clearInterval();
};


/***************************
 * Functions: General
 ***************************/

function setToForeground() {
    Object.defineProperties(
        document.wrappedJSObject, {
            hidden:             {value: false}
            , visibilityState:  {value: 'visible'}
        }
    );
}

function notifyOfEvent(payload) {
    // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
    const weakSet           = new WeakSet();
    const circularChecker   = (key, value) => {
        if (value != null && typeof value == "object") {
            if ( weakSet.has(value) ) { return undefined; }
            else { weakSet.add(value); }
        }

        return value;
    };
    
    PORT.postMessage({
        msgType: 'eventNotification'
        , body: JSON.stringify({
                time: new Date()
                , url: URL
                , evt: payload
            }
            , circularChecker
        )
    });
}

function pageProperties() {
    // other helpful Object functions are entries(), keys(), values()
    const document_properties = {};
    for (let property in document.wrappedJSObject) {
        document_properties[property] = document.wrappedJSObject[property];
    }
    
    const window_properties = {};
    for (let property in window.wrappedJSObject) {
        window_properties[property] = window.wrappedJSObject[property];
    }

    const all_element_properties = [];
    for (let element of document.getElementsByTagName("*"))
    {
        const element_properties = {};
        for (let property in element) {
            element_properties[property] = element[property];
        }
        all_element_properties.push(element_properties);
    }

    const allEntries = {
        visibilityState:            document.wrappedJSObject.visibilityState
        , hidden:                   document.wrappedJSObject.hidden
        , fullscreenEnabled:        document.wrappedJSObject.fullscreenEnabled
        , height:                   document.wrappedJSObject.height
        , width:                    document.wrappedJSObject.width
        , document_properties:      document_properties
        , window_properties:        window_properties
        , all_element_properties:   all_element_properties
    };
    notifyOfEvent(allEntries);
}

undefined; // return value for browser.tabs.executeScript()

