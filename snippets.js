
// http://archive.oreilly.com/pub/h/4164
 
// ==UserScript==
// @name          Anti-Disabler
// @namespace	  http://diveintomark.org/projects/greasemonkey/
// @description   restore context menus on sites that try to disable them
// @include       *
// @exclude       http*://mail.google.com/*
// @exclude       http://maps.google.com/*
// ==/UserScript==

with (document.wrappedJSObject || document) {
    onmouseup = null;
	onmousedown = null;
	oncontextmenu = null;
}
var arAllElements = document.getElementsByTagName('*');
for (var i = arAllElements.length - 1; i >= 0; i--) {
	var elmOne = arAllElements[i];
	with (elmOne.wrappedJSObject || elmOne) {
	    onmouseup = null;

		onmousedown = null;
		oncontextmenu = null;
	}
}


// https://greasyfork.org/en/scripts/32726-dpvs/code

// ==UserScript==
// @name         DPVS
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Disable Page Visibility API Script
// @author       Psyblade
// @match       *://*/*
// @grant        none
// ==/UserScript==

Object.defineProperties(document.wrappedJSObject,{ 'hidden': {value: false}, 'visibilityState': {value: 'visible'} });
window.addEventListener( 'visibilitychange', evt => evt.stopImmediatePropagation(), true);
