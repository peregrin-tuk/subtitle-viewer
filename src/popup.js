let tab;
let viewerMenuItem = document.getElementById('menu-viewer');
let mobileMenuItem = document.getElementById('menu-mobile');
let saveMenuItem = document.getElementById('menu-save');

// Get active tab url and check whether subtitles exist in storage
browser.tabs.query({ currentWindow: true, active: true })
    .then(tabs => {
        tab = tabs[0]
        browser.runtime.sendMessage({
            msg: "existsInStorage",
            url: tabs[0].url
        }).then(msg => {
            if (msg.response) {
                // Apply styles 'already saved'
                saveMenuItem.innerHTML = '<i class="pr-2 icon-check"></i> already saved';
                saveMenuItem.classList.add('text-success');
            }
        }).catch(e => console.error('Error during existsInStore check:', e));
    });


/////////////  CLICK LISTENER  /////////////

viewerMenuItem.addEventListener("click", function() {
    browser.runtime.sendMessage({
        msg: "openViewer",
        url: tab.url
    }).catch(e => console.error('Error sending open viewer message:', e));
})

mobileMenuItem.addEventListener("click", function() {
    browser.runtime.sendMessage({
        msg: "getCacheForUrl",
        url: tab.url
    }).then(showQR)
      .catch(e => console.error('Error sending getSubFileUrl message:', e));;
})

saveMenuItem.addEventListener("click", function() {
    browser.runtime.sendMessage({
        msg: "save",
        url: tab.url
    }).catch(e => console.error('Error sending save message:', e));
})



/////////////  SHOW QR  /////////////

function showQR(cacheObj) {
    console.debug('showQR() called - NOT IMPLEMENTED. CacheObj:', cacheObj);
}


// xxxx

function handleMessage(msg) {
    console.debug('Popup received a message:', msg)
}

browser.runtime.onMessage.addListener(handleMessage);