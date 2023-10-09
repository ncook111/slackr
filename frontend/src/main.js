import { BACKEND_PORT } from './config.js';
import { fileToDataUrl, apiCall, isValueInDict, removeChildrenNodes } from './helpers.js';

// HTML elements
const loginSection = document.getElementById("login");
const registerSection = document.getElementById("register");
const mainSection = document.getElementById("main-section");
const sideBarSection = document.getElementById("sidebar");
const createChannelPopupSection = document.getElementById("create-channel-popup");
const loginSubmitButton = document.getElementById("login-submit");
const registerSubmitButton = document.getElementById("register-submit");
const createAccountButton = document.getElementById("create-account");
const createChannelButton = document.getElementById("create-channel-button");
const createChannelConfirmButton = document.getElementById("create-channel-confirm-button");
const createChannelCancelButton = document.getElementById("create-channel-cancel-button");
const logoutButton = document.getElementById("logout");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const createChannelForm = document.getElementById("create-channel-form")

const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const registerEmailInput = document.getElementById("register-email");
const registerNameInput = document.getElementById("register-name");
const registerPasswordInput = document.getElementById("register-password");
const registerPasswordConfirmInput = document.getElementById("register-password-confirm");

const privateChannelsList = document.getElementById("private-channels-list");
const publicChannelsList = document.getElementById("public-channels-list");

// Default page rendering
loginSection.style.display = "block";
registerSection.style.display = "none";
mainSection.style.display = "none"

// Channel data
const publicChannels = [];
const privateChannels = [];

loginSubmitButton.addEventListener('click', () => {
    if (loginEmailInput.value.length < 1) { 
        alert("Please enter your email")
    } else if (loginPasswordInput.value.length < 1) { 
        alert("Please enter your password")
    } else {
        login(loginEmailInput.value, loginPasswordInput.value);
    }
})

logoutButton.addEventListener('click', () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/document/cookie#example_2_get_a_sample_cookie_named_test2
    logout(getToken());
})

registerSubmitButton.addEventListener('click', () => {
    if (registerEmailInput.value.length < 1) { 
        alert("Please enter your email")
    } else if (registerNameInput.value.length < 1) { 
        alert("Please enter your name")
    } else if (registerPasswordInput.value.length < 1) { 
        alert("Please enter a password")
    } else if (registerPasswordConfirmInput.value.length < 1) { 
        alert("Please confirm your password")
    } else if (registerPasswordInput.value !== registerPasswordConfirmInput.value) {
        alert("Passwords do not match!")
    } else {
        register(registerEmailInput.value, registerPasswordInput.value, registerNameInput.value); 
    }
})

createAccountButton.addEventListener('click', () => {
    loginSection.style.display = "none";
    registerSection.style.display = "block";
})

createChannelButton.addEventListener('click', () => {
    createChannelPopupSection.style.display = "block";
})

createChannelConfirmButton.addEventListener('click', () => {
    createChannelPopupSection.style.display = "block";
})

createChannelCancelButton.addEventListener('click', () => {
    createChannelPopupSection.style.display = "none";
    createChannelForm.reset();

})

const getToken = () => {
    return document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="))
    ?.split("=")[1];
}

const getUserId = () => {
    return document.cookie
    .split("; ")
    .find((row) => row.startsWith("user_id="))
    ?.split("=")[1];
}

const loadMainSection = () => {
    loadSidebarSection();
    loadChannelViewSection();

    loginSection.style.display = "none";
    registerSection.style.display = "none";
    mainSection.style.display = "flex"
    createChannelPopupSection.style.display = "none"
}

const loadSidebarSection = () => {
    getChannels(getToken())
    .then((data) => {
        if (data !== false) {
            publicChannels.length = 0;
            privateChannels.length = 0;
            data.channels.forEach((channel) => {
                if (channel.private && isValueInDict(channel.members, getUserId())) {
                    privateChannels.push(channel);
                } else {
                    publicChannels.push(channel)
                }
            })
        }

        removeChildrenNodes(privateChannelsList);
        removeChildrenNodes(publicChannelsList);
        generateChannelButtons(privateChannels, true);
        generateChannelButtons(publicChannels, false); 
    });
}

const loadChannelViewSection = () => {
}

const generateChannelButtons = (channels, isPrivate) => {
    channels.forEach((channel) => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        const buttonName = document.createTextNode(`${channel.name}`);

        button.appendChild(buttonName);
        li.appendChild(button);
        if (isPrivate) {
            privateChannelsList.appendChild(li);
        } else {
            publicChannelsList.appendChild(li);
        }
        
    });
}

/*
===============================
======= Auth endpoints ========
===============================
*/

const login = (email, password) => {
    let success = apiCall("POST", "auth/login", { email: email, password: password })
    .then((response) => { return response })
    .then((success) => {
        if (success) {
            document.cookie = `access_token=${success.token}`;
            document.cookie = `user_id=${success.userId}`;
            loginForm.reset();
            registerForm.reset();
            loadMainSection();
        }
    });
}

const logout = (token) => {
    let success = apiCall("POST", "auth/logout", {}, token)
    .then((response) => { return response })
    .then((success) => {
        if (success) {
            loginSection.style.display = "block";
            registerSection.style.display = "none";
            mainSection.style.display = "none";

            // Remove user cookie
            document.cookie = '';
        }
    });
}

const register = (email, password, name) => {
    let success = apiCall("POST", "auth/register", { email: email, password: password, name: name })
    .then((response) => { return response })
    .then((success) => {
        if (success) {
            document.cookie = `access_token=${success.token}`;
            document.cookie = `user_id=${success.userId}`;
            loginForm.reset();
            registerForm.reset();
            loadMainSection();
        }
    });
}

/*
===============================
===== Channel endpoints =======
===============================
*/

const getChannels = (token) => {
    let success = apiCall("GET", "channel", undefined, token)
    .then((response) => {return response});
    return success;
}

const createChannel = (token, name, isPrivate, description) => {
    let success = apiCall("POST", "channel", { name: name, private: isPrivate, description: description }, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const getChannel = (token, channelId) => {
    let success = apiCall("GET", `channel/${channelId}`, undefined)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const updateChannel = (token, channelId, name, description) => {
    let success = apiCall("PUT", `channel/${channelId}`, { name: name, description: description }, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const joinChannel = (token, channelId) => {
    let success = apiCall("POST", `channel/${channelId}/join`, {}, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const leaveChannel = (token, channelId) => {
    let success = apiCall("POST", `channel/${channelId}/join`, {}, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const inviteChannel = (token, channelId, userId) => {
    let success = apiCall("POST", `channel/${channelId}/join`, {userId: userId}, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

/*
===============================
======= User endpoints ========
===============================
*/

const getUsers = (token) => {
    let success = apiCall("GET", "user", undefined)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const updateProfile = (token, email, password, name, bio, image) => {
    let success = apiCall("PUT", "user", { 
        token: token, 
        email: email, 
        password: password, 
        name: name, 
        bio: bio, 
        image: image
    }, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const getUserDetails = (token, userId) => {
    let success = apiCall("GET", `user/${userId}`, undefined, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

/*
===============================
===== Message endpoints =======
===============================
*/

const getMessages = (token, channelId, start) => {
    let success = apiCall("GET", `message/${channelId}?${start}`, undefined, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const sendMessage = (token, channelId) => {
    let success = apiCall("POST", `message/${channelId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const updateMessage = (token, channelId, messageId, message, image) => {
    let success = apiCall("PUT", `message/${channelId}/${messageId}`, { message: message, image: image }, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const deleteMessage = (token, channelId, messageId) => {
    let success = apiCall("DELETE", `message/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const pinMessage = (token, channelId, messageId) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const unpinMessage = (token, channelId, messageId) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const reactMessage = (token, channelId, messageId, react) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, { react: react }, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}

const unreactMessage = (token, channelId, messageId, react) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, { react: react }, token)
    .then((response) => {return response})
    .then((success) => {
        console.log(success);
    });
}