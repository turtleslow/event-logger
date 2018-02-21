
var port_log;

function connected(port) {
    if (port.name == "log"){
        port_log = port;
    } else if (port.name == "content"){
        port.onMessage.addListener(function(m) {
            port_log.postMessage(m);
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

var newTab = browser.tabs.create({url: "/output.html"});
newTab.then(closeTab,onError);



