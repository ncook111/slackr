import { errorPopup } from './helpers.js';

/*
===============================
======= Auth endpoints ========
===============================
*/

export const login = (email, password) => {
    let success = apiCall("POST", "auth/login", { email: email, password: password })
    .then((response) => { return response });

    return success;
}

export const logout = (token) => {
    let success = apiCall("POST", "auth/logout", {}, token)
    .then((response) => { return response });

    return success;
}

export const register = (email, password, name) => {
    let success = apiCall("POST", "auth/register", { email: email, password: password, name: name })
    .then((response) => { return response });

    return success;
}

/*
===============================
===== Channel endpoints =======
===============================
*/

export const getChannels = (token) => {
    let success = apiCall("GET", "channel", undefined, token)
    .then((response) => {return response});
    return success;
}

export const createChannel = (token, name, isPrivate, description) => {
    if (description === "") {
        description = "A Slackr Channel";
    }

    let success = apiCall("POST", "channel", { name: name, private: isPrivate, description: description }, token)
    .then((response) => {return response});
    return success;
}

export const getChannel = (token, channelId) => {
    let success = apiCall("GET", `channel/${channelId}`, undefined, token)
    .then((response) => {return response});
    return success;
}

export const updateChannel = (token, channelId, name, description) => {
    let success = apiCall("PUT", `channel/${channelId}`, { name: name, description: description }, token)
    .then((response) => {return response});
    return success;
}

export const joinChannel = (token, channelId) => {
    let success = apiCall("POST", `channel/${channelId}/join`, {}, token)
    .then((response) => {return response});
    return success;
}

export const leaveChannel = (token, channelId) => {
    let success = apiCall("POST", `channel/${channelId}/leave`, {}, token)
    .then((response) => {return response});
    return success;
}

export const inviteChannel = (token, channelId, userId) => {
    let success = apiCall("POST", `channel/${channelId}/invite`, {userId: userId}, token)
    .then((response) => {return response});
    return success;
}

/*
===============================
======= User endpoints ========
===============================
*/

export const getUsers = (token) => {
    let success = apiCall("GET", "user", undefined, token)
    .then((response) => {return response});
    
    return success;
}

export const updateProfile = (token, email, password, name, bio, image) => {
    let success = apiCall("PUT", "user", { 
        token: token, 
        email: email, 
        password: password, 
        name: name, 
        bio: bio, 
        image: image
    }, token)
    .then((response) => {return response});

    return success;
}

export const getUserDetails = (token, userId) => {
    let success = apiCall("GET", `user/${userId}`, undefined, token)
    .then((response) => {return response});

    return success;
}

/*
===============================
===== Message endpoints =======
===============================
*/

export const getMessages = (token, channelId, start) => {
    let success = apiCall("GET", `message/${channelId}?start=${start}`, undefined, token)
    .then((response) => {return response});

    return success;
}

export const sendMessage = (token, channelId, message) => {
    let success = apiCall("POST", `message/${channelId}`, message, token)
    .then((response) => {return response});

    return success;
}

export const updateMessage = (token, channelId, messageId, message, image) => {
    let success = apiCall("PUT", `message/${channelId}/${messageId}`, message, token)
    .then((response) => {return response});

    return success;
}

export const deleteMessage = (token, channelId, messageId) => {
    let success = apiCall("DELETE", `message/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response});

    return success;
}

export const pinMessage = (token, channelId, messageId) => {
    let success = apiCall("POST", `message/pin/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response});

    return success;
}

export const unpinMessage = (token, channelId, messageId) => {
    let success = apiCall("POST", `message/unpin/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response});

    return success;
}

export const reactMessage = (token, channelId, messageId, react) => {
    let success = apiCall("POST", `message/react/${channelId}/${messageId}`, { react: react }, token)
    .then((response) => {return response});
    
    return success;
}

export const unreactMessage = (token, channelId, messageId, react) => {
    let success = apiCall("POST", `message/unreact/${channelId}/${messageId}`, { react: react }, token)
    .then((response) => {return response});

    return success;
}

export const apiCall = (method, path, body, token) => {
    let header;

    if (token !== undefined) {
        header = {
            'Access-Control-Allow-Origin': '*',
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
                    errorPopup(data.error)
                    return false;
                } else {
                    return data;
                }
            })
            .catch((error) => {
                if (error.message === "Failed to fetch")
                    errorPopup("Network Error");
                else
                    errorPopup(error.message);
                return false;
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
                    errorPopup(data.error)
                    return false;
                } else {
                    return data;
                }
            })
            .catch((error) => {
                if (error.message === "Failed to fetch")
                    errorPopup("Network Error");
                else
                    errorPopup(error.message);
                return false;
            });
    }

    return success;
};
