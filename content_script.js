
var PORT = browser.runtime.connect({name:"content"});

function notifyOfEvent(str) {
    var url = window.location.href;
    var t   = new Date();
    
    PORT.postMessage({
        time: t
        , url: url
        , evt: str
    });
}

window.addEventListener(
    "resize"
    , ()=>{notifyOfEvent("resize");}
);

window.addEventListener(
    "visibilitychange"
    , ()=>{
        var str = "visibilitychange.visibilityState=" + document.visibilityState;
        notifyOfEvent(str);

        // other helpful Object functions are entries(), keys(), values()
        var wjso = "doc.wjso=" + JSON.stringify(Object.entries(document.wrappedJSObject));
        notifyOfEvent(wjso);

        var fswjso = "doc.fs.wjso=" + JSON.stringify(Object.entries(document.fullscreenElement.wrappedJSObject));
        notifyOfEvent(fswjso);
    }
);
