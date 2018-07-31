
/***************************
 * Clean history
 ***************************/
// also see: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/user_interface/Extension_pages#Extension_pages_and_history

export function deleteExtHistory() {
    const URL_EXT = browser.extension.getURL("");

    const searchingHistory = browser.history.search({
        text: URL_EXT
        , startTime: new Date(0)
        // , maxResults: 1
    });

    searchingHistory.then((results) => {
        for (const ri of results) {
            console.log("remove url: ", ri);
            browser.history.deleteUrl({url: ri.url});
        }

        console.log(`deleteExtHistory(): ${results.length} items`);
    });
}
