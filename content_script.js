
var myPort = browser.runtime.connect({name:"content"});

function notifyOfEvent(str) {
	var url	= window.location.href;
	var t   = new Date();
	
	myPort.postMessage({
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
	}
);