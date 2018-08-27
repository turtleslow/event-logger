
'use strict';

/***************************
 * Globals
 ***************************/
// TODO: content scripts currently don't work if a site matches multiple match patterns

if(typeof WAS_RUN !== 'undefined'){
    console.error(`content_script already run at ${WAS_RUN.toISOString()} for ${window.location.href}`);
} else {
    var WAS_RUN = new Date();
    console.log(`content_script run once at ${WAS_RUN.toISOString()} for ${window.location.href}`);

    const PORT      = browser.runtime.connect({name:'content'});
    const METHODS   = Object.create(null);
    const LISTENERS = new Map(); // key = event type, value = an *active* listener
    const URL       = window.location.href;

    startMutationObserver();

    // importing modules in a content script could give sites access to the module (security question)
    // and is convoluted anyway; so just get settings from background script via message passing; see:
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources
    // https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension

    /***************************
     * Listeners
     ***************************/

    PORT.onMessage.addListener( (msg)=>{
        if (msg.msgType == 'settings') {
            applySettings(msg.settings);
        } else {
            console.error('unexpected msg.msgType', msg);
        }
    });

    browser.runtime.onMessage.addListener( (msg, sender, response)=>{
        if (msg.msgType === 'page_action_listener_change') {
            if (msg.change === 'add') {
                addListener(window, msg.evt, (x)=>{x.stopImmediatePropagation();}, {capture: true});
            } else if (msg.change === 'rm') {
                rmListener(msg.evt);
            } else {
                console.error('unexpected msg.change', msg);
            }
        } else {
            console.error('unexpected msg.msgType', msg);
        }
    });

    /***************************
     * Run
     ***************************/

    console.log(`content script for SITE_MATCH_PATTERN: ${SITE_MATCH_PATTERN} at: ${URL}`);

    // setTimeout(()=>{
    //     console.log(`${URL} has ${document.getElementsByTagName('video').length} video elements`);
    //     console.log(`${URL} has ${document.getElementsByTagName('audio').length} audio elements`);
    //     console.log(`${URL} has ${document.getElementsByTagName('embed').length} embed elements`);
    // }, 3000);


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

    function addListener(elem,evt,method,options) {
        const listener = {elem: elem, evt: evt, method: method, options: options};
        console.log('add listener: ', listener);
        rmListener(evt);
        LISTENERS.set(evt,listener);
        elem.addEventListener(evt, method, options);
    }

    function rmListener(evt) {
        if (LISTENERS.has(evt)) {
            const listener = LISTENERS.get(evt);
            LISTENERS.delete(evt);
            console.log('remove listener: ', listener);
            listener.elem.removeEventListener(listener.evt, listener.method, listener.options);
        }
    }

    function applySettings(settings) {
        console.log(SITE_MATCH_PATTERN, ' applySettings(): ', settings);

        const events = settings.get('events');
        for (const s_key of events.keys()) {
            if (events.get(s_key) == 1) {
                addListener(window, s_key, (x)=>{x.stopImmediatePropagation();}, {capture: true});
                console.log(`events on ${s_key} = ${events.get(s_key)}`);
            } else if (events.get(s_key) == 2) {
                addListener(window, s_key, ()=>{notifyOfEvent(s_key);}, {capture: false});
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

    function startMutationObserver() {
        const callback          = (mutationRecords, observer) => {
            mutationRecords.forEach((mutationRecord) => {
                mutationRecord.addedNodes.forEach((node, _nodeListIdx, _nodeList) => {
                    if ( node.tagName === 'IFRAME' ){
                        console.log(`new iframe from ${URL} @ ${node.src}`);
                        console.log(`mutationRecords: ${mutationRecords.length} mutationRecord.addedNodes: ${mutationRecord.addedNodes.length}`);
                        PORT.postMessage({
                            msgType: 'new_iFrame'
                            , matchPattern: SITE_MATCH_PATTERN
                        });
                    }
                });
            });
        }
        // const targetNode        = window;
        const targetNode        = document.documentElement;
        const observer          = new MutationObserver(callback);
        const observerOptions   = { childList: true, subtree: true }

        observer.observe(targetNode, observerOptions);
    }

    /***************************
     * Functions: Methods implementations
     ***************************/

    METHODS['action_setToForeground'] = ()=>{
        // it appears that calling setToForeground() once is enough (the properties
        // do not change subsequently, even when changing the visibility); you can
        // see this by allowing event 'visibilitychange' and turning on special method
        // 'log_event_visibilitychange_visibilityState' and then changing visibility
        // of the site (this should log visibilityState: 'visible' and hidden: false

        setToForeground();
        // setInterval(setToForeground, 10000);  // clear with clearInterval();
    };

    METHODS['log_event_visibilitychange_visibilityState'] = ()=>{
        window.addEventListener(
            "visibilitychange"
            , ()=>{
                const msg = {
                    visibilitychange_visibilityState:   document.wrappedJSObject.visibilityState
                    , visibilitychange_hidden:          document.wrappedJSObject.hidden
                    , visibilitychange_hasFocus_f:      document.wrappedJSObject.hasFocus()
                };
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

    /* // can run this from the page console for some light enlightenment
     * // (but you might need to run this at a site with the right CSP,
     * // which is found in the HTTP header [not the HTML header]; for example
     * // github.com has the wrong CSP so 'eval()' is not allowed):
      setTimeout(()=>{
          const properties = [
              'document.visibilityState'
              , 'document.head.visibilityState'
              , 'document.body.visibilityState'
              , 'document.hidden'
              , 'document.head.hidden'
              , 'document.body.hidden'
              , 'document.hasFocus()'
              , 'document.fullscreenEnabled'
              , 'document.height'
              , 'document.width'
          ];
          for (const p of properties) {
              console.log(p+': ', eval(p));
          }
      }, 3000)
     *
     * // Other things to check:
     * window.getComputedStyle(elem)['visibility']
     * window.getComputedStyle(elem)['display']
     *
     * // could maybe combine the below with dispatching events described in:
     * // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
     * for (const el of document.querySelectorAll('*')) {
     *     if ( el.onreadystatechange !== undefined ) {
     *         console.log(el.onreadystatechange);
     *     }
     * }
     */

    function setToForeground() {
        // see: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts

        // can also using Reflect.defineProperty() here
        Object.defineProperties(
            document.wrappedJSObject, {
                hidden:             {value: false}
                , visibilityState:  {value: 'visible'}
            }
        );

        exportFunction(function hasFocus(){ return true; }, document, {defineAs:'hasFocus'});
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
            , hasFocus_f:               document.wrappedJSObject.hasFocus()
            , fullscreenEnabled:        document.wrappedJSObject.fullscreenEnabled
            , height:                   document.wrappedJSObject.height
            , width:                    document.wrappedJSObject.width
            , document_properties:      document_properties
            , window_properties:        window_properties
            , all_element_properties:   all_element_properties
        };
        notifyOfEvent(allEntries);
    }
}

undefined; // return value for browser.tabs.executeScript()

