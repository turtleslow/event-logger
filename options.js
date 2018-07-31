
'use strict';

import * as settings from './modules/settings.js'

// http://jsfiddle.net/uselesscode/qm5ag/
// https://stackoverflow.com/questions/31048215/how-to-create-txt-file-using-javascript-html5
// http://jsbin.com/bonuta/22/edit?html,js,output
// https://www.w3schools.com/howto/howto_js_filter_lists.asp
//
// TODO TODO TODO TODO TODO TODO TODO TODO TODO:
// - remove try {} catch () {} blocks
// - remove console.log() messages

console.log('running options.js');

/***************************
 * Globals
 ***************************/
"use strict";

let START_TIME          = new Date();
const LOG               = new Array();
const PORT              = browser.runtime.connect({name:"log"});

/***************************
 * NEW PER-SITE SETTINGS [[UNUSED]]
 ***************************/
// Object( [sites, ...], Map(site, Map([events,special_methods], Map( event, value ) ) ) )
let SETTINGS;

function run() {
    settings.load().then(
        (s)=>{
            SETTINGS = s;
            init_form_sites(s);
            init_form_events(s,'events','form_events');
            init_form_events(s,'special_methods','form_special_methods');
        }
        , (s)=>{console.error("storage.local.get()");}
    )
}

function clear_options(options) {
    // clear previous form
    for (let o of options){
        o = null;
    }
    options.length = 0;
}

function init_form_sites(settings) {
    const options = document.getElementById('form_sites').options;
    clear_options(options);

    // add options to form
    for (const site of Array.from(settings['sites'].keys()).sort()){
        options[options.length] = new Option(site,0);
    }
}

function init_form_events(settings, settings_name, form_name) {
    // Map([events,special_methods], Map(event, Map(value, Set(site) ) ) )
    const options = document.getElementById(form_name).options;
    clear_options(options);

    for (const evt of settings[settings_name]) {
        // evt_code == -1 indicates mixed setting
        let evt_code;
        for (const option of document.getElementById('form_sites')){
            if (option.selected){
                const site = option.text;

                let code = settings['sites'].get(site).get(settings_name).get(evt);
                if (code === undefined) {
                    code = 0;
                }

                if (evt_code === undefined) {
                    evt_code = code;
                } else if (evt_code != code) {
                    evt_code = -1;
                    break;
                }
            }
        }

        if (evt_code === undefined) {
            evt_code = 0;
        }

        options[options.length] = new Option(evt,evt_code);
    }

    formatForm(form_name);
}

/***************************
 * Listeners
 ***************************/

PORT.onMessage.addListener((msg)=>{
    if ( msg.msgType == 'eventNotification' ){
        const m = JSON.parse(msg.body);
        LOG.push(m);
        updateEventsHeader();
        document.getElementById("events").innerHTML += new Date().toISOString() + ": " + JSON.stringify(m,null,2) + "<br/>";
    } else {
        console.error('unexpected msgType');
    }
});

document.getElementById("restore_default_settings").addEventListener("click", ()=>{
    settings.save(settings.defaultSettings()).then(run);
});

document.getElementById("button_addSite").addEventListener("click", ()=>{
    console.log("click button_addSite");
    const newSite = document.getElementById("textBox_addSite").value;

    const map = new Map();
    for (const evt_type of ['events','special_methods']){
        map.set(evt_type, new Map());
    }

    SETTINGS['sites'].set(newSite, map);
    settings.save({'sites' : SETTINGS['sites']} );
    run();
});

document.getElementById("button_rmSite").addEventListener("click", ()=>{
    console.log("click button_rmSite");

    for (let option of document.getElementById('form_sites')){
        if (option.selected){
            SETTINGS['sites'].delete(option.text);
        }
    }

    settings.save({'sites' : SETTINGS['sites']} );
    run();
});

document.getElementById("button_addEvent").addEventListener("click", ()=>{
    console.log("click button_addEvent");
    const newEvent = document.getElementById("textBox_addEvent").value;

    SETTINGS['events'] = new Set([...SETTINGS['events'], newEvent].sort());

    settings.save({'events' : SETTINGS['events']});
    init_form_events(SETTINGS,'events','form_events');
});

document.getElementById("button_rmEvent").addEventListener("click", ()=>{
    console.log("click button_rmEvent");

    for (const option of document.getElementById('form_events')) {
        if (option.selected){
            const evt = option.text;
            SETTINGS['events'].delete(evt);
            for (const site of SETTINGS['sites'].values()) {
                site.get('events').delete(evt);
            }
        }
    }

    settings.save({'events' : SETTINGS['events']});
    init_form_events(SETTINGS,'events','form_events');
});

document.getElementById("button_displaylog").addEventListener("click", ()=>{
    console.log("click button_displaylog");
    toggleDisplayLog();
});

document.getElementById("button_copylog").addEventListener("click", ()=>{
    console.log("click button_copylog");
    copyLogToClipboard();
});

document.getElementById("button_savelog").addEventListener("click", ()=>{
    console.log("click button_savelog");
    saveLogToFile();
});

document.getElementById("button_clearlog").addEventListener("click", ()=>{
    console.log("click button_clearlog");
    clearArray(LOG);
    START_TIME = new Date();
    updateEventsHeader();
    document.getElementById("events").innerHTML = "";
});

document.getElementById("set_event_clear"        ).addEventListener("click", ()=>{setActions('form_events'         ,'events'         ,0);});
document.getElementById("set_event_block"        ).addEventListener("click", ()=>{setActions('form_events'         ,'events'         ,1);});
document.getElementById("set_event_log"          ).addEventListener("click", ()=>{setActions('form_events'         ,'events'         ,2);});

document.getElementById("set_special_methods_off").addEventListener("click", ()=>{setActions('form_special_methods','special_methods',0);});
document.getElementById("set_special_methods_on" ).addEventListener("click", ()=>{setActions('form_special_methods','special_methods',1);});

document.getElementById("form_sites").addEventListener("input", ()=>{
    console.log("input form_sites");
    init_form_events(SETTINGS,'events','form_events');
    init_form_events(SETTINGS,'special_methods','form_special_methods');
    showSelected("input form_sites");
});


/***************************
 * Functions
 ***************************/

function setActions(form_name,settings_name,new_value){
    updateSettingsFromForm(form_name,settings_name,new_value);
    init_form_events(SETTINGS,settings_name,form_name);
    settings.save({'sites' : SETTINGS['sites']} );

    console.log("setAction: (" + form_name + ',' +  new_value + ")");
    showSelected("click button");
}

function updateEventsHeader(){
    document.getElementById("events_header").innerHTML = LOG.length + " events since " + START_TIME.toISOString();
}

function updateSettingsFromForm(form_name,settings_name,new_value){
    // Object.keys(data_object).forEach((k)=>{ delete data_object[k]; });

    const sites = new Set( [...document.getElementById('form_sites')].filter(
        (option)=>{ return option.selected; }
    ).map(
        (option)=>{ return option.text; }
    ));

    for (const option of document.getElementById(form_name)) {
        if (option.selected) {
            for (const site of sites) {
                SETTINGS['sites'].get(site).get(settings_name).set(option.text,new_value);
            }
        }
    }
}

function rmSelected(form_name,data_object){
    for(let option of document.getElementById(form_name)){
        if (option.selected){
            delete data_object[option.text];
        }
    }
}

function showSelected(source){
    const list = document.getElementById('form_sites');
    let selected = source + "<br/>";
    let count = 0;
    for(const option of list){
        if (option.selected){
            selected += count==0 ? option.text : ", "+option.text;
            ++count;
        }
    }
    selected = "Selected " + count + " of " + list.length + ":<br/>" + selected;
    document.getElementById("form_sites_out").innerHTML = selected;
}

function toggleDisplayLog() {
    const evnts = document.getElementById("events");
    if (evnts.style.display === "none") {
        evnts.style.display = "block";
    } else {
        evnts.style.display = "none";
    }
}

function copyLogToClipboard(){
    const textElem = document.createElement("textarea");
    textElem.value = JSON.stringify(LOG,null,2);
    document.body.appendChild(textElem);
    textElem.focus();
    textElem.select();
    const successful = document.execCommand('copy');
    document.getElementById("clipboard_notice").innerHTML = "Log copied "+new Date().toISOString();
    document.body.removeChild(textElem);

    // This API is not yet implemented in Firefox as of version 59.0
    // Clipboard.writeText(JSON.stringify(LOG,null,2)).then(()=>{
    //     document.getElementById("clipboard_notice").innerHTML = "copied"+new Date().toISOString();
    // });
}

function saveLogToFile(){
    document.getElementById("savelog_notice").innerHTML = "Log saved "+new Date().toISOString();

    const blob = new Blob([JSON.stringify(LOG,null,2)], {type: 'application/json'});
    const objectURL = URL.createObjectURL(blob);

    const downloading = browser.downloads.download({
        url: objectURL
        , filename: 'events.txt'
        , conflictAction: 'overwrite'
    });

    /**********************************************************************
     * revokeObjectURL() can be called any time after sourceopen is handled
     * revokeOption1() and revokeOption2() achieve the same goal,
     * however, revoking actually disables the file in the download manager
     * so ... don't revoke
     **********************************************************************
     * const revokeOption1 = (id)=>{
     *     URL.revokeObjectURL(objectURL);
     *     console.log(`revoke() ${objectURL}`);
     * }
     *
     * const revokeOption2 = (id)=>{
     *     console.log(`started download with id ${id}`);
     *     browser.downloads.search({id:id}).then(
     *         (downloadItems)=>{
     *             for(let ii=0; ii<downloadItems.length; ++ii){
     *                 const dlItem = downloadItems[ii];
     *                 URL.revokeObjectURL(dlItem.url);
     *                 console.log(`revoke() ${dlItem.url}`);
     *             }
     *         }
     *     );
     * }
     *
     * downloading.then(revokeOption1, revokeOption1);
     * downloading.then(revokeOption2, revokeOption2);
     */
}

function initAndFormatForm(data_object,form_name) {
    initForm(data_object,form_name);
    formatForm(form_name);
}

function initForm(data_object,form_name) {
    const options = document.getElementById(form_name).options;

    // clear previous form
    for (let o of options){
        o = null;
    }
    options.length = 0;

    // add options to form
    for (const kv of Object.entries(data_object).sort()){
        if( data_object.hasOwnProperty(kv[0]) ) {
            options[options.length] = new Option(kv[0],kv[1]);
        }
    }
}

function formatForm(form_name) {
    for(const option of document.getElementById(form_name)){
        if (option.value == -1){
            option.style.color            = "rgb(255, 0, 0, 0.8)";
            option.style.backgroundColor  = "rgb(0, 0, 0, 0.05)";
        } else if (option.value == 0){
            option.style.color            = "rgb(0, 0, 0, 1.0)";
            option.style.backgroundColor  = "rgb(255, 255, 255, 0.1)";
        } else if (option.value == 1){
            option.style.color            = "rgb(0, 0, 0, 1.0)";
            option.style.backgroundColor  = "rgb(0, 255, 0, 0.1)";
        } else if (option.value == 2){
            option.style.color            = "rgb(0, 0, 0, 1.0)";
            option.style.backgroundColor  = "rgb(255, 255, 0, 0.1)";
        } else {
            console.error('unexpected Option.value: ' + option.value);
        }
    }
}

function clearArray(a){
    while(a.length > 0){
        a.pop();
    }
}

/*****************************************
 * Do anything when download is finished?
 *****************************************
 * browser.downloads.onChanged.addListener(
 *     (delta)=>{
 *       if (delta.state && delta.state.current === "complete") {
 *         console.log(`Download ${delta.id} has completed.`);
 *       }
 *     }
 * );
 */


/***************************
 * Run
 ***************************/

run();
updateEventsHeader();


