let scroll_timeout = 4500;
let universal_timeout;

// let tile_wrapper_query;
let tile_query;
let blacklisted_queries = [];

/// Check Site ///
if (document.location.host.includes("reddit")) {
    tile_query = "._1oQyIsiPHYt6nx7VOmd1sz"
    blacklisted_queries = []
}
else if (document.location.host.includes("instagram")) {
    tile_query = "._ab6k._ab6m._aggc._aatb._aatc._aate._aatf._aati"
    blacklisted_queries = []
}
else if (document.location.host.includes("twitter")) {
    tile_query=".css-1dbjc4n.r-1loqt21.r-18u37iz.r-1ny4l3l.r-1udh08x.r-1qhn6m8.r-i023vh.r-o7ynqc.r-6416eg"
    blacklisted_queries = []
}

/// others ///
let toast_timeout = null;
let toast_el;
function toast(txt) {  // toast to notify extension actions to user

    if (toast_timeout != null) { //if toast is already active
        clearTimeout(toast_timeout);
        toast_el.innerText = txt;
    }
    else { //if toast has not been made
        toast_el = document.createElement("div");
        toast_el.innerText = txt;

        toast_el.style.color = "white";
        toast_el.style.padding = "1rem";
        toast_el.style.backgroundColor = "rgba(0,0,0,0.8)";
        toast_el.style.position = "fixed";
        toast_el.style.bottom = "1.5rem";
        toast_el.style.right = "50%";
        toast_el.style.transform = "translate(50%,0)";
        toast_el.style.boxShadow = "rgba(0, 0, 0, 0.4) 0px 5px 15px";
        toast_el.style.zIndex = "999";

        document.body.prepend(toast_el);
    }

    toast_timeout = setTimeout(() => {
        toast_el.remove();
        toast_timeout = null;
    }, 1500);
}

/// popup communication ///
chrome.storage.sync.get(['scroll_timeout'], function (result) {
    if (result.scroll_timeout == undefined)
        chrome.storage.sync.set({ scroll_timeout });
    else
        scroll_timeout = result.scroll_timeout;

});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { //used to communicate with popup

    if ("status" in request)
        sendResponse({ "active": scroll_active });
    else if ("cmd" in request)
        execute(request.cmd)
    else if ("values_changed" in request);

    return true;
});


/// debugging ///
let de_mode = false
function de_print(txt, override_index = null) {
    if (de_mode)
        console.log((override_index == null ? current_index : override_index), txt);
}

console.log("Scroll Master Script Loaded! debug mode on?", de_mode);

/// Control Functions ///
let scroll_active = false
function execute(cmd) {
    if (cmd == 'next') {
        kill_sleep()
        toast("Next");
    }
    else if (cmd == 'prev') {
        scroll_to_element = previous()
        kill_sleep()
        toast("Previous");
    }
    else if (cmd == 'toggle_pause') {
        scroll_active = !scroll_active
        toast(scroll_active ? "Started Scroll" : "Paused Scroll");

        if (scroll_active)
            start_scrolling()
        else
            kill_sleep()
    }

}

function previous() {
    if (!scroll_to_element)
        return document.querySelector(tile_query)

    let tiles = [...document.querySelectorAll(tile_query)]
    let next_index = tiles.indexOf(scroll_to_element)

    if (next_index == -1)
        return scroll_to_element;
    if (next_index - 2 < 0) {
        if (next_index - 1 >= 0)
            return tiles[next_index - 1];

        return scroll_to_element;
    }

    next_index -= 2

    return tiles[next_index];
}

function next() {
    if (!scroll_to_element)
        return document.querySelector(tile_query)

    let tiles = [...document.querySelectorAll(tile_query)]
    let next_index = tiles.indexOf(scroll_to_element)

    if (next_index == -1)
        return scroll_to_element;
    else if (next_index + 1 >= tiles.length)
        return scroll_to_element;

    next_index += 1

    return tiles[next_index];
}

/// Helper function ///
let sleeper;
function kill_sleep() {
    if (sleeper)
        sleeper();
}
function sleep(time) {
    return new Promise(r => {
        sleeper = () => {
            r();
            clearTimeout(timer);
        }
        timer = setTimeout(r, time);
    });
}
function AsyncEvent(item, event) {
    return new Promise((resolve) => {
        sleeper = () => {
            item.removeEventListener(event, sleeper);
            resolve();
        }
        item.addEventListener(event, sleeper);
    })
}

function querySelectorAllShadows(selector, el = document.body) { // because reddit uses shadow dom for it's video players
    // recurse on childShadows
    const childShadows = Array.from(el.querySelectorAll('*')).
        map(el => el.shadowRoot).filter(Boolean);

    // console.log('[querySelectorAllShadows]', selector, el, `(${childShadows.length} shadowRoots)`);

    const childResults = childShadows.map(child => querySelectorAllShadows(selector, child));

    // fuse all results into singular, flat array
    const result = Array.from(el.querySelectorAll(selector));
    return result.concat(childResults).flat();
}

/// Main ///
function is_blacklisted(item) {

    console.log(scroll_to_element)
    if (!item) {
        console.log("!item")
        return true
    }

    let is_blacklisted = false

    blacklisted_queries.every(function (element, index) {
        if (item.matches(element)) {
            is_blacklisted = true
            return false
        }
        else return true;
    });

    return is_blacklisted
}

let scroll_to_element

const start_scrolling = async () => {

    // Main Loop //
    while (scroll_active) {
        try {
            /// skip if query is blacklisted
            if (is_blacklisted(scroll_to_element))
                scroll_to_element = next()
            else {
                scroll_to_element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

                let video = querySelectorAllShadows("video", scroll_to_element)
                scroll_to_element = next()

                if (video.length) {
                    video=video[0]
                    video.play()
                    if(video.paused)
                        await sleep(scroll_timeout);
                    else
                        await AsyncEvent(video, "ended")
                }
                else 
                    await sleep(scroll_timeout);
            }

        } catch (err) {
            console.log(err)
            await sleep(1000)
        }
    }

    console.log("Stopped scrolling")
}

document.addEventListener("keydown", (event) => {
    if (event.key == "]" || event.key == "}")
        execute("next")
    else if (event.key == "[" || event.key == "{")
        execute("prev")
    else if (event.key == "p")
        execute("toggle_pause")
});