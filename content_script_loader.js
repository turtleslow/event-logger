
'use strict';

/***************************
 * Globals
 ***************************/
// TODO: content scripts currently don't work if a site matches multiple match patterns

console.log(`content_script_loader.js for ${window.location.href}`);

// Note: everything in content_script.js is in the same scope as this function for
// window.fames[0], so we don't declare PORT here
browser.runtime.connect({name:'content_loader'}).postMessage({
    msgType: 'matchPattern'
    , matchPattern: SITE_MATCH_PATTERN
});

