
'use strict';

import * as settings from './modules/settings.js'

const PORT = browser.runtime.connect({name:'page_action'});

PORT.onMessage.addListener((msg)=>{
    if( msg.msgType == 'matchPattern' ){
        applySettings(msg.matchPattern);
    } else {
        console.error('unexpected msgType');
    }
});

browser.tabs.query({
    active: true
    , currentWindow: true
}).then((tabs)=>{
    PORT.postMessage({
        msgType: 'getMatchPattern'
        , tabId: tabs[0].id
    });
});

function applySettings(pattern) {

    document.getElementById('matchPattern').innerHTML = `[ ${pattern} ]`;
    const menu = document.getElementById('menu_events');
    renderSettings();

    function renderSettings() {
        settings.load(null).then((s)=>{
            clearChildren(menu);
            Array.from(s['events']).sort().forEach((x)=>{addEvent(x,s);});
        });
    }

    function addEvent(key,s) {
        const li = document.createElement('LI');
        li.setAttribute('id','menu_button_event');
        li.innerHTML = key;

        const event_map         = s['sites'].get(pattern).get('events');
        const event_map_value   = event_map.get(key);

        // set values using data-* attribute, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
        li.dataset.key = key;
        setClass(li,event_map_value);

        li.addEventListener('click', ()=>{
            if (event_map_value===1) {
                event_map.set(key,0);
            } else {
                event_map.set(key,1);
            }

            // TODO: these settings don't update in the options page unless the page is reloaded
            settings.save({'sites' : s['sites']}).then(renderSettings);
        });

        menu.appendChild(li);
    }

    function setClass(li,event_map_value) {
        li.className = event_map_value===1 ? 'bg_green' : 'bg_white';
    }

    function clearChildren(node) {
        let count = 0;
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
            ++count;
        }
        return count;
    }
}

