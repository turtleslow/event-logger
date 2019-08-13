
'use strict';

import * as settings from './modules/settings.js'

const PORT = browser.runtime.connect({name:'page_action'});
const ACTIVE_TAB = browser.tabs.query({
    active: true
    , currentWindow: true
});

PORT.onMessage.addListener((msg)=>{
    if( msg.msgType == 'matchPattern' ){
        applySettings(msg.matchPattern);
    } else {
        console.error('unexpected msg.msgType', msg);
    }
});

ACTIVE_TAB.then((tabs)=>{
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

        // set values using data-* attribute, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
        li.dataset.key = key;
        setClass(li,event_map.get(key));

        li.addEventListener('click', ()=>{
            if (event_map.get(key)===1) {
                event_map.set(key,0);
                setClass(li,0);
                ACTIVE_TAB.then((tabs)=>{
                    browser.tabs.sendMessage(
                        tabs[0].id
                        , {
                            msgType: 'page_action_listener_change'
                            , change: 'rm'
                            , evt: key
                            , tabId: tabs[0].id
                        }
                    );
                });
            } else {
                event_map.set(key,1);
                setClass(li,1);
                ACTIVE_TAB.then((tabs)=>{
                    browser.tabs.sendMessage(
                        tabs[0].id
                        , {
                            msgType: 'page_action_listener_change'
                            , change: 'add'
                            , evt: key
                            , tabId: tabs[0].id
                        }
                    );
                });
            }

            // TODO: these settings don't update in the options page unless the page is reloaded
            settings.save({'sites' : s['sites']}); // .then(renderSettings);
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

