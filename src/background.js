import { parseSync } from 'subtitle'

console.info("SUBBER is running");

let subtitleCache = {}



/////////////  ENTRY POINTS  /////////////

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

            // check if entry already exists in localStorage
            getFromStorage(request.documentUrl)
                .then(storageItem => {
                    console.debug("Storage Item:", storageItem);

                    // cache information about this tab's subtitles
                    browser.tabs.get(request.tabId).then(tab => {
                        subtitleCache[request.documentUrl] = {
                            "originUrl": request.documentUrl,
                            "subFileUrl": request.url,
                            "tabId": request.tabId,
                            "title": tab.title,
                            "existsInStorage": storageItem[request.documentUrl] != undefined,
                        }
                        console.debug("Cache:", subtitleCache);
                    });

                });

            // show page action icon
            browser.pageAction.show(request.tabId);
            browser.pageAction.setIcon({
                tabId: request.tabId, path: "../static/img/cc-solid-48.png"
            });

            // fetchAndParseSubtitles(request.url)
            //     .then(subtitleArray => {
            //         browser.tabs.get(request.tabId).then(tab => {
            //             saveToStorage(tab.title, request.documentUrl, subtitleArray)
            //         })
            // })
        }
    }
}

function ytListener(request) {
}



/////////////  FUNCTIONS AND UTILITIES  /////////////

/**
 * Removes tags like <c..> and line breaks from string
 */
function sanitizeText(str) {
    str = str.replace(/\<(.*?)\>/gim, "");
    str = str.replace(/\n/gim, " ");
    return str.trim();
}

/**
 * fetches subtitles file from url
 * returns parsed and sanitized subtitles array
 */
function fetchAndParseSubtitles(url) {
    return fetch(url)
        .then(response => response.text())
        .then(body => {
            let subtitles = parseSync(body);
            console.debug(subtitles);

            return Array.from(subtitles).map(node => {
                if (node.type == "header") {
                    return node;
                } else {
                    node.data.text = sanitizeText(node.data.text);
                    return node;
                }
            })
        })
        .catch((error) => {
            console.error('Error while fetching subtitle file:', error);
        });
}

/**
 * stores object to storage.local (OR also sync mode)
 * changes menu item to color green, tick and "subtitles stored locally"
 * returns true when saving was successful, false when unsuccessful
 */
function saveToStorage(title, originUrl, subtitleArray) {
    let storageObject = {}
    storageObject[originUrl] = {
        'title': title,
        'subtitles': subtitleArray
    }

    return browser.storage.local.set(storageObject);
}

/**
 * reads one subtitle object from storage
 * returns ?
 */
function getFromStorage(url) {
    try {
        let requestObject = {};
        requestObject[url] = undefined;
        return browser.storage.local.get(requestObject);
    } catch (e) {
        console.error('Error while reading ' + url + ' from storage:', e)
    }
}

/**
 * reads all subtitle objects from storage
 * returns ?
 */
function getAllFromStorage() {
    try {
        return browser.storage.local.get(null);
    } catch (e) {
        console.error('Error while reading whole storage:', e)
    }
}

function openViewer(originUrl) {
    let baseUrl = browser.runtime.getURL("viewer.html");
    browser.tabs.create({ url: baseUrl + '?origin=' + encodeURIComponent(JSON.stringify(originUrl)) });
}



/////////////  MESSAGING  /////////////

function handleMessage(request, sender, sendResponse) {
    if (typeof request.msg !== undefined) {
        switch (request.msg) {
            case "existsInStorage":
                sendResponse({ response: subtitleCache[request.url].existsInStorage });
                break;
            case "openViewer":
                if (subtitleCache[request.url].existsInStorage) {
                    openViewer(request.url);
                } else {
                    fetchAndParseSubtitles(subtitleCache[request.url].subFileUrl)
                        .then(subtitleArray => saveToStorage(subtitleCache[request.url].title, request.url, subtitleArray))
                        .then(() => openViewer(request.url));
                }
                break;
            case "getCacheForUrl":
                sendResponse(subtitleCache[request.url]);
                break;
            case "save":
                fetchAndParseSubtitles(subtitleCache[request.url].subFileUrl)
                    .then(subtitleArray => saveToStorage(subtitleCache[request.url].title, request.url, subtitleArray))
                break;
            default:
                break;
        }

        console.debug("Message from the popup script:", request);
    }
}

browser.runtime.onMessage.addListener(handleMessage);



/////////////  LISTENERS  /////////////

browser.webRequest.onBeforeRequest.addListener(
    fileListener,
    { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
);

browser.webRequest.onBeforeRequest.addListener(
    ytListener,
    { urls: ["https://www.youtube.com/*"], types: ["xmlhttprequest"] }
);