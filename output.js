// http://jsfiddle.net/uselesscode/qm5ag/
// https://stackoverflow.com/questions/31048215/how-to-create-txt-file-using-javascript-html5
// http://jsbin.com/bonuta/22/edit?html,js,output

var PORT    = browser.runtime.connect({name:"log"});
var EVENTS  = new Array();

document.getElementById("events_header").innerHTML += "Events since " + new Date().toISOString() + ":<br/><br/>";

PORT.onMessage.addListener(function(m) {
    EVENTS.push(m);
    document.getElementById("events").innerHTML += new Date().toISOString() + ": " + JSON.stringify(m) + "<br/>";
});

// Save log data
document.getElementById("savelog").addEventListener("click", function(){
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
});
