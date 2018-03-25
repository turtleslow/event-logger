// http://jsfiddle.net/uselesscode/qm5ag/
// https://stackoverflow.com/questions/31048215/how-to-create-txt-file-using-javascript-html5
// http://jsbin.com/bonuta/22/edit?html,js,output
// https://www.w3schools.com/howto/howto_js_filter_lists.asp

/////////////////////////////////////////
// Globals
/////////////////////////////////////////

var PORT    = browser.runtime.connect({name:"log"});
var EVENTS  = new Array();
var SITES   = ["youtube.com","accuradio.com","slacker.com","rdio.com","jango.com","8tracks.com"];


/////////////////////////////////////////
// Listeners
/////////////////////////////////////////

PORT.onMessage.addListener(function(m) {
    EVENTS.push(m);
    document.getElementById("events").innerHTML += new Date().toISOString() + ": " + JSON.stringify(m) + "<br/>";
});

document.getElementById("button_savelog").addEventListener("click", function(){
    console.log("click button_savelog");
    saveLogToFile();
});

document.getElementById("button_sites").addEventListener("click", function(){
    console.log("click button_sites");
    showSelected("click button_sites");
});

document.getElementById("form_sites").addEventListener("click", function(){
    console.log("click form_sites");
    showSelected("click form_sites");
});


/////////////////////////////////////////
// Functions
/////////////////////////////////////////

function saveLogToFile(){
    document.getElementById("savelog_notice").innerHTML = "Log saved "+new Date().toISOString();

    var blob = new Blob([JSON.stringify(EVENTS)], {type: 'text/plain'});
    var objectURL = URL.createObjectURL(blob);

    var downloading = browser.downloads.download({
        url: objectURL
        , filename: 'events.txt'
        , conflictAction: 'overwrite'
    });

    // TODO: see the following URL to revoke the objectURL
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/onChanged
    revoke = function(xx){URL.revokeObjectURL(objectURL);}

    //downloading.then(revoke, revoke);
}

function addSite(site){
    var list = document.getElementById('form_sites');
    var options = list.options;
    options[options.length] = new Option(site,site);
}

function showSelected(source){
    var list = document.getElementById('form_sites');
    var selected = source + "<br/>";
    for(var ii=0;ii<list.length;++ii){
        var option = list[ii];
        if (option.selected){
            selected += "yes: ";
        } else {
            selected += "no:  ";
        }
        selected += option.value + "<br/>";
    }
    document.getElementById("form_sites_output").innerHTML = selected;
}


/////////////////////////////////////////
// Run
/////////////////////////////////////////

document.getElementById("events_header").innerHTML += "Events since " + new Date().toISOString() + ":<br/><br/>";

for(var ii=0;ii<SITES.length;++ii){
    addSite(SITES[ii]);
}



