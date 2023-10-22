import { BACKEND_PORT } from './config.js';
import { fileToDataUrl, isValueInArray, removeChildrenNodes, getToken, 
         getUserId, getIndexInArray, getHighestPriorityChannel, getPrivateChannels, 
         getPublicChannels, createDynamicProfilePic, timestampToDateTime, elementDisplayToggle,
         getImage, elementsDisplayClose } from './helpers.js';
import { login, logout, register, getChannels, createChannel, getChannel, 
         updateChannel, joinChannel, leaveChannel, inviteChannel, getUsers, 
         updateProfile, getUserDetails, getMessages, sendMessage, updateMessage, 
         deleteMessage, pinMessage, unpinMessage, reactMessage, unreactMessage, apiCall } from './api.js';

// HTML elements
const loginSection = document.getElementById("login");
const registerSection = document.getElementById("register");
const landingSection = document.getElementById("landing-section")
const mainSection = document.getElementById("main-section");
const createChannelPopupSection = document.getElementById("create-channel-popup");
const loginSubmitButton = document.getElementById("login-submit");
const registerSubmitButton = document.getElementById("register-submit");
const registerGoBackButton = document.getElementById("register-go-back");
const createAccountButton = document.getElementById("create-account");
const createChannelButton = document.getElementById("create-channel-button");
const createChannelConfirmButton = document.getElementById("create-channel-confirm-button");
const createChannelCancelButton = document.getElementById("create-channel-cancel-button");
const logoutButton = document.getElementById("logout");
const messageSendButton = document.getElementById("message-send");
const channelSettingsSaveButton = document.getElementById("channel-settings-save");
const channelSettingsCloseButton = document.getElementById("channel-settings-close");
const userProfileButton = document.getElementById("user-profile-button");

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
let currentUser = null;
let currentChannel = null;

/*
==================================
===== Populate Map Functions =====
==================================
*/

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

        return true;
    });
    return response;
}

const populateMessagesMap = () => {
    const success = new Promise((resolve) => {

        const promises = [new Promise((resolve) => { resolve(true)})];
        channels.forEach((channel) => {
            if (isValueInArray(channel.members, getUserId())) {
    
                // TODO: Block continuation until for loop finished?? How??
                promises.push(getMessages(getToken(), channel.id, 0)
                .then((response) => {
                    messages.set(channel.id, response.messages);

                    return response;
                }));
            } else {
    
                // Remove messages if now not a channel member
                if (messages.has(channel.id)) {
                    messages.set(channel.id, []);
                }
            }
        });

        resolve(Promise.all(promises));
    });

    return success;
}

const populateAllUsersMap = () => {
    const success = getUsers(getToken())
    .then((users) => { 
        users.users.forEach((user) => {
            allUsers.set(user.id, user);
        });

        return true;
    });

    return success;
}

const populateUserDetailsMap = () => {
    const success =  new Promise((resolve) => {
        const promises = [new Promise((resolve) => { resolve(true)})];
        userDetails.forEach((user, value) => {
            promises.push(getUserDetails(getToken(), value)
            .then((details) => {
                userDetails.set(value, details);

                return details;
            }));
        });

        resolve(Promise.all(promises));
    });

    return success;
}

/*
===========================
===== Event Listeners =====
===========================
*/

loginSubmitButton.addEventListener('click', () => {
    if (loginEmailInput.value.length < 1) { 
        alert("Please enter your email")
    } else if (loginPasswordInput.value.length < 1) { 
        alert("Please enter your password")
    } else {
        login(loginEmailInput.value, loginPasswordInput.value)
        .then((response) => {
            if (response) {
                document.cookie = `access_token=${response.token}`;
                document.cookie = `user_id=${response.userId}`;
                loginForm.reset();
                registerForm.reset();
                generateUserSection();
                loadMainSection();
            }
        });
    }
})

logoutButton.addEventListener('click', () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/document/cookie#example_2_get_a_sample_cookie_named_test2
    logout(getToken())
    .then((response) => {
        if (response) {
            landingSection.style.display = "block"
            registerSection.style.display = "none";
            mainSection.style.display = "none";
    
            // Remove user cookie
            document.cookie = '';
            location.reload();
        }
    });
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
        register(registerEmailInput.value, registerPasswordInput.value, registerNameInput.value)
        .then((response) => {
            if (response) {
                document.cookie = `access_token=${response.token}`;
                document.cookie = `user_id=${response.userId}`;
                loginForm.reset();
                registerForm.reset();
                loadMainSection();
            }
        }); 
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
        .then((response) => { 

            // Add channel to map without requiring fetch
            const newChannel = {
                id: parseInt(response.channelId),
                name: channelName,
                creator: parseInt(getUserId()),
                private: isPrivate,
                members: [parseInt(getUserId())],
                userIsMember: true
            }

            channels.set(parseInt(response.channelId), newChannel);
            messages.set(parseInt(response.channelId), []);

            currentChannel = newChannel;

            if (isPrivate) {
                removeChildrenNodes(privateChannelsList);
                generateChannelButtons(getPrivateChannels(channels), true);
            } else {
                removeChildrenNodes(publicChannelsList);
                generateChannelButtons(getPublicChannels(channels), false); 
            }

            loadChannelHeader();
        });

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

messageSendButton.addEventListener('click', () => {
    const messageText = document.getElementById("message-text");

    if (messageText.value !== "" &&
        messageText.value.trim() !== "" &&
        !messageText.disabled) {
        sendMessage(getToken(), currentChannel.id, { message: messageText.value, image: "" })
        .then((response) => {
            populateMessagesMap().then(() => {
                loadChannelMessages();
            });
        });
        messageText.value = "";
    } else if (messageImage.value !== "") {
        fileToDataUrl(messageImage.files[0]).then((response) => {
            sendMessage(getToken(), currentChannel.id, { message: "", image: response })
            .then((response) => {
                //TODO: refreshChannelMessagesMap()
                populateMessagesMap().then(() => {
                    loadChannelMessages();
                });
            });
        });
    } else {
        return;
    }
});

const messageImage = document.getElementById("message-image")
messageImage.addEventListener('input', () => {
    const messageText = document.getElementById("message-text");
    messageText.disabled = "true";
});

channelSettingsCloseButton.addEventListener('click', () => {
    document.getElementById("channel-settings-popup").style.display = "none";
    document.getElementById("channel-settings-form").reset();
});

channelSettingsSaveButton.addEventListener('click', () => {
    const newName = document.getElementById("edit-channel-name").value;
    const newDescription = document.getElementById("edit-channel-description").value;
    if (newName.length >= 1) {
        updateChannel(getToken(), currentChannel.id, newName, newDescription)
        .then((response) => {
            document.getElementById("channel-settings-popup").style.display = "none";
            document.getElementById("channel-settings-form").reset();
            // TODO: refreshCurrentChannelButton();
            loadChannelHeader();
        });
    } else {
        alert("Please enter a channel name");
    }
});

userProfileButton.addEventListener('click', () => {
    const userProfile = document.getElementById("user-profile-popup");
    generateProfilePopup(currentUser);
    displayProfileEditElements(userProfile);
    elementDisplayToggle(userProfile, "display-none", "display-block");
});

const channelActions = document.getElementById("channel-actions");
const pinnedMessages = document.getElementById("pinned-messages");
const channelMembers = document.getElementById("channel-members");

const channelActionsButton = document.getElementById("channel-actions-button");
const pinnedMessagesButton = document.getElementById("view-pinned-messages-button");
const channelMembersButton = document.getElementById("view-members-button");

channelActionsButton.addEventListener('click', () => {
    elementDisplayToggle(channelActions, "display-none", "display-block");
    elementsDisplayClose([pinnedMessages, channelMembers], "display-block");
});

pinnedMessagesButton.addEventListener('click', () => {
    elementDisplayToggle(pinnedMessages, "display-none", "display-block");
    elementsDisplayClose([channelActions, channelMembers], "display-block");
});

channelMembersButton.addEventListener('click', () => {
    elementDisplayToggle(channelMembers, "display-none", "display-block");
    elementsDisplayClose([channelActions, pinnedMessages], "display-block");
});

// Create channel leave event listener
const channelLeaveButton = document.getElementById("leave-channel");
channelLeaveButton.addEventListener('click', () => {
    leaveChannel(getToken(), currentChannel.id)
    .then((response) => {
        const channelActions = document.getElementById("channel-actions");
        channelActions.className = "channel-dropdown display-none";

        const headerButtons = document.getElementById("header-buttons");
        headerButtons.className = "channel-dropdown display-none";

        // Remove user from channel without requiring fetch
        const channel = channels.get(currentChannel.id);
        channel.userIsMember = false;
        const index = getIndexInArray(parseInt(getUserId), channel.members);
        channel.members.splice(index, 1);

        if (channel.private) {
            currentChannel = getHighestPriorityChannel(channels);
        } else {
            currentChannel = channel;
        }

        if (channel.private) {
            removeChildrenNodes(privateChannelsList);
            generateChannelButtons(getPrivateChannels(channels), true);
        } else {
            removeChildrenNodes(publicChannelsList);
            generateChannelButtons(getPublicChannels(channels), false); 
        }

        loadChannelHeader().then(() => {
            loadChannelMessages();
        });
    });
});

// Create channel settings event listener
const channelSettingsButton = document.getElementById("channel-settings");
channelSettingsButton.addEventListener('click', () => {
    document.getElementById("channel-settings-popup").style.display = "block";
    document.getElementById("edit-channel-name").value = currentChannel.name;

    // TODO: This kinda dumb way to do it
    const channelDescription = document.getElementById("channel-description").textContent;
    if (channelDescription === undefined)
        document.getElementById("edit-channel-description").value = "";
    else
    document.getElementById("edit-channel-description").value = channelDescription;
});

const changeNameButton = document.getElementById("change-name-button");
changeNameButton.addEventListener('click', () => {
    const nameInput = document.getElementById("change-name");
    const name = document.getElementById("user-name");
    name.classList.toggle("display-none");

    changeNameButton.classList.toggle("display-none");
    console.log(changeNameButton.className);

    const confirmTickButton = document.createElement("button");
    confirmTickButton.textContent = "✔️";
    confirmTickButton.className = "confirm-edit-message";
    console.log(confirmTickButton.className);
    changeNameButton.parentElement.appendChild(confirmTickButton);

    nameInput.value = name.textContent;
    nameInput.classList.toggle("display-none")

    confirmTickButton.addEventListener('click', () => {
        if (name.textContent !== nameInput.value) {
            updateProfile(
                getToken(), 
                "", 
                currentUser.password, 
                nameInput.value, 
                currentUser.bio, 
                currentUser.image
            ).then(() => {
                currentUser.name = nameInput.value;
                name.textContent = nameInput.value;
            });
        }

        name.classList.toggle("display-none");
        confirmTickButton.classList.toggle("display-none")
        changeNameButton.classList.toggle("display-none");
        nameInput.classList.toggle("display-none");
    });
})

const loadMainSection = () => {

    // Sidebar
   const success = populateChannelsMap().then(() => {
        populateMessagesMap().then(() => {
            populateAllUsersMap().then(() => {
                populateUserDetailsMap().then(() => {
                    loadChannelHeader().then(() => {
                        loadChannelMessages();
                    });
                });
            });
        });
    });

    landingSection.style.display = "none";
    mainSection.style.display = "flex"
    createChannelPopupSection.style.display = "none"

    return success;
}

const generateUserSection = () => {
    const container = document.getElementById("user-profile-button");

    const success = getUserDetails(getToken(), getUserId()).then((response) => {
        const profile = createDynamicProfilePic(response.name)
        profile.id = "channel-member-profile";
        container.appendChild(profile);
        const name = document.createElement("span");
        name.textContent = response.name;
        container.appendChild(name);

        currentUser = response;

        return true;
    });

    return success;
}

const loadChannelHeader = () => {

    // Remove old buttons if they still exist
    if (document.getElementById("join-channel")) {
        document.getElementById("join-channel").remove();
    }

    const success = new Promise((resolve => {
        if (currentChannel.userIsMember) {
            resolve(loadMemberChannelHeader());
        } else {
            loadNonMemberChannelHeader();
            resolve(true);
        } 
    }));
    
    return success;
}

const loadMemberChannelHeader = () => {
    const channelName = document.getElementById("channel-name");
    const channelDescription = document.getElementById("channel-description");
    const channelCreationTime = document.getElementById("channel-creation-time");
    const channelCreator = document.getElementById("channel-creator");

    getChannel(getToken(), currentChannel.id)
    .then((response) => {

        if (response.description !== "") {
            channelName.textContent = response.name + " - ";
            channelName.style.display =  "inline-block";
            
            channelDescription.textContent = response.description;
            channelDescription.style.display =  "inline-block";
        } else {
            channelName.textContent = response.name;
            channelDescription.textContent = "";
        }

        // Show header buttons
        const headerButtons = document.getElementById("header-buttons");
        headerButtons.className = "display-flex";

        // Generate channel users drop-down
        generateChannelUsersDropdown();

        generatePinnedMessagesDropdown();

        const dt = timestampToDateTime(response.createdAt);
        channelCreationTime.textContent = `Created On: ${dt.day}/${dt.month}/${dt.year}`;
        channelCreator.textContent = `Created By: ${userDetails.get(response.creator).name}`;
    });
}

const generateChannelUsersDropdown = () => {

    // Remove previous list of users
    // TODO: Needs to be done when navigating away from a channel
    const memberList = document.getElementById("channel-members-list");
    
    while (memberList.firstChild) {
        memberList.lastChild.remove();
    }
    
    currentChannel.members.forEach((member) => {
        const name = userDetails.get(member).name;
        const memberElement = document.createElement("li");
        memberElement.id = "channel-member"
        const button = document.createElement("button");
        button.className = "channel-member-button"

        const profile = createDynamicProfilePic(name)
        profile.id = "channel-member-profile";
        button.textContent = name;
        button.insertBefore(profile, button.firstChild);
        memberElement.appendChild(button);
        memberList.appendChild(memberElement);     
    });
}

const generateProfilePopup = (user) => {
    const profilePicture = createDynamicProfilePic(user.name);
    const headerElement = document.getElementById("user-profile-header");
    headerElement.insertBefore(profilePicture, headerElement.firstChild);

    const name = document.getElementById("user-name");
    const email = document.getElementById("user-email");
    const bio = document.getElementById("user-bio");

    name.textContent = `${user.name}`;
    email.textContent = `Email: ${user.email}`;
    bio.textContent = `Bio: ${user.bio}`;
}

const displayProfileEditElements = (userProfile) => {
    const editButtons = userProfile.getElementsByClassName("update-details-button");

    for (let button of editButtons) {
        button.classList.toggle("display-none");
    };
}

const generatePinnedMessagesDropdown = () => {

    // Remove previous list of pinned messages
    // TODO: Needs to be done when navigating away from a channel
    const pinnedMessagesList = document.getElementById("pinned-messages-list");

    while (pinnedMessagesList.firstChild) {
        pinnedMessagesList.lastChild.remove();
    }

    messages.get(currentChannel.id).forEach((message) => {
        if (message.pinned) {
            const sender = userDetails.get(message.sender).name;
            const li = document.createElement("li");
            li.id = "message-list-element";

            const profile = createDynamicProfilePic(sender)
            profile.id = "message-profile";
            li.appendChild(profile);

            const messageBox = document.createElement("div");
            messageBox.className = "message-box";

            const messageElem = document.createElement("div");
            messageElem.id = `message-pin-${currentChannel.id}-${message.id}`;
            messageElem.className = "message-message";

            const messageHeader = document.createElement("div");
            messageHeader.className = "message-header";

            const messageSender = document.createElement("h1");
            messageSender.className = "message-sender";
            messageSender.appendChild(document.createTextNode(sender));
            messageHeader.appendChild(messageSender);

            messageSender.addEventListener('click', () => {
                const userProfile = document.getElementById("user-profile-popup");
                generateProfilePopup(userDetails.get(message.sender));
                elementDisplayToggle(userProfile, "display-none", "display-block");
            });

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

            let messageBody = null;

            if (message.message !== "") {
                messageBody = createMessageTextElement(message.message);
            } else {
                messageBody = createMessageImageElement(message.image, message.id);
            }

            messageBox.appendChild(messageElem);
            messageElem.appendChild(messageHeader);
            messageElem.appendChild(messageBody);
            li.appendChild(messageBox);
            pinnedMessagesList.insertBefore(li, pinnedMessagesList.firstChild); // Prepend
        }
    });

    // If no pinned messages, add element stating such
    if (!pinnedMessagesList.firstChild) {
        const li = document.createElement("li");
        li.id = "message-list-element";
        li.textContent = "This channel doesn't have any pinned messages...";
        pinnedMessagesList.appendChild(li);
    }
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

    // Don't show header buttons
    const headerButtons = document.getElementById("header-buttons");
    headerButtons.className = "display-none";

    // Create join channel button
    const joinChannelButton = document.createElement("button");
    joinChannelButton.id = "join-channel";
    joinChannelButton.append(document.createTextNode("Join Channel"))
    channelHeader.appendChild(joinChannelButton);

    joinChannelButton.addEventListener('click', () => {
        joinChannel(getToken(), currentChannel.id)
        .then((response) => {
            document.getElementById("join-channel").remove();
            headerButtons.className = "display-flex";
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
            const oldChannelId = currentChannel.id;
            currentChannel = channels.get(channel.id);
            loadChannelHeader().then(() => {
                loadChannelMessages();
            });

            // Change colour of old and new channel buttons
            const oldChannelButton = document.getElementById(oldChannelId);
            const newChannelButton = document.getElementById(currentChannel.id);

            oldChannelButton.className = "channel-button background-color-white";
            newChannelButton.className = "channel-button background-color-grey";
        });
        
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
            button.className = "channel-button background-color-grey";
        }

        i++;
    });
}

const loadChannelMessages = () => {
    const ul = document.getElementById("message-list");
    while (ul.firstChild) {
        ul.firstChild.remove()
    }

    // Fix up this mess of code...
    if (messages.has(currentChannel.id) && currentChannel.userIsMember) {
        messages.get(currentChannel.id).forEach((message) => {
            const sender = userDetails.get(message.sender).name;
            const li = document.createElement("li");
            li.id = "message-list-element";

            const profile = createDynamicProfilePic(sender)
            profile.id = "message-profile";
            li.appendChild(profile);

            const messageBox = document.createElement("div");
            messageBox.className = "message-box";

            const messageElem = document.createElement("div");
            messageElem.id = `message-${currentChannel.id}-${message.id}`;
            messageElem.className = "message-message standard-drop-shadow";

            const messageHoverElement = createMessageHoverElement(message, messageElem);
            const reactHoverBox = createReactHoverBox(message.id, messageHoverElement);

            const addReact = messageHoverElement.getElementsByClassName("add-react-icon")[0];
            addReact.addEventListener('click', () => {
                messageHoverElement.style.display = "none";
                reactHoverBox.style.display = "inline-block";
            })

            reactHoverBox.addEventListener('mouseleave', () => {
                reactHoverBox.style.display = "none";
                messageHoverElement.style.display = "inline-block";
            });

            messageBox.insertBefore(messageHoverElement, messageBox.firstChild);
            messageBox.insertBefore(reactHoverBox, messageBox.firstChild);

            const messageHeader = document.createElement("div");
            messageHeader.className = "message-header";

            const messageSender = document.createElement("h1");
            messageSender.className = "message-sender";
            messageSender.appendChild(document.createTextNode(sender));
            messageHeader.appendChild(messageSender);

            messageSender.addEventListener('click', () => {
                const userProfile = document.getElementById("user-profile-popup");
                generateProfilePopup(userDetails.get(message.sender));
                elementDisplayToggle(userProfile, "display-none", "display-block");
            });

            const messageTimeSent = document.createElement("h1");
            messageTimeSent.id = "message-time-sent";
            const dt = timestampToDateTime(message.sentAt);

            const formattedSentAt = `${dt.day}/${dt.month}, ${dt.hour}:${dt.minute} ${dt.period}`
            messageTimeSent.appendChild(document.createTextNode(formattedSentAt));
            messageHeader.appendChild(messageTimeSent);
            
            if (message.edited) {
                createEditedElement(messageHeader);
            }

            let messageBody = null;

            if (message.message !== "") {
                messageBody = createMessageTextElement(message.message);
            } else {
                messageBody = createMessageImageElement(message.image, message.id);
            }

            const messageReactBox = loadMessageReacts(message.reacts, message.id);

            messageBox.appendChild(messageElem);
            messageElem.appendChild(messageHeader);
            messageElem.appendChild(messageBody);
            messageElem.appendChild(messageReactBox);
            li.appendChild(messageBox);
            ul.insertBefore(li, ul.firstChild); // Prepend
        });
    }

    // Set scroll position to bottom of messages section
    const messageSection = document.getElementById("channel-messages");
    messageSection.scrollTop = messageSection.scrollHeight;
}

const createEditedElement = (messageHeader) => {
    const messageEdited = document.createElement("h1");
    messageEdited.id = "message-edited";
    messageEdited.appendChild(document.createTextNode(`(Edited)`));
    messageHeader.appendChild(messageEdited);
}

const createMessageTextElement = (message) => {
    const elem = document.createElement("p");
    elem.className = "message-body";
    elem.appendChild(document.createTextNode(`${message}`));

    return elem;
}

const createMessageImageElement = (image, messageId) => {
    const elem = document.createElement("img");
    elem.className = "message-body image-thumbnail";
    elem.src = image;

    let currentMessageId = messageId;

    elem.addEventListener('click', () => {
        const imageBig = document.getElementById("image-fullsize");
        imageBig.src = image;

        const imagePopup = document.getElementById("image-fullsize-popup");
        elementDisplayToggle(imagePopup, "display-none", "display-block");

        const previousImage = document.getElementById("previous-image");
        const nextImage = document.getElementById("next-image");

        previousImage.addEventListener('click', () => {
            const values = getImage(messages.get(currentChannel.id), currentMessageId, 0);
            imageBig.src = values[0];
            currentMessageId = values[1];   
        });

        nextImage.addEventListener('click', () => {
            const values = getImage(messages.get(currentChannel.id), currentMessageId, 1);
            imageBig.src = values[0];
            currentMessageId = values[1];
        })
    });

    return elem;
}

const createMessageHoverElement = (message, messageElem) => {
    const hoverElem = document.createElement("div");
    hoverElem.className = "message-hover-box";

    const addReact = document.createElement("img");
    addReact.className = "add-react-icon";
    addReact.src = "assets/add-react.svg"
    hoverElem.appendChild(addReact);

    const vl = document.createElement("div");
    vl.className = "vl";
    hoverElem.appendChild(vl);

    if (message.sender === parseInt(getUserId())) {
        createEditDeleteHoverButtons(message.id, hoverElem, vl);
    }

    createPinHoverButton(message, hoverElem, messageElem);

    return hoverElem;
}

const createEditDeleteHoverButtons = (messageId, hoverElem, vl) => {
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "hover-button";
    hoverElem.appendChild(editButton);
    hoverElem.appendChild(vl.cloneNode());


    // TODO: Implement
    editButton.addEventListener('click', () => {
        const body = hoverElem.parentNode.getElementsByClassName("message-body")[0];

        // Occurs when edit button pressed when already editing
        // TODO: Should cancel the edit
        if (body === undefined) {
            return;
        }
        const inputBody = document.createElement("input");
        inputBody.className = "message-body-edit";
        inputBody.value = body.textContent;
        body.parentNode.replaceChild(inputBody, body);


        const confirmTickButton = document.createElement("button");
        confirmTickButton.textContent = "✔️";
        confirmTickButton.className = "confirm-edit-message"
        inputBody.after(confirmTickButton);

        const imageLabel = document.createElement("label");
        imageLabel.htmlFor = "change-message-image";
        imageLabel.className = "image-message change-image-icon";
        
        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.id = "change-message-image";
        imageInput.className = "display-none";
        imageInput.accept = "image/png, image/jpeg, image/jpg"

        imageInput.addEventListener('input', () => {
            inputBody.disabled = "true";
    
        });

        inputBody.after(imageInput);
        inputBody.after(imageLabel);

        confirmTickButton.addEventListener('click', () => {
            
            // Get if message is pinned
            const index = getIndexInArray(messageId, messages.get(currentChannel.id));
            const msg = messages.get(currentChannel.id)[index];

            // Update if text changed
            // TODO: Not immediately changed values correctly of going from img -> text or vice versa
            if (inputBody.value && !inputBody.disabled) {
                if (body.textContent !== inputBody.value) {
                    updateMessage(getToken(), currentChannel.id, messageId, { message: inputBody.value, image: "" })
                    .then(() => {

                        const index = getIndexInArray(messageId, messages.get(currentChannel.id));
                        const message = messages.get(currentChannel.id)[index];

                        // Update body with new message
                        body.replaceWith(createMessageTextElement(inputBody.value));

                        // Update pinned body with new message if pinned
                        if (msg.pinned) {
                            const pinMessage = document.getElementById(`message-pin-${currentChannel.id}-${messageId}`);
                            pinMessage.getElementsByClassName("message-body")[0]
                            .replaceWith(createMessageTextElement(inputBody.value));

                            if (!message.edited)
                                createEditedElement(pinMessage.getElementsByClassName("message-header")[0]);
                        }

                        // Add edited header
                        if (!message.edited) {
                            const ms = document.getElementById(`message-${currentChannel.id}-${messageId}`);
                            createEditedElement(ms.getElementsByClassName("message-header")[0]);
                        }


                        // Update message content in messages map
                        message.message = inputBody.value;
                        message.image = "";
                        message.edited = true;
                        message.editedAt = "";
                    });
                }
            } else if (imageInput.files[0]) {
                fileToDataUrl(imageInput.files[0]).then((response) => {
                    if (body.src !== response) {
                        updateMessage(getToken(), currentChannel.id, messageId, { message: "", image: response })
                        .then(() => {

                            const index = getIndexInArray(messageId, messages.get(currentChannel.id));
                            const message = messages.get(currentChannel.id)[index];

                            // Update body with new message
                            body.replaceWith(createMessageImageElement(response));

                            // Update pinned body with new message
                            if (msg.pinned) {
                                const pinMessage = document.getElementById(`message-pin-${currentChannel.id}-${messageId}`);
                                pinMessage.getElementsByClassName("message-body")[0]
                                .replaceWith(createMessageImageElement(response));

                                if (!message.edited)
                                    createEditedElement(pinMessage.getElementsByClassName("message-header")[0]);
                            }

                            // Add edited header
                            if (!message.edited) {
                                const ms = document.getElementById(`message-${currentChannel.id}-${messageId}`);
                                createEditedElement(ms.getElementsByClassName("message-header")[0]);
                            }

                            // Update message content in messages map
                            message.message = "";
                            message.image = response;
                            message.edited = true;
                            message.editedAt = "";
                        });
                    }
                });
            }

            // Otherwise revert back to old body node
            inputBody.parentNode.replaceChild(body, inputBody);
            imageInput.remove();
            imageLabel.remove();
            confirmTickButton.remove();
        });

    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "hover-button";
    hoverElem.appendChild(deleteButton);
    hoverElem.appendChild(vl.cloneNode());

    deleteButton.addEventListener('click', () => {
        deleteMessage(getToken(), currentChannel.id, messageId)
        .then(() => {
            document.getElementById(`message-${currentChannel.id}-${messageId}`)
            .parentElement.parentElement.remove();

            const pinMessage = document.getElementById(`message-pin-${currentChannel.id}-${messageId}`);

            if (pinMessage) {
                pinMessage.parentElement.parentElement.remove();
            }

            // Remove message from map
            const index = getIndexInArray(messageId, messages.get(currentChannel.id));
            messages.get(currentChannel.id).splice(index, 1);
        });
    });
}

const createPinHoverButton = (message, hoverElem, messageElem) => {
    const pinButton = document.createElement("button");

    if (message.pinned) {
        pinButton.textContent = "Unpin";
        const pinIcon = document.createElement("img");
        pinIcon.className = "pin-icon";
        pinIcon.src = "assets/pin-icon.svg";
        messageElem.appendChild(pinIcon);
    } else {
        pinButton.textContent = "Pin";
    }

    pinButton.className = "hover-button";

    pinButton.addEventListener('click', () => {
        if (pinButton.textContent === "Pin") {
            pinMessage(getToken(), currentChannel.id, message.id)
            .then((response) => {
                message.pinned = true;
                generatePinnedMessagesDropdown();

            });
            pinButton.textContent = "Unpin";

            const pinIcon = document.createElement("img");
            pinIcon.className = "pin-icon";
            pinIcon.src = "assets/pin-icon.svg";
            messageElem.appendChild(pinIcon);
        }
        else {
            unpinMessage(getToken(), currentChannel.id, message.id)
            .then((response) => {
                message.pinned = false;
                generatePinnedMessagesDropdown();
            });
            pinButton.textContent = "Pin";
            messageElem.getElementsByClassName("pin-icon")[0].remove();
        }
    });

    hoverElem.appendChild(pinButton);
}

const createReactHoverBox = (messageId, messageHoverElement) => {
    const reactHoverBox = document.createElement("div");
    reactHoverBox.className = "reaction-hover-box";
    reactHoverBox.style.display = "none";

    const reactions = ["❤️", "😀", "😆", "👍", "👎"];

    reactions.forEach((reaction) => {
        const button = document.createElement("button");
        button.className = "react-button";
        button.textContent = reaction;

        reactHoverBox.appendChild(button);

        button.addEventListener('click', () => {
            // If user already reacted with reaction, unreact, else react
            const index = getIndexInArray(messageId, messages.get(currentChannel.id));
            const message = messages.get(currentChannel.id)[index];

            let indexOfReaction = -1; // Set to index if user already reacted
            for (let i = 0; i < message.reacts.length; i++) {
                if (message.reacts[i].user === parseInt(getUserId()) &&
                    message.reacts[i].react === reaction) {
                        indexOfReaction = i;
                    }
            }

            const messageElement = document.getElementById(`message-${currentChannel.id}-${messageId}`);
            const pinnedMessageElement = document.getElementById(`message-pin-${currentChannel.id}-${messageId}`);
            const messageReactBox = messageElement.getElementsByClassName("message-react-box")[0];
            //const pinnedMessageReactBox = pinnedMessageElement.getElementsByClassName("message-react-box")[0];

            if (indexOfReaction === -1) {
                reactMessage(getToken(), currentChannel.id, messageId, reaction)
                .then((response) => {
                    message.reacts.push({ user: parseInt(getUserId()), react: reaction });

                    const newReactBox = loadMessageReacts(message.reacts, message.id);
                    messageReactBox.replaceWith(newReactBox);
                    //pinnedMessageReactBox.replaceWith(newReactBox);
                });
            } else {
                unreactMessage(getToken(), currentChannel.id, messageId, reaction)
                .then((response) => {
                    message.reacts.splice(indexOfReaction, 1);
                    const newReactBox = loadMessageReacts(message.reacts, message.id);
                    messageReactBox.replaceWith(newReactBox);
                    //pinnedMessageReactBox.replaceWith(newReactBox);
                });
            }

            reactHoverBox.style.display = "none";
            messageHoverElement.style.display = "inline-block";
        });
    });

    return reactHoverBox;
}

const loadMessageReacts = (reactions, messageId) => {
    const reacts = new Map();
    
    reactions.forEach((reaction) => {
        if (reacts.has(reaction.react)) {
            const reactObj = reacts.get(reaction.react);
            reactObj.count++;
            reactObj.users.push(reaction.user);
            reacts.set(reaction.react, reactObj);
        } else {
            const reactObj = {
                react: reaction.react,
                count: 1,
                users: [reaction.user]
            }

            reacts.set(reaction.react, reactObj);
        }
    });

    const messageReactBox = document.createElement("div");
    messageReactBox.className = "message-react-box";

    reacts.forEach((react) => {
        const messageReact = document.createElement("div");
        messageReact.className = "message-react transparent-border";
        messageReact.id = `${react.react}`

        // Outline reaction if user has reacted with that reaction
        if (react.users.includes(parseInt(getUserId()))) {
            messageReact.classList.remove("transparent-border");
            messageReact.classList.add("blue-border");
        }

        // TODO: Repeated, fix
        let indexOfReaction = -1; // Set to index if user already reacted
        for (let i = 0; i < reactions.length; i++) {
            if (reactions[i].user === parseInt(getUserId()) &&
                reactions[i].react === react) {
                    indexOfReaction = i;
                }
        }

        const reaction = document.createElement("div");
        reaction.className = "react";
        reaction.appendChild(document.createTextNode(react.react));

        const reactionCount = document.createElement("div");
        reactionCount.className = "react-count"
        reactionCount.appendChild(document.createTextNode(react.count));

        messageReact.addEventListener('click', () => {
            if (messageReact.classList.contains("transparent-border")) {
                messageReact.classList.remove("transparent-border");
                messageReact.classList.add("blue-border");
                reactionCount.textContent = (parseInt(reactionCount.textContent) + 1).toString();
                reactMessage(getToken(), currentChannel.id, messageId, reaction.textContent)
                .then(() => {
                    reactions.push({ user: parseInt(getUserId()), react: reaction });
                });
            } else {
                messageReact.classList.remove("blue-border");
                messageReact.classList.add("transparent-border");
                reactionCount.textContent = (parseInt(reactionCount.textContent) - 1).toString();
                unreactMessage(getToken(), currentChannel.id, messageId, reaction.textContent)
                .then(() => {
                    reactions.splice(indexOfReaction, 1);
                });
                
                if ((parseInt(reactionCount.textContent)) === 0) {
                    messageReact.remove();
                }
            }
        });

        messageReact.appendChild(reaction);
        messageReact.appendChild(reactionCount);
        messageReactBox.appendChild(messageReact);
    })

    return messageReactBox;
}