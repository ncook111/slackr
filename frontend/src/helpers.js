/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}

export const isValueInArray = (dict, value) => {
    for (let i in dict) {
        if (dict[i].toString() === value) { return true }
    }
    
    return false;
}

export const getIndexInArray = (id, array) => {
    for (let i in array) {
        if (id === array[i].id) {
            return i;
        }
    }

    return -1;
}

export const getHighestPriorityChannel = (channels) => {

    // Prioritise private channel
    for (let value of channels.values()) {
        if (value.private && value.userIsMember) {
            return value;
        }
    }

    // Else choose public channel user is a member of
    for (let value of channels.values()) {
        if (!value.private && value.userIsMember) {
            return value;
        }
    }

    // Else choose first public channel
    for (let value of channels.values()) {
        if (!value.private) {
            return value;
        }
    }
}

// Get all private channels user is a member of
export const getPrivateChannels = (channels) => {
    const privateChannels = new Map();

    for (let key of channels.keys()) {
        if (channels.get(key).private && channels.get(key).userIsMember) {
            privateChannels.set(key, channels.get(key));
        }
    }

    return privateChannels;
}

// Get all public channels
export const getPublicChannels = (channels) => {
    const publicChannels = new Map();

    for (let key of channels.keys()) {
        if (!channels.get(key).private) {
            publicChannels.set(key, channels.get(key));
        }
    }

    return publicChannels;
}

// https://www.javascripttutorial.net/dom/manipulating/remove-all-child-nodes/
export const removeChildrenNodes = (parent) => {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }
}

export const getToken = () => {
    return document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="))
    ?.split("=")[1];
}

export const getUserId = () => {
    return document.cookie
    .split("; ")
    .find((row) => row.startsWith("user_id="))
    ?.split("=")[1];
}

export const createDynamicProfilePic = (name) => {
    const colours = ["#00aeef", "#F5C2FC", "#FCD8C2", "#C9FCC2", "#c66e6e", "#c6966e", "#6ec6ba"];

    // Pick colour based off first letter of name
    const colour = colours[name.charCodeAt(0) % colours.length];

    const wrapper = document.createElement("svg");

    const profile = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    profile.setAttribute('viewBox', '0 0 40 40');

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("id", "profile");
    circle.setAttribute("cx", 20);
    circle.setAttribute("cy", 20);
    circle.setAttribute("r", 20);
    circle.setAttribute("fill", `${colour}`);
    circle.setAttribute("stroke","none");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "50%");
    text.setAttribute("y", "57.5%");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", "30px");
    text.appendChild(document.createTextNode(name[0]));

    profile.appendChild(circle);
    profile.appendChild(text);

    wrapper.appendChild(profile);

    return wrapper;
}

export const timestampToDateTime = (timestamp) => {
    const date = new Date(Date.parse(timestamp) + 60 * 60 * 1000);

    const dt = {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString(),
        day: date.getDate().toString(),
        hour: date.getHours().toString(),
        minute: date.getMinutes().toString(),
        second: date.getSeconds().toString(),
        period: null
    };

    if (dt.hour === 0) {
        dt.hour = "12";
        dt.period = "AM";
    } else if (dt.hour > 12) {
        dt.hour = (dt.hour - 12).toString();
        dt.period = "PM";
    } else if (dt.hour < 10) {
        dt.period = "AM";
    }

    if (dt.minute.length === 1)
        dt.minute = "0" + dt.minute;

    return dt;
}

export const elementDisplayToggle = (element, firstDisplay, secondDisplay) => {
    if (element.classList.contains(firstDisplay)) {
        element.classList.remove(firstDisplay);
        element.classList.add(secondDisplay);
    } else {
        element.classList.remove(secondDisplay);
        element.classList.add(firstDisplay);
    }
}

export const elementsDisplayClose = (elements, currentDisplay) => {
    elements.forEach((element) => {
        if (element.classList.contains(currentDisplay)) {
            element.classList.remove(currentDisplay);
            element.classList.add("display-none");
        }
    })
}

// Finds and returns the next or previous image in the given messages array
export const getImage = (messages, messageId, next) => {

    let offset;
    if (next)
        offset = 1;
    else
        offset = -1;

    let i;
    for (i = 0; i < messages.length; i++) {
        if (messages[i].id == messageId) {
            i = mod((i + offset), messages.length);
            break;
        }
    }

    while (!messages[i].image) {
        i = mod((i + offset), messages.length);
    }

    return [messages[i].image, messages[i].id];
}

// Provides mod over negative numbers aswell as positive
// https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
const mod = (n, m) => {
    return ((n % m) + m) % m;
}

export const compareMessages = (firstMessages, secondMessages) => {

    const firstKeys = firstMessages.keys();
    const secondKeys = secondMessages.keys();

    for (let key of firstKeys) {
        if (!firstMessages.get(key)[0] || !secondMessages.get(key)[0]) continue;
        if (firstMessages.get(key)[0].id > secondMessages.get(key)[0].id) {
            console.log(firstMessages.get(key)[0]);
            console.log(secondMessages.get(key)[0]);
            return true;
        }
            
    }

    return false;
}