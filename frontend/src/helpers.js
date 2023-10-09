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

// https://www.javascripttutorial.net/dom/manipulating/remove-all-child-nodes/
export const removeChildrenNodes = (parent) => {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }
}

export const apiCall = (method, path, body, token) => {
    let header;

    if (token !== undefined) {
        header = {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    } else {
        header = {
            'Content-type': 'application/json',
        }
    }

    let success;

    if (body === undefined) {
        success = fetch('http://localhost:5005/' + path, {
            method: method,
            headers: header,
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    alert(data.error)
                    return false;
                } else {
                    return data;
                }
            });
    } else {
        success = fetch('http://localhost:5005/' + path, {
            method: method,
            headers: header,
            body: JSON.stringify(body)
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.error) {
                    alert(data.error)
                    return false;
                } else {
                    return data;
                }
            });
    }

    return success;
};

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