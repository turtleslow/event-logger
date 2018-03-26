// http://jsfiddle.net/uselesscode/qm5ag/
// https://stackoverflow.com/questions/31048215/how-to-create-txt-file-using-javascript-html5
// http://jsbin.com/bonuta/22/edit?html,js,output
// https://www.w3schools.com/howto/howto_js_filter_lists.asp

/////////////////////////////////////////
// Globals
/////////////////////////////////////////

var START_TIME  = new Date();
var PORT        = browser.runtime.connect({name:"log"});
var EVENTS      = new Array();
var SITES       = ["youtube.com","accuradio.com","slacker.com","pandora.com","jango.com","8tracks.com"];
var LISTENERS   = ["visibilitychange.visibilityState","resize"];


/////////////////////////////////////////
// Listeners
/////////////////////////////////////////

PORT.onMessage.addListener((m)=>{
    EVENTS.push(m);
    updateEventsHeader();
    document.getElementById("events").innerHTML += new Date().toISOString() + ": " + JSON.stringify(m) + "<br/>";
});

document.getElementById("button_savelog").addEventListener("click", ()=>{
    console.log("click button_savelog");
    saveLogToFile();
});

document.getElementById("button_displaylog").addEventListener("click", ()=>{
    console.log("click button_displaylog");
    toggleDisplayLog();
});

document.getElementById("button_sites").addEventListener("click", ()=>{
    console.log("click button_sites");
    showSelected("click button_sites");
});

document.getElementById("form_sites").addEventListener("input", ()=>{
    console.log("click form_sites");
    showSelected("click form_sites");
});


/////////////////////////////////////////
// Functions
/////////////////////////////////////////

function updateEventsHeader(){
    document.getElementById("events_header").innerHTML = EVENTS.length + " events since " + START_TIME.toISOString();
}

function showSelected(source){
    var list = document.getElementById('form_sites');
    var selected = source + "<br/>";
    var count = 0;
    for(var ii=0;ii<list.length;++ii){
        var option = list[ii];
        if (option.selected){
            selected += count==0 ? option.value : ", "+option.value;
            ++count;
        }
    }
    selected = "Selected " + count + " of " + list.length + ":<br/>" + selected;
    document.getElementById("form_sites_out").innerHTML = selected;
}

function toggleDisplayLog() {
    var x = document.getElementById("events");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function saveLogToFile(){
    document.getElementById("savelog_notice").innerHTML = "Log saved "+new Date().toISOString();

    var blob = new Blob([JSON.stringify(EVENTS)], {type: 'text/plain'});
    var objectURL = URL.createObjectURL(blob);

    var downloading = browser.downloads.download({
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
     * var revokeOption1 = (id)=>{
     *     URL.revokeObjectURL(objectURL);
     *     console.log(`revoke() ${objectURL}`);
     * }
     *
     * var revokeOption2 = (id)=>{
     *     console.log(`started download with id ${id}`);
     *     browser.downloads.search({id:id}).then(
     *         (downloadItems)=>{
     *             for(var ii=0; ii<downloadItems.length; ++ii){
     *                 var dlItem = downloadItems[ii];
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

/**********************************************************************
 * Do anything when download is finished?
 **********************************************************************
 * browser.downloads.onChanged.addListener(
 *     (delta)=>{
 *       if (delta.state && delta.state.current === "complete") {
 *         console.log(`Download ${delta.id} has completed.`);
 *       }
 *     }
 * );
 */


/////////////////////////////////////////
// Run
/////////////////////////////////////////

updateEventsHeader();

for(var ii=0;ii<SITES.length;++ii){
    var site = SITES[ii];
    var list = document.getElementById('form_sites');
    var options = list.options;
    options[options.length] = new Option(site,site);
}

for(var ii=0;ii<LISTENERS.length;++ii){
    var evnt = LISTENERS[ii];
    var list = document.getElementById('form_events');
    var options = list.options;
    options[options.length] = new Option(evnt,evnt);
}

{
    var list = document.getElementById('form_events');
    for(var ii=0;ii<list.length;++ii){
        list.options[ii].style.backgroundColor  = "rgb(0, 0, 255, 0.2)";
        list.options[ii].style.color            = "rgb(0, 0,   0, 0.5)";
    }
}

