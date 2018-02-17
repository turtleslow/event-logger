function setBody(maxIter) {
    var iter = Math.floor(Math.random() * maxIter);
    document.body.innerHTML = new Date().toISOString() + "<br/>";
    for (ii=0; ii<iter; ++ii) {
        document.body.innerHTML += ii.toString() + ") Some new HTML content <br/>";
    }
    document.body.style.border = "15px solid green";
}

setBody(20);

//'use strict';

//function onCreated(tab) {}
//
//function onError(error) {}
//
//(function() {
//  var creating = browser.tabs.create({
//    url:"https://example.org"
//  });
//  creating.then(onCreated, onError);
//})();

// function onUpdated(tab) {
//   console.log(`Updated tab: ${tab.id}`);
// }
// 
// function onError(error) {
//   console.log(`Error: ${error}`);
// }
// 
// var updating = browser.tabs.update({url: "https://developer.mozilla.org"});
// updating.then(onUpdated, onError);
// 
// // function myFunction() {
//     // browser.tabs.create({url: "https://developer.mozilla.org"});
// 
     var myWindow = window.open("");
//     //window.confirm("Are you sure?");
     myWindow.close();
// };
//  
// myFunction();
