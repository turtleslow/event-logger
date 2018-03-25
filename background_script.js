
var PORT_LOG;

function connected(port) {
    if (port.name == "log"){
        PORT_LOG = port;
    } else if (port.name == "content"){
        port.onMessage.addListener(function(m) {
            PORT_LOG.postMessage(m);
        });
    } else {
        console.log("there is something wrong here");
    }
}

browser.runtime.onConnect.addListener(connected);

function onError(tab){
    // nothing here yet
}

function closeTab(tab) {
    // setTimeout(()=>{ browser.tabs.remove(tab.id); }, 30000);
}

var NEW_TAB = browser.tabs.create({url: browser.extension.getURL("") + "output.html"});
newTab.then(closeTab,onError);

