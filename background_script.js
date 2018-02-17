function onError(tab){
    // nothing here yet
}

function closeTab(tab) {
    setTimeout(()=>{ browser.tabs.remove(tab.id); }, 2500);
}

var newTab = browser.tabs.create({url: "http://example.com"});
newTab.then(closeTab,onError);



// var executing = browser.tabs.executeScript(
//   2, {
//     file: "/content-script.js"
// });
// executing.then(onExecuted, onError);
// 
// var makeItGreen = 'document.body.style.border = "5px solid green"';
// 
// var executing = browser.tabs.executeScript({
//   code: makeItGreen
// });
