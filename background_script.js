
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

// open options.html
var optionsPage = browser.runtime.openOptionsPage();

// var NEW_TAB = browser.tabs.create({url: browser.extension.getURL("") + "logger.html"});
// newTab.then(function(){},function(){});
