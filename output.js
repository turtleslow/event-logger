
var myPort = browser.runtime.connect({name:"log"});

document.body.innerHTML += "Events since " + new Date().toISOString() + ":<br/><br/>";

myPort.onMessage.addListener(function(m) {
    document.body.innerHTML += new Date().toISOString() + ": " + JSON.stringify(m) + "<br/>";
});

