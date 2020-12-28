let originUrl;
let subtitleObject;

let contentDiv = document.getElementById('content');
let rowTemplate = document.getElementById('tableRowTemplate');
let tableBody = document.getElementById('tableBody');

try {
    originUrl = JSON.parse(new URLSearchParams(location.search).get('origin'));
    contentDiv.innerHTML = originUrl;
    getFromStorage(originUrl)
        .then(obj => {
            console.debug("Subtitle object in viewer:", obj);
            obj[originUrl].subtitles.forEach(sub => {
                let row = rowTemplate.content.cloneNode(true);
                let td = row.querySelectorAll("td");
                td[0].textContent = formatMs(sub.data.start);
                td[1].textContent = sub.data.text;

                tableBody.appendChild(row);
            });

        });
} catch (e) {
    console.error('Error getting url params for the viewer:', e)
}

// simplify the displayed URL in the address bar TODO
// history.replaceState({}, document.title, location.origin + location.pathname);




/////////////  FUNCTIONS AND UTILITIES  /////////////

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

function formatMs(ms) {
    let seconds = ((ms % 60000) / 1000).toFixed(0);
    let minutes = Math.floor(ms / 60000);
    if (ms > 3600000) {
        let hours = Math.floor(ms / 3600000);
        return `${hours}:${(minutes < 10 ? "0" : "")}${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
    }
    return `${(minutes < 10 ? "0" : "")}${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
}