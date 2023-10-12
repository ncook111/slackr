import { BACKEND_PORT } from './config.js';
import { fileToDataUrl, apiCall, isValueInArray, removeChildrenNodes, getToken, getUserId, getIndexInArray, getHighestPriorityChannel, getPrivateChannels, getPublicChannels, createDynamicProfilePic, timestampToDateTime } from './helpers.js';

// HTML elements
const loginSection = document.getElementById("login");
const registerSection = document.getElementById("register");
const landingSection = document.getElementById("landing-section")
const mainSection = document.getElementById("main-section");
const sideBarSection = document.getElementById("sidebar");
const createChannelPopupSection = document.getElementById("create-channel-popup");
const loginSubmitButton = document.getElementById("login-submit");
const registerSubmitButton = document.getElementById("register-submit");
const registerGoBackButton = document.getElementById("register-go-back");
const createAccountButton = document.getElementById("create-account");
const createChannelButton = document.getElementById("create-channel-button");
const createChannelConfirmButton = document.getElementById("create-channel-confirm-button");
const createChannelCancelButton = document.getElementById("create-channel-cancel-button");
const logoutButton = document.getElementById("logout");
const channelSettingsSaveButton = document.getElementById("channel-settings-save");
const channelSettingsCloseButton = document.getElementById("channel-settings-close");

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
landingSection.style.display = "block"
registerSection.style.display = "none";
mainSection.style.display = "none"

// Data
const channels = new Map();
const messages = new Map();
const allUsers = new Map();
const userDetails = new Map();
let currentChannel = null;

const populateChannelsMap = () => {
    const response = getChannels(getToken())
    .then((data) => {
        if (data !== false) {
            channels.clear();
            userDetails.clear();
            //messages.clear();
            data.channels.forEach((channel) => {
                if (isValueInArray(channel.members, getUserId())) {
                    channel["userIsMember"] = true;

                    // Populate userDetails with userid's of 
                    // channels current user is a member of
                    channel.members.forEach((user) => {
                        userDetails.set(user, []);
                    });
                } else {
                    channel["userIsMember"] = false;
                }
                channels.set(channel.id, channel);
            }); 
        }

        // TODO: Will error if no channels exist serverside
        if (currentChannel == null) {
            currentChannel = getHighestPriorityChannel(channels);
        } else {
            currentChannel = channels.get(currentChannel.id); // Update currentChannel info
        }

        // Remove server buttons and regenerate list
        removeChildrenNodes(privateChannelsList);
        removeChildrenNodes(publicChannelsList);
        generateChannelButtons(getPrivateChannels(channels), true);
        generateChannelButtons(getPublicChannels(channels), false); 
    });

    return response;
}

const populateMessagesMap = () => {
    channels.forEach((channel) => {
        if (isValueInArray(channel.members, getUserId())) {

            // TODO: Block continuation until for loop finished?? How??
            getMessages(getToken(), channel.id, 0)
            .then((response) => {
                messages.set(channel.id, response.messages);
            });
        } else {

            // Remove messages if now not a channel member
            if (messages.has(channel.id)) {
                messages.set(channel.id, []);
            }
        }
    }); 
}

const populateUsersMap = () => {
    const response = getUsers(getToken())
    .then((users) => { 
        users.users.forEach((user) => {
            allUsers.set(user.id, user);
        })
    }).then(() => {
        userDetails.keys().forEach((user) => {
            getUserDetails(getToken(), user)
            .then((details) => {
                userDetails.set(user, details);
            });
        });
    });
}

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
});

registerGoBackButton.addEventListener('click', () => {
    loginSection.style.display = "block";
    registerSection.style.display = "none";
    registerForm.reset();
})

createAccountButton.addEventListener('click', () => {
    loginSection.style.display = "none";
    registerSection.style.display = "block";
})

createChannelButton.addEventListener('click', () => {
    createChannelPopupSection.style.display = "block";
})

createChannelConfirmButton.addEventListener('click', () => {
    const channelName = document.getElementById("form-channel-name").value;
    const channelDescription = document.getElementById("form-channel-description").value;
    const isPrivate = document.getElementById("isPrivate").checked;
    if (channelName.length >= 1) {
        createChannel(getToken(), channelName, isPrivate, channelDescription)
        .then(() => { loadSidebarSection(); });
        createChannelPopupSection.style.display = "none";
        createChannelForm.reset();
    } else {
        alert("Please enter a channel name");
    }
});

createChannelCancelButton.addEventListener('click', () => {
    createChannelPopupSection.style.display = "none";
    createChannelForm.reset();
});

const loadMainSection = () => {

    // Sidebar
    populateChannelsMap()
    .then(() => {
        populateChannelsMap();
    }).then(() => {
        populateMessagesMap();
    }).then(() => {
        populateUsersMap();
    
    // Channel Section
    }).then(() => {
        loadChannelHeader();
    }).then(() => {
        setTimeout(loadChannelMessages, 1000);
    })

    landingSection.style.display = "none";
    mainSection.style.display = "flex"
    createChannelPopupSection.style.display = "none"
}

const loadSidebarSection = () => {
    populateChannelsMap()
    .then(() => {
        populateChannelsMap();
    }).then(() => {
        populateMessagesMap();
    }).then(() => {
        populateUsersMap();
    });
}

const loadChannelViewSection = () => {
    loadChannelHeader()
    .then(() => {
        loadChannelMessages();
    });
}

const loadChannelHeader = () => {

    // Remove old buttons if they still exist
    if (document.getElementById("leave-channel")) {
        document.getElementById("leave-channel").remove();   
    }
    
    if (document.getElementById("join-channel")) {
        document.getElementById("join-channel").remove();
    }
    
    if (document.getElementById("channel-settings")) {
        document.getElementById("channel-settings").remove();
    }

    
    if (currentChannel.userIsMember) {
        loadMemberChannelHeader();
    } else {
        loadNonMemberChannelHeader();
    } 
}

const loadMemberChannelHeader = () => {
    const channelHeader = document.getElementById("channel-header");
    const channelName = document.getElementById("channel-name");
    const channelDescription = document.getElementById("channel-description");
    const channelCreationTime = document.getElementById("channel-creation-time");
    const channelCreator = document.getElementById("channel-creator");
    const channelSettingsButton = document.getElementById("channel-settings");

    getChannel(getToken(), currentChannel.id)
    .then((response) => {
        channelName.textContent = response.name;
        channelDescription.textContent = response.description;
        channelCreationTime.textContent = response.createdAt.split("T")[0];
        channelCreator.textContent = response.creator;

        // Create channel settings button
        const channelSettingsButton = document.createElement("button");
        channelSettingsButton.id = "channel-settings";
        channelSettingsButton.append(document.createTextNode("Channel Settings"));
        channelHeader.appendChild(channelSettingsButton);

        channelSettingsButton.addEventListener('click', () => {
            document.getElementById("channel-settings-popup").style.display = "block";
            document.getElementById("edit-channel-name").value = response.name;
            document.getElementById("edit-channel-description").value = response.description;
        });

        // Create leave channel button
        const leaveChannelButton = document.createElement("button");
        leaveChannelButton.id = "leave-channel";
        leaveChannelButton.append(document.createTextNode("Leave Channel"));
        channelHeader.appendChild(leaveChannelButton);

        leaveChannelButton.addEventListener('click', () => {
            leaveChannel(getToken(), currentChannel.id)
            .then((response) => { 
                document.getElementById("leave-channel").remove();
                loadMainSection();
            });
        })
    
        leaveChannelButton.style.display = "block";
    });
}

const loadNonMemberChannelHeader = () => {
    const channelHeader = document.getElementById("channel-header");
    const channelName = document.getElementById("channel-name");
    const channelDescription = document.getElementById("channel-description");
    const channelCreationTime = document.getElementById("channel-creation-time");
    const channelCreator = document.getElementById("channel-creator");

    channelName.textContent = currentChannel.name;
    channelDescription.textContent = "";
    channelCreationTime.textContent = "";
    channelCreator.textContent = "";

    // Create join channel button
    const joinChannelButton = document.createElement("button");
    joinChannelButton.id = "join-channel";
    joinChannelButton.append(document.createTextNode("Join Channel"))
    channelHeader.appendChild(joinChannelButton);

    joinChannelButton.addEventListener('click', () => {
        joinChannel(getToken(), currentChannel.id)
        .then((response) => {
            document.getElementById("join-channel").remove();
            loadMainSection();
        });
    })

    joinChannelButton.style.display = "block"; 
}


const generateChannelButtons = (chans, isPrivate) => {
    let i = 0;
    chans.forEach((channel, id, map) => {
        const li = document.createElement("li");
        li.id = "channel-list-element"
        const button = document.createElement("button");
        button.classList.add("channel-button");
        button.id = id;
        const buttonName = document.createTextNode(`${channel.name}`);

        button.addEventListener('click', () => {
            currentChannel = channels.get(channel.id);
            loadMainSection();
        })
        
        button.appendChild(buttonName);
        li.appendChild(button);

        // Add hr inbetween buttons
        const liHr = document.createElement("li");
        liHr.id = "li-channel-button-divider"
        const hr = document.createElement("hr");
        hr.id = "channel-button-divider"
        liHr.appendChild(hr);

        if (isPrivate) {
            privateChannelsList.appendChild(li);
            if (i < map.size - 1) privateChannelsList.appendChild(liHr);
        } else {
            publicChannelsList.appendChild(li);
            if (i < map.size - 1)  publicChannelsList.appendChild(liHr);
        }
        
        // Colour if currently selected channel
        if (currentChannel !== null && currentChannel.id === channel.id) {
            button.style.backgroundColor = "lightgrey";
        }

        i++;
    });
}

channelSettingsCloseButton.addEventListener('click', () => {
    document.getElementById("channel-settings-popup").style.display = "none";
    document.getElementById("channel-settings-form").reset();
})

channelSettingsSaveButton.addEventListener('click', () => {
    const newName = document.getElementById("edit-channel-name").value;
    const newDescription = document.getElementById("edit-channel-description").value;
    if (newName.length >= 1) {
        updateChannel(getToken(), currentChannel.id, newName, newDescription)
        .then((response) => {
            document.getElementById("channel-settings-popup").style.display = "none";
            document.getElementById("channel-settings-form").reset();
            loadMainSection();
        });
    } else {
        alert("Please enter a channel name");
    }
});

const loadChannelMessages = () => {
    const ul = document.getElementById("message-list");
    while (ul.firstChild) {
        ul.firstChild.remove()
    }

    // TODO: Figure out why I cant clear messages
    if (messages.has(currentChannel.id) && currentChannel.userIsMember) {
        messages.get(currentChannel.id).forEach((message) => {
            const sender = userDetails.get(message.sender).name;
            const li = document.createElement("li");
            li.id = "message-box";

            const profile = createDynamicProfilePic(sender)
            profile.id = "message-profile";
            li.appendChild(profile);

            const messageElem = document.createElement("div");
            messageElem.id = "message-message";

            const messageHeader = document.createElement("div");
            messageHeader.id = "message-header";

            const messageSender = document.createElement("h1");
            messageSender.id = "message-sender";
            messageSender.appendChild(document.createTextNode(sender));
            messageHeader.appendChild(messageSender);

            const messageTimeSent = document.createElement("h1");
            messageTimeSent.id = "message-time-sent";
            const dt = timestampToDateTime(message.sentAt);

            const formattedSentAt = `${dt.day}/${dt.month}, ${dt.hour}:${dt.minute} ${dt.period}`
            messageTimeSent.appendChild(document.createTextNode(formattedSentAt));
            messageHeader.appendChild(messageTimeSent);
            
            if (message.edited) {
                const messageEdited = document.createElement("h1");
                messageEdited.id = "message-edited";
                messageEdited.appendChild(document.createTextNode(`(Edited)`));
                messageHeader.appendChild(messageEdited);
            }

            const messageBody = document.createElement("p");
            messageBody.id = "message-body";
            messageBody.appendChild(document.createTextNode(`${message.message}`));
            
            const messageReactBox = loadMessageReacts(message.reacts);
            messageBody.appendChild(messageReactBox);

            messageElem.appendChild(messageHeader);
            messageElem.appendChild(messageBody);
            li.appendChild(messageElem);
            ul.appendChild(li);    
        });
    }

}

const loadMessageReacts = (reactions) => {
    const reacts = new Map();
    
    reactions.forEach((reaction) => {
        if (reacts.has(reaction.react)) {
            const reactObj = reacts.get(reaction);
            reactObj.count++;
            reactObj.users.push(react.user);
            reacts.set(reaction.react, reactObj);
        } else {
            const reactObj = {
                react: reaction,
                count: 1,
                users: [reaction.user]
            }
        }
    });

    const messageReactBox = document.createElement("div");
    messageReactBox.id = "message-react-box";

    reacts.forEach((react) => {
        const messageReact = document.createElement("div");
        messageReact.id = "message-react-box";

        const reaction = document.createElement("div");
        reaction.id = "react";
        reaction.appendChild(document.createTextNode(react.react));

        const reactionCount = document.createElement("div");
        reactionCount.id = "reaction-count"
        reactionCount.appendChild(document.createTextNode(react.count));

        messageReact.appendChild(reaction);
        messageReact.appendChild(reactionCount);
        messageReactionBox.appendChild(messageReact);
    })

    return messageReactBox;
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
            landingSection.style.display = "block"
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
    if (description === "") {
        description = "A Slackr Channel";
    }

    let success = apiCall("POST", "channel", { name: name, private: isPrivate, description: description }, token)
    .then((response) => {return response});
    return success;
}

const getChannel = (token, channelId) => {
    let success = apiCall("GET", `channel/${channelId}`, undefined, token)
    .then((response) => {return response});
    return success;
}

const updateChannel = (token, channelId, name, description) => {
    let success = apiCall("PUT", `channel/${channelId}`, { name: name, description: description }, token)
    .then((response) => {return response});
    return success;
}

const joinChannel = (token, channelId) => {
    let success = apiCall("POST", `channel/${channelId}/join`, {}, token)
    .then((response) => {return response});
    return success;
}

const leaveChannel = (token, channelId) => {
    let success = apiCall("POST", `channel/${channelId}/leave`, {}, token)
    .then((response) => {return response});
    return success;
}

const inviteChannel = (token, channelId, userId) => {
    let success = apiCall("POST", `channel/${channelId}/join`, {userId: userId}, token)
    .then((response) => {return response})
    .then((success) => {
    });
}

/*
===============================
======= User endpoints ========
===============================
*/

const getUsers = (token) => {
    let success = apiCall("GET", "user", undefined, token)
    .then((response) => {return response});
    
    return success;
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
    });
}

const getUserDetails = (token, userId) => {
    let success = apiCall("GET", `user/${userId}`, undefined, token)
    .then((response) => {return response});

    return success;
}

/*
===============================
===== Message endpoints =======
===============================
*/

const getMessages = (token, channelId, start) => {
    let success = apiCall("GET", `message/${channelId}?start=${start}`, undefined, token)
    .then((response) => {return response});

    return success;
}

const sendMessage = (token, channelId) => {
    let success = apiCall("POST", `message/${channelId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
    });
}

const updateMessage = (token, channelId, messageId, message, image) => {
    let success = apiCall("PUT", `message/${channelId}/${messageId}`, { message: message, image: image }, token)
    .then((response) => {return response})
    .then((success) => {
    });
}

const deleteMessage = (token, channelId, messageId) => {
    let success = apiCall("DELETE", `message/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
    });
}

const pinMessage = (token, channelId, messageId) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
    });
}

const unpinMessage = (token, channelId, messageId) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, {}, token)
    .then((response) => {return response})
    .then((success) => {
    });
}

const reactMessage = (token, channelId, messageId, react) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, { react: react }, token)
    .then((response) => {return response})
    .then((success) => {
    });
}

const unreactMessage = (token, channelId, messageId, react) => {
    let success = apiCall("POST", `message/${channelId}/${messageId}`, { react: react }, token)
    .then((response) => {return response})
    .then((success) => {
    });
}