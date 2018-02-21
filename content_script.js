
var myPort  = browser.runtime.connect({name:"content"});
var url     = window.location.href;
var t       = new Date();

myPort.postMessage({
    time: t
    , url: url
});

