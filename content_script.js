
/***************************
 * Globals
 ***************************/
"use strict";

const PORT      = browser.runtime.connect({name:"content"});
const METHODS   = Object.create(null);
const URL       = window.location.href;

console.log('started content script for ' + URL);

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


/***************************
 * Listeners
 ***************************/

PORT.postMessage({msgType: 'get_events_and_methods'});

PORT.onMessage.addListener((msg)=>{
    if( msg.msgType == 'set_events_and_methods' ){
        for (const evt in msg.events){
            if (msg.events[evt] == 1) {
                window.addEventListener(evt, ()=>{notifyOfEvent(evt);});
            } else if (msg.events[evt] == 2) {
                window.addEventListener(evt, (x)=>{x.stopImmediatePropagation();}, {capture: true});
            }
        }

        for (const f in msg.methods) {
            if (msg.methods[f] == 1) {
                METHODS[f]();
            }
        }
    } else {
        console.error('unexpected msgType');
    }
});



