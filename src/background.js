import { parseSync } from 'subtitle'

console.info("SUBBER is running");

/**
 * Gets called before every XHR request.
 * If the request is for a subtitles file, the file is fetched and parsed.
 */
function fileListener(request) {
    let regex = /\/\?o=|srt$|vtt$|ttml2$/gi;

    if (request.url.match(regex)) {
        console.debug(request);

        // check if request comes from a tab (and not from the extension)
        if (request.tabId >= 0) {
            // show page action icon
            browser.pageAction.show(request.tabId);
            browser.pageAction.setIcon({
                tabId: request.tabId, path: "../img/cc-solid-48.png"
            });

            // fetch subtitles file
            fetch(request.url)
                .then(response => response.text())
                .then(body => {
                    let subtitles = parseSync(body);
                    console.debug(subtitles);

                    // sanitize text lines
                    let sanitizedSubtitles = Array.from(subtitles).map(node => {
                        if (node.type == "header") {
                            return node;
                        } else {
                            node.data.text = sanitizeText(node.data.text);
                            return node;
                        }
                    })

                    // store subtitles object in local storage, key = tab title
                    browser.tabs.get(request.tabId).then(tab => {
                        let storageObject = {}
                        storageObject[tab.title] = {
                            'url': tab.url,
                            'subtitles': sanitizedSubtitles
                        }
    
                        browser.storage.local.set(storageObject);
                        console.debug("Stored: ");
                        browser.storage.local.get(tab.title)
                            .then(obj => console.debug(obj));
                    });
                })
        }
    }
}

function ytListener(request) {
}

/**
 * Removes tags like <c..> and line breaks from string
 */
function sanitizeText(str) {
    str = str.replace(/\<(.*?)\>/gim, "");
    str = str.replace(/\n/gim, " ");
    return str.trim();
}


browser.webRequest.onBeforeRequest.addListener(
    fileListener,
    { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
);

browser.webRequest.onBeforeRequest.addListener(
    ytListener,
    { urls: ["https://www.youtube.com/*"], types: ["xmlhttprequest"] }
);