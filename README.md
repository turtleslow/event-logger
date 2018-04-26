Useful links:

General Extension Development:
https://developer.mozilla.org/en-US/Add-ons/WebExtensions  
https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Developing_WebExtensions_for_Firefox_for_Android  
https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Content_scripts#Communicating_with_background_scripts  
https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Native_messaging  
https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Working_with_files  

DOM events:
http://docs.w3cub.com/dom_events/
https://www.w3.org/TR/DOM-Level-3-Events/#event-flow
https://developer.mozilla.org/en-US/docs/Web/Events  
https://developer.mozilla.org/en-US/docs/Web/Events/fullscreenchange
https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
https://developer.mozilla.org/en-US/docs/Web/API/Document/onfullscreenchange
http://api.jquery.com/event.isImmediatePropagationStopped/

wrappedJSObject:
https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Xray_vision

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

https://stackoverflow.com/questions/8358196/onfullscreenchange-dom-event
https://github.com/mozilla/video-bg-play/  

notes:
- video-bg-play uses window.addEventListener() instead of document.addEventListener() [commit comment:  Make sure events are stopped at the capturing phase, instead of the arget phase]
