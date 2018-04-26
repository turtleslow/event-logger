// http://jsfiddle.net/uselesscode/qm5ag/
// https://stackoverflow.com/questions/31048215/how-to-create-txt-file-using-javascript-html5
// http://jsbin.com/bonuta/22/edit?html,js,output
// https://www.w3schools.com/howto/howto_js_filter_lists.asp

/***************************
 * Globals
 ***************************/
"use strict";

let   START_TIME        = new Date();
const PORT              = browser.runtime.connect({name:"log"});
const EVENTS            = new Array();
const EVENT_TARGETS     = ['visibilitychange','resize','pagehide','focusout','blur','unload'];
const METHODS           = (()=>{
    const a = ['action_setToForeground', 'log_event_visibilitychange_visibilityState'];
    for (const evt of EVENT_TARGETS){
        a.push('action_stop_' + evt);
        a.push('log_event_' + evt);
    }
    const s = new Set(a.sort());
    return s;
})();
const SITES             = new Set(["<all_urls>","*://*.youtube.com/*","*://*.accuradio.com/*","*://*.slacker.com/*","*://*.pandora.com/*","*://*.jango.com/*","*://*.8tracks.com/*"]);
const METHODS_ACTIVE    = new Set(METHODS);
const SITES_ACTIVE      = (()=>{const s = new Set(SITES); s.delete("<all_urls>"); return s;})()

/***************************
 * Listeners
 ***************************/

PORT.onMessage.addListener((msg)=>{
    if( msg.msgType == 'eventNotification' ){
        const m = JSON.parse(msg.body);
        EVENTS.push(m);
        updateEventsHeader();
        document.getElementById("events").innerHTML += new Date().toISOString() + ": " + JSON.stringify(m,null,2) + "<br/>";
    } else {
        console.error('unexpected msgType');
    }
});

document.getElementById("button_addSite").addEventListener("click", ()=>{
    console.log("click button_addSite");
    const newSite = document.getElementById("textBox_addSite").value;
    SITES.add(newSite);
    initForm(SITES,'form_sites');
    formatForm(SITES_ACTIVE,'form_sites');
});

document.getElementById("button_rmSite").addEventListener("click", ()=>{
    console.log("click button_rmSite");
    rmSelected('form_sites',[SITES,SITES_ACTIVE]);
    initForm(SITES,'form_sites');
    formatForm(SITES_ACTIVE,'form_sites');
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
    clearArray(EVENTS);
    START_TIME = new Date();
    updateEventsHeader();
    document.getElementById("events").innerHTML = "";
});

document.getElementById("button_sites").addEventListener("click", ()=>{
    getSetFromSelectedForm(SITES_ACTIVE,'form_sites');
    getSetFromSelectedForm(METHODS_ACTIVE,'form_events');
    formatForm(SITES_ACTIVE,'form_sites');
    formatForm(METHODS_ACTIVE,'form_events');
    sendSitesAndMethods(SITES_ACTIVE,METHODS_ACTIVE);
    console.log("click button_sites");
    showSelected("click button_sites");
});

document.getElementById("form_sites").addEventListener("input", ()=>{
    console.log("input form_sites");
    showSelected("input form_sites");
});


/***************************
 * Functions
 ***************************/

function updateEventsHeader(){
    document.getElementById("events_header").innerHTML = EVENTS.length + " events since " + START_TIME.toISOString();
}

function getSetFromSelectedForm(set,form_name){
    set.clear();
    for(const option of document.getElementById(form_name)){
        if (option.selected){
            set.add(option.value);
        }
    }
}

function rmSelected(form_name,sets){
    for(let option of document.getElementById(form_name)){
        if (option.selected){
            for(const s of sets){
                s.delete(option.value);
            }
        }
    }
}

function sendSitesAndMethods(sites_active,methods_active){
    PORT.postMessage({
        msgType: 'setContentMethods'
        , sites_active: sites_active
        , methods_active: methods_active
    });
}

function showSelected(source){
    const list = document.getElementById('form_sites');
    let selected = source + "<br/>";
    let count = 0;
    for(const option of list){
        if (option.selected){
            selected += count==0 ? option.value : ", "+option.value;
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
    textElem.value = JSON.stringify(EVENTS,null,2);
    document.body.appendChild(textElem);
    textElem.focus();
    textElem.select();
    const successful = document.execCommand('copy');
    document.getElementById("clipboard_notice").innerHTML = "Log copied "+new Date().toISOString();
    document.body.removeChild(textElem);

    // This API is not yet implemented in Firefox as of version 59.0
    // Clipboard.writeText(JSON.stringify(EVENTS,null,2)).then(()=>{
    //     document.getElementById("clipboard_notice").innerHTML = "copied"+new Date().toISOString();
    // });
}

function saveLogToFile(){
    document.getElementById("savelog_notice").innerHTML = "Log saved "+new Date().toISOString();

    const blob = new Blob([JSON.stringify(EVENTS,null,2)], {type: 'application/json'});
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

function initForm(set,form_name) {
    const options = document.getElementById(form_name).options;

    // clear previous form
    for (let o of options){
        o = null;
    }
    options.length = 0;

    // add options to form
    for (const v of set){
        options[options.length] = new Option(v,v);
    }
}

function formatForm(set,form_name) {
    for(const option of document.getElementById(form_name)){
        if (set.has(option.value)){
            option.style.color            = "rgb(0, 0, 0, 1.0)";
            option.style.backgroundColor  = "rgb(0, 255, 0, 0.1)";
        } else {
            option.style.color            = "rgb(0, 0, 0, 0.5)";
            option.style.backgroundColor  = "rgb(255, 0, 0, 0.1)";
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

updateEventsHeader();

initForm(SITES,'form_sites');
initForm(METHODS,'form_events');
formatForm(SITES_ACTIVE,'form_sites');
formatForm(METHODS_ACTIVE,'form_events');

sendSitesAndMethods(SITES_ACTIVE,METHODS_ACTIVE);
