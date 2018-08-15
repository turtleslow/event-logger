
// open file:///home/owner/software/myCode/firefox-ext/event-logger/test/test1.html

'use strict';

const LOG       = document.getElementById('p_log');
const P1        = document.getElementById('p1');
const DIV1      = document.getElementById('div1');
const DIV1_1    = document.getElementById('div1_1');

LOG.innerHTML += 'Log:';


/********************************
 * Listeners
 ********************************/
makeListener('document', 'focusout');
makeListener('document', 'blur');
makeListener('window', 'blur');
makeListener('P1', 'blur');
makeListener('DIV1', 'blur');

true && setInterval( ()=>{
    log('visibilityState.document: '    + document.visibilityState);
    log('hidden.document: '             + document.hidden);
    log('hasFocus().document: '         + document.hasFocus());
    log('visibilityState.window: '      + window.visibilityState);
    log('visibilityState.DIV1: '        + DIV1.visibilityState);
    log('childElementCount.DIV1: '      + DIV1.childElementCount);
    log('visibilityState.P1: '          + P1.visibilityState);
}, 5000);


/********************************
 * XMLHttpRequest
 ********************************/
const URL       = 'file:///home/owner/software/myCode/firefox-ext/event-logger/test/sometext.txt';
const xhttp     = new XMLHttpRequest();
xhttp.overrideMimeType("text/plain");
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       log(xhttp.responseText);
    }
};
setInterval(()=>{
    xhttp.open('GET', URL, true);
    xhttp.send();
}, 1000);


/********************************
 * Methods
 ********************************/

function makeListener(node, evt) {
    eval(node).addEventListener(evt, function( event ) {
        // event.target.style.background = 'pink';
        log( node + '.' + evt );
    }, true);

}

function log(str) {
    LOG.innerHTML += '</br>' + new Date() + ': &emsp;' + str;
}
